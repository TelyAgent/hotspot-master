import { Button, Tag } from 'antd'
import styles from './Settings.module.css'

const statusTone = (s: string) =>
  s === '异常'
    ? 'error'
    : s.includes('启用') || s.includes('正常') || s.includes('已配置')
      ? 'success'
      : 'warning'

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
      {status ? <Tag color={statusTone(status)}>{status}</Tag> : null}
      <Button type="link" onClick={onEdit}>
        {actionLabel}
      </Button>
    </div>
  )
}
