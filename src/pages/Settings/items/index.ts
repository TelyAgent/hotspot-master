import type { ComponentType } from 'react'
import type { SettingId } from '../../../data/settings'
import OpportunityRulesSetting from './OpportunityRulesSetting'
import KolRadarSetting from './KolRadarSetting'
import TwitterSetting from './TwitterSetting'

export const SETTING_ITEMS: Record<SettingId, ComponentType> = {
  twitter: TwitterSetting,
  kolRadar: KolRadarSetting,
  opportunityRules: OpportunityRulesSetting,
}
