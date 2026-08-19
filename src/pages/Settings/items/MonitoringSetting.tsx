import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'ruleName', label: '规则名称', defaultValue: '前5触发' },
  { key: 'regions', label: '适用地区', defaultValue: 'Worldwide / US / UK / Japan / Korea' },
  { key: 'threshold', label: '阈值', defaultValue: '进入前5' },
  { key: 'compareWindow', label: '比较窗口', defaultValue: '相邻两次成功小时快照' },
  { key: 'action', label: '命中动作', defaultValue: '形成/归并Event并自动响应' },
]

export default function MonitoringSetting() {
  return <SettingPanel category="monitoring" title="监控与触发规则" fields={FIELDS} />
}
