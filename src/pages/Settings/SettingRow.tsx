import styles from './Settings.module.css'

const statusTone = (s: string) =>
  s === '异常'
    ? 'red'
    : s.includes('启用') || s.includes('正常') || s.includes('已配置')
      ? 'green'
      : 'orange'

export function SettingRow({
  name,
  desc,
  status,
  middle,
  actionLabel,
  onEdit,
}: {
  name: string
  desc: string
  status?: string
  middle?: string
  actionLabel: string
  onEdit: () => void
}) {
  const simple = !middle && !status

  return (
    <div className={`${styles.settingRow} ${simple ? styles.settingRowSimple : ''}`}>
      <span>
        <b>{name}</b>
        <br />
        <small className="muted">{desc}</small>
      </span>
      {middle ? <span>{middle}</span> : null}
      {status ? <span className={`pill ${statusTone(status)}`}>{status}</span> : null}
      <button className="btn link" onClick={onEdit}>
        {actionLabel} →
      </button>
    </div>
  )
}
