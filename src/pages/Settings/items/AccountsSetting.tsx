import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Alert, Empty, Input, Spin } from 'antd'
import { useApp } from '../../../context/AppContext'
import { useSettings } from '../../../hooks/useSettings'
import type { SettingItem } from '../../../api/settings'
import { ConfigFieldInput, type ConfigField } from '../ConfigField'
import { SettingRow } from '../SettingRow'
import styles from '../Settings.module.css'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '账号类型', defaultValue: '快讯型' },
  { key: 'xAccountId', label: 'X账号ID', defaultValue: '@configured_account' },
  {
    key: 'personaType',
    label: '人设描述',
    type: 'textarea',
    defaultValue: '值班新闻编辑型账号：反应快、表述克制、只把已确认的核心事实讲清楚，不做情绪化延展。',
  },
  {
    key: 'contentPromptRule',
    label: '内容生成规则提示词描述',
    type: 'textarea',
    defaultValue: '先给结论，再补充时间、地点、主体、动作和证据边界；只使用已确认事实，不扩写情绪、不做未经证实的因果判断。',
  },
]

export default function AccountsSetting() {
  const { openModal, closeModal, toast } = useApp()
  const { items, loading, error, reload, update } = useSettings('accounts')
  const formRef = useRef<AccountConfigFormHandle>(null)

  const openConfig = (item: SettingItem) => {
    openModal(
      `配置 · ${item.name}`,
      <AccountConfigForm
        ref={formRef}
        item={item}
        onSave={async (payload) => {
          await update(item.id, payload)
          toast('账号配置已保存')
          reload()
          closeModal()
        }}
      />,
      false,
      'default',
      {
        label: '保存',
        onConfirm: async () => {
          const ok = await formRef.current?.save()
          if (!ok) toast('请输入账号类型')
        },
      },
    )
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>运营账号与 Skills</h2>
            <p className="small">配置 12 个预设运营账号的发布身份、人设、内容生成规则和 Skill。</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Spin tip="正在加载账号配置…" />
      ) : error ? (
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      ) : items.length === 0 ? (
        <Empty description="暂无运营账号配置" />
      ) : (
        <div className={styles.accountList}>
          {items.map((item) => (
            <SettingRow
              key={item.id}
              name={item.name}
              desc={String(item.description ?? item.personaType ?? '')}
              actionLabel="配置/修改"
              onEdit={() => openConfig(item)}
            />
          ))}
        </div>
      )}

      <Alert
        style={{ marginTop: 12 }}
        message="这个分区承担什么作用？"
        description="一个自动响应 Event 会先进入三条基础生产线；其余人设账号再按各自 Skill 判断参与、观察或跳过。"
        showIcon
      />
    </section>
  )
}

interface AccountConfigFormHandle {
  save: () => Promise<boolean>
}

const AccountConfigForm = forwardRef<AccountConfigFormHandle, {
  item: SettingItem
  onSave: (payload: { name: string; fields: Record<string, string> }) => Promise<void>
}>(function AccountConfigForm({ item, onSave }, ref) {
  const nameField = FIELDS[0]
  const restFields = FIELDS.slice(1)
  const [name, setName] = useState(String(item.name ?? ''))
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {}
    restFields.forEach((field) => {
      const raw = item[field.key]
      next[field.key] = typeof raw === 'string' ? raw : field.key === 'personaType' ? String(item.description ?? '') : (field.defaultValue ?? '')
    })
    return next
  })

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!name.trim()) return false
        await onSave({ name: name.trim(), fields: values })
        return true
      },
    }),
    [name, onSave, values],
  )

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>{nameField.label}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {restFields.map((field) => (
          <ConfigFieldInput
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
          />
        ))}
      </div>
    </div>
  )
})
