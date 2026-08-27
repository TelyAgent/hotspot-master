import type { ComponentType } from 'react'
import type { SettingId } from '../../../data/settings'
import OpportunityRulesSetting from './OpportunityRulesSetting'
import TwitterSetting from './TwitterSetting'

export const SETTING_ITEMS: Record<SettingId, ComponentType> = {
  twitter: TwitterSetting,
  opportunityRules: OpportunityRulesSetting,
}
