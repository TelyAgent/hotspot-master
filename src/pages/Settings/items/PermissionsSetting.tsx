import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'role', label: '角色/策略', defaultValue: '普通运营' },
  { key: 'scope', label: '权限范围', defaultValue: '选择、复制、回填、一般异常' },
  { key: 'overridable', label: '可人工覆盖对象', defaultValue: '按角色限制' },
  { key: 'effectiveOn', label: '规则生效', defaultValue: '新Event/新帖子' },
  { key: 'auditRequirement', label: '审计要求', defaultValue: '记录操作者、原因与版本' },
]

export default function PermissionsSetting() {
  return <SettingPanel category="permissions" title="权限与版本" fields={FIELDS} />
}
