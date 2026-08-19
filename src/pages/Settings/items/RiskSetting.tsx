import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '风险名称', defaultValue: '平台规则风险' },
  { key: 'rule', label: '识别规则', defaultValue: '重复、垃圾信息、受限表达' },
  { key: 'lowAction', label: '低风险动作', defaultValue: '正常交付' },
  { key: 'midAction', label: '中风险动作', defaultValue: '自动改写并重检，最多3次' },
  { key: 'highAction', label: '高风险动作', defaultValue: '禁止复制，人工处理' },
  { key: 'afterRelease', label: '解除后', defaultValue: '必须重新预检' },
]

export default function RiskSetting() {
  return <SettingPanel category="risk" title="风险与预检" fields={FIELDS} />
}
