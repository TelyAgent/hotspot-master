import { request } from './client'

/** 确认状态（Confirmation Level） */
export type ConfirmationLevel =
  | 'fixed'
  | 'confirmed'
  | 'expected'
  | 'needs_verification'
  | 'changed'
  | 'cancelled'

/** 时间精度（Schedule Precision） */
export type SchedulePrecision =
  | 'exact_time'
  | 'date'
  | 'date_range'
  | 'season_cycle'
  | 'unknown'

/** 表达边界（Expression Boundary） */
export type ExpressionBoundary =
  | 'factual'
  | 'qualified'
  | 'internal_only'
  | 'blocked'

/** 首版来源类型 */
export type FutureSourceType = 'opm' | 'bea' | 'bls' | 'fomc' | 'manual'

/** 首次进入方式（entry_mode） */
export type EntryMode =
  | 'trend_trigger'
  | 'scheduled_manual_response'
  | 'scheduled_auto_response'

export interface EvidenceRecord {
  id: string
  url: string
  sourceType: FutureSourceType
  verifiedAt: string
  claims: string[]
  originalId?: string
}

export interface EventWindow {
  monitoring: [string, string] | null
  preheat: [string, string] | null
  live: [string, string] | null
  followUp: [string, string] | null
}

export interface ActionScore {
  total: number
  impact: { scope: number; relevance: number; outcomeImportance: number }
  evidence: number
  heatMomentum: number
  timeUrgency: number
  contentReadiness: number
  version: string
}

export interface PostCountBucket {
  startAt: string
  endAt: string
  count: number
}

export interface FutureEventHeat {
  query: string
  queryVersion: string
  monitoringStartedAt: string | null
  buckets: PostCountBucket[]
  last6h: number
  prev6h: number
  growthPct: number | null
  intensityMultiple: number | null
  cumulative: number
}

export interface FutureEvent {
  id: string
  title: string
  subject: string
  eventType: string
  factTime: string | null
  timezone: string
  schedulePrecision: SchedulePrecision
  confirmationLevel: ConfirmationLevel
  expressionBoundary: ExpressionBoundary
  evidence: EvidenceRecord[]
  windows: EventWindow
  actionScore: ActionScore
  heat: FutureEventHeat
  relatedEventId: string | null
  entryMode: EntryMode | null
  ruleVersion: string
  createdAt: string
  updatedAt: string
}

export interface SourceSyncStatus {
  source: FutureSourceType
  enabled: boolean
  lastSyncAt: string | null
  status: 'ok' | 'error' | 'disabled' | 'pending'
  nextSyncAt: string | null
  message?: string
}

export interface FutureEventListParams {
  month?: string
  unassigned?: boolean
  confirmationLevel?: ConfirmationLevel
  sourceType?: FutureSourceType
  actionScoreMin?: number
}

export interface CreateFutureEventPayload {
  title: string
  subject?: string
  eventType?: string
  factTime?: string | null
  timezone?: string
  schedulePrecision?: SchedulePrecision
  sourceUrl: string
  attentionReason?: string
}

export type UpdateFutureEventPayload = Partial<CreateFutureEventPayload>

export type FutureEventRespondKind = 'content' | 'campaign'

export interface FutureEventRespondResponse {
  eventId: string
  next: 'content' | 'campaign'
}

/** 未来事件列表（可按月份 / 确认状态 / 来源 / 分数下限筛选） */
export function getFutureEvents(
  params: FutureEventListParams = {},
): Promise<FutureEvent[]> {
  const q = new URLSearchParams()
  if (params.month) q.set('month', params.month)
  if (params.unassigned) q.set('unassigned', 'true')
  if (params.confirmationLevel) q.set('confirmationLevel', params.confirmationLevel)
  if (params.sourceType) q.set('sourceType', params.sourceType)
  if (params.actionScoreMin != null) q.set('actionScoreMin', String(params.actionScoreMin))
  const qs = q.toString()
  return request<FutureEvent[]>(`/future-events${qs ? `?${qs}` : ''}`)
}

/** 未来事件详情 */
export function getFutureEvent(id: string): Promise<FutureEvent> {
  return request<FutureEvent>(`/future-events/${id}`)
}

/** 热力数据（Post Count 6h 桶 + 派生指标） */
export function getFutureEventHeat(id: string): Promise<FutureEventHeat> {
  return request<FutureEventHeat>(`/future-events/${id}/heat`)
}

/** 各来源同步状态（CAP-1 / AC-16） */
export function getSourceSyncStatus(): Promise<SourceSyncStatus[]> {
  return request<SourceSyncStatus[]>('/future-events/sources/status')
}

/** 人工导入未来事件（来源链接必填，默认 needs_verification） */
export function createFutureEvent(
  data: CreateFutureEventPayload,
): Promise<FutureEvent> {
  return request<FutureEvent>('/future-events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateFutureEvent(
  id: string,
  data: UpdateFutureEventPayload,
): Promise<FutureEvent> {
  return request<FutureEvent>(`/future-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteFutureEvent(id: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/future-events/${id}`, { method: 'DELETE' })
}

/** 重新同步某个来源（局部恢复） */
export function resyncSource(
  source: FutureSourceType,
): Promise<{ status: string }> {
  return request<{ status: string }>(
    `/future-events/sources/${source}/resync`,
    { method: 'POST' },
  )
}

/** 运营排期手动响应：创建/复用 scheduled_manual_response Event 并进入下游 */
export function respondFutureEvent(
  id: string,
  kind: FutureEventRespondKind,
): Promise<FutureEventRespondResponse> {
  return request<FutureEventRespondResponse>(`/future-events/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ kind }),
  })
}

export interface ImportFutureEventsPayload {
  csv: string
}

export interface ImportFutureEventsResponse {
  imported: number
  skipped: number
  events: FutureEvent[]
}

/** 批量导入未来事件（CSV 文本） */
export function importFutureEvents(
  data: ImportFutureEventsPayload,
): Promise<ImportFutureEventsResponse> {
  return request<ImportFutureEventsResponse>('/future-events/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
