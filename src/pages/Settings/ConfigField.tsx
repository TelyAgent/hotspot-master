export type ConfigFieldType = 'text' | 'textarea' | 'select' | 'list'

export interface ConfigField {
  // 字段 key：后续对接服务端接口时作为 payload 字段名
  key: string
  label: string
  type?: ConfigFieldType
  defaultValue?: string
  options?: string[] // type === 'select' 时使用
}

export function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="field">
      <label>{field.label}</label>
      {field.type === 'list' ? (
        <ListInput value={value} onChange={onChange} />
      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function ListInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const items = value ? value.split('\n') : ['']

  const update = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next.join('\n'))
  }

  const add = () => onChange([...items, ''].join('\n'))

  const remove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i)
    onChange(next.length ? next.join('\n') : '')
  }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder="@handle"
            style={{ flex: 1 }}
          />
          <button type="button" className="btn" onClick={() => remove(i)}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn" onClick={add}>
        + 添加账号
      </button>
    </div>
  )
}
