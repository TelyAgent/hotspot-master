import { useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { useSettings } from '../../../hooks/useSettings'
import type { SettingItem } from '../../../api/settings'
import { ConfigFieldInput, type ConfigField } from '../ConfigField'
import { SettingRow } from '../SettingRow'
import styles from '../Settings.module.css'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '账号类型', defaultValue: '快讯型' },
  { key: 'xAccountId', label: 'X账号ID', defaultValue: '@configured_account' },
  { key: 'personaType', label: '人设类型', type: 'textarea', defaultValue: '把热点压缩为可快速扫描的单一事实更新' },
]

export default function AccountsSetting() {
  const { openModal, closeModal, toast } = useApp()
  const { items, loading, error, reload, update } = useSettings('accounts')

  const openConfig = (item: SettingItem) => {
    openModal(
      `配置 · ${item.name}`,
      <AccountConfigForm
        item={item}
        onSave={async (payload) => {
          await update(item.id, payload)
          toast('账号配置已保存')
          reload()
          closeModal()
        }}
      />,
      false,
    )
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>运营账号与 Skills</h2>
            <p className="small">基础生产线与九个人设账号的发布身份、Skill 和适用场景。</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="note">正在加载账号配置…</div>
      ) : error ? (
        <div className="note warning">加载失败：{error}</div>
      ) : items.length === 0 ? (
        <div className="note">暂无运营账号配置</div>
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

      <div className="note">
        <b>这个分区承担什么作用？</b>
        <br />
        一个自动响应 Event 会先进入三条基础生产线；九个人设账号再按各自 Skill 判断参与、观察或跳过。
      </div>
    </section>
  )
}

function AccountConfigForm({
  item,
  onSave,
}: {
  item: SettingItem
  onSave: (payload: { name: string; fields: Record<string, string> }) => Promise<void>
}) {
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

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>{nameField.label}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
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
      <div className="actions right">
        <button className="btn primary" onClick={() => onSave({ name: name.trim(), fields: values })}>
          保存
        </button>
      </div>
    </div>
  )
}
