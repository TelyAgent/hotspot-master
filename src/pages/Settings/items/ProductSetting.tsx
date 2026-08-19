import { SettingPanel } from '../SettingPanel'
import type { ConfigField } from '../ConfigField'

const FIELDS: ConfigField[] = [
  { key: 'name', label: '资料名称', defaultValue: '产品基础信息' },
  { key: 'url', label: '产品/页面URL', defaultValue: 'https://predx.example.com/markets/...' },
  { key: 'targetUsers', label: '目标用户', defaultValue: '关注时事、体育、加密与宏观的用户' },
  { key: 'capability', label: '可承接能力', defaultValue: '真实存在的预测市场与概率信息' },
  { key: 'forbidden', label: '禁止表达', defaultValue: '收益承诺、虚构市场、确定性结果' },
  { key: 'lastSync', label: '最近同步', defaultValue: '2026-08-13 10:00' },
]

export default function ProductSetting() {
  return <SettingPanel category="product" title="产品资料" fields={FIELDS} />
}
