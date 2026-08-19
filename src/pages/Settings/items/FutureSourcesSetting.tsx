import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '来源名称', defaultValue: 'BLS官方日历' },
  { key: 'url', label: '来源URL', defaultValue: 'https://official-source.example/calendar' },
  { key: 'method', label: '接入方式', defaultValue: 'API / RSS / iCal / 官方网页' },
  { key: 'evidenceLevel', label: '默认证据等级', defaultValue: 'A' },
  { key: 'syncFrequency', label: '同步频率', defaultValue: '正常' },
  { key: 'maxStale', label: '最大陈旧时间', defaultValue: '按距离事件自动调整' },
]

export default function FutureSourcesSetting() {
  return <SettingPanel category="futureSources" title="排期事件源" fields={FIELDS} />
}
