import type { ComponentType } from 'react'
import type { SettingId } from '../../../data/settings'
import AccountsSetting from './AccountsSetting'
import ProductSetting from './ProductSetting'
import RiskSetting from './RiskSetting'
import TrackingSetting from './TrackingSetting'
import FutureSourcesSetting from './FutureSourcesSetting'
import PermissionsSetting from './PermissionsSetting'
import AuditSetting from './AuditSetting'
import TwitterSetting from './TwitterSetting'

export const SETTING_ITEMS: Record<SettingId, ComponentType> = {
  twitter: TwitterSetting,
  accounts: AccountsSetting,
  product: ProductSetting,
  risk: RiskSetting,
  tracking: TrackingSetting,
  futureSources: FutureSourcesSetting,
  permissions: PermissionsSetting,
  audit: AuditSetting,
}
