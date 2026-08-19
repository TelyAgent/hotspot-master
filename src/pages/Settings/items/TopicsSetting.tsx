import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '主题名称', defaultValue: '' },
  { key: 'keywords', label: '语义关键词', defaultValue: '' },
  { key: 'positiveExamples', label: '正例Event', defaultValue: '' },
  { key: 'negativeExamples', label: '反例Event', defaultValue: '' },
  { key: 'action', label: '命中动作', defaultValue: '立即自动响应' },
  { key: 'accounts', label: '关注账号', type: 'list', defaultValue: '' },
]

export default function TopicsSetting() {
  return <SettingPanel category="topics" title="重点主题" fields={FIELDS} />
}
