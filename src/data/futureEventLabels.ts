import type {
  ConfirmationLevel,
  ExpressionBoundary,
  FutureSourceType,
  SchedulePrecision,
} from '../api/futureEvents'

export const CONFIRMATION_LABEL: Record<ConfirmationLevel, string> = {
  fixed: '周期固定',
  confirmed: '官方已确认',
  expected: '可靠预期',
  needs_verification: '待核验',
  changed: '已改期',
  cancelled: '已取消',
}

export const PRECISION_LABEL: Record<SchedulePrecision, string> = {
  exact_time: '精确时间',
  date: '日期',
  date_range: '日期范围',
  season_cycle: '周期/季节',
  unknown: '时间未知',
}

export const BOUNDARY_LABEL: Record<ExpressionBoundary, string> = {
  factual: '可陈述事实',
  qualified: '需限定表达',
  internal_only: '仅内部',
  blocked: '已阻止',
}

export const SOURCE_LABEL: Record<FutureSourceType, string> = {
  opm: 'OPM 联邦假日',
  bea: 'BEA 发布',
  bls: 'BLS 发布',
  fomc: 'FOMC 会议',
  manual: '人工导入',
}

export interface ScoreBand {
  key: 'observe' | 'reserve' | 'planning' | 'worth_response' | 'auto_response'
  label: string
}

/** Action Score 总分 → 建议状态带（SPEC §9） */
export function scoreBand(total: number): ScoreBand {
  if (total >= 90) return { key: 'auto_response', label: '自动响应' }
  if (total >= 75) return { key: 'worth_response', label: '值得响应' }
  if (total >= 60) return { key: 'planning', label: '计划' }
  if (total >= 40) return { key: 'reserve', label: '储备' }
  return { key: 'observe', label: '观察' }
}
