import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '账号名称', defaultValue: 'WatcherGuru快讯号' },
  { key: 'xAccountId', label: 'X账号ID', defaultValue: '@configured_account' },
  { key: 'type', label: '账号类型', defaultValue: '快讯型 · 全量覆盖' },
  { key: 'skill', label: '绑定Skill', defaultValue: 'content-operator/SKILL.md' },
  { key: 'frequency', label: '建议频率', defaultValue: '10–15条/日或按Skill' },
  { key: 'onFailure', label: '不可用处理', defaultValue: '保留任务并上报异常' },
]

export default function AccountsSetting() {
  return <SettingPanel category="accounts" title="账号与 Skills" fields={FIELDS} />
}
