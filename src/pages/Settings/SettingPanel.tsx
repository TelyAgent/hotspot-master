import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useSettings } from '../../hooks/useSettings'
import type { SettingItem } from '../../api/settings'
import { settingHelp } from '../../data/settings'
import { ConfigFieldInput, type ConfigField } from './ConfigField'
import { SettingRow } from './SettingRow'
import styles from './Settings.module.css'

export function SettingPanel({
  category,
  title,
  fields,
  middle = '配置对象',
}: {
  category: string
  title: string
  fields: ConfigField[]
  middle?: string
}) {
  const { openModal, closeModal, toast } = useApp()
  const { items, loading, error, reload, create, update } = useSettings(category)
  const formRef = useRef<ConfigFormHandle>(null)

  const openConfig = (item?: SettingItem) => {
    openModal(
      `${item ? '配置' : '新增'} · ${title}`,
      <ConfigForm
        ref={formRef}
        fields={fields}
        item={item}
        onSave={async (payload) => {
          if (item) await update(item.id, payload)
          else await create(payload)
          toast('已保存')
          reload()
        }}
      />,
      false,
      'default',
      {
        label: '保存',
        onConfirm: async () => {
          const ok = await formRef.current?.save()
          if (ok) closeModal()
          else toast('请输入名称')
        },
      },
    )
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>{title}</h2>
            <p className="small">点击任一行查看并修改该对象的完整配置版式。</p>
          </div>
          <button className="btn primary" onClick={() => openConfig()}>
            +新增
          </button>
        </div>
      </div>

      {loading ? (
        <div className="note">正在加载…</div>
      ) : error ? (
        <div className="note warning">加载失败：{error}</div>
      ) : items.length === 0 ? (
        <div className="note">暂无配置项</div>
      ) : (
        items.map((it) => (
          <SettingRow
            key={it.id}
            name={it.name}
            desc={it.description ?? ''}
            status={it.enabled ? '启用' : '停用'}
            middle={middle}
            actionLabel="配置/修改"
            onEdit={() => openConfig(it)}
          />
        ))
      )}

      <div className="note">
        <b>这个分区承担什么作用？</b>
        <br />
        {settingHelp[category as keyof typeof settingHelp]}
      </div>
    </section>
  )
}

export interface ConfigFormHandle {
  save: () => Promise<boolean>
}

const ConfigForm = forwardRef<
  ConfigFormHandle,
  {
    fields: ConfigField[]
    item?: SettingItem
    onSave: (payload: { name: string; enabled: boolean; fields: Record<string, string> }) => Promise<void>
  }
>(({ fields, item, onSave }, ref) => {
  const nameField = fields[0]
  const restFields = fields.slice(1)

  const [name, setName] = useState(item?.name ?? nameField?.defaultValue ?? '')
  const [enabled, setEnabled] = useState(item?.enabled ?? true)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    restFields.forEach((f) => {
      const raw = item?.[f.key]
      v[f.key] = typeof raw === 'string' ? raw : (f.defaultValue ?? '')
    })
    return v
  })

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!name.trim()) return false
        await onSave({ name: name.trim(), enabled, fields: values })
        return true
      },
    }),
    [name, enabled, values, onSave],
  )

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>{nameField.label}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {restFields.map((f) => (
          <ConfigFieldInput
            key={f.key}
            field={f}
            value={values[f.key] ?? ''}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}
        <div className="field">
          <label>启用状态</label>
          <select value={enabled ? '启用' : '停用'} onChange={(e) => setEnabled(e.target.value === '启用')}>
            <option>启用</option>
            <option>停用</option>
          </select>
        </div>
      </div>
      <div className="note">
        <b>保存影响</b>
        <br />
        保存后立即生效。
      </div>
    </div>
  )
})
