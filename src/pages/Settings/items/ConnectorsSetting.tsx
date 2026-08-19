import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '接口名称', defaultValue: 'X榜单API' },
  { key: 'baseUrl', label: 'Base URL', defaultValue: 'https://api.provider.example/v1' },
  { key: 'authMethod', label: '认证方式', defaultValue: 'API Key（加密保存）' },
  { key: 'syncFrequency', label: '同步频率', defaultValue: '每1小时' },
  { key: 'timeoutRetry', label: '超时与重试', defaultValue: '30秒 · 最多3次' },
  { key: 'fallback', label: '失败降级', defaultValue: '保留上次成功快照并告警' },
]

export default function ConnectorsSetting() {
  return (
    <SettingPanel category="connectors" title="接口与数据源" fields={FIELDS} middle="上次10:00" />
  )
}
