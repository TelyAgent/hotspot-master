import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'ruleName', label: '规则名称', defaultValue: '发布后0–24小时' },
  { key: 'timeRange', label: '时间范围', defaultValue: '数据抓取频率' },
  { key: 'value', label: '执行值', defaultValue: '每2小时' },
  { key: 'metrics', label: '必需指标', defaultValue: '浏览、点赞、回复、转发' },
  { key: 'onFailure', label: '接口失败', defaultValue: '发布完成 + 追踪异常' },
  { key: 'goodExtend', label: '表现良好延长', defaultValue: '延长至14天' },
]

export default function TrackingSetting() {
  return <SettingPanel category="tracking" title="发布与数据追踪" fields={FIELDS} />
}
