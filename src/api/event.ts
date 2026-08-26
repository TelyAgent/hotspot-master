import { request } from './client'
import type { EventItem, EventLabel } from '../data/types'

export interface EventListParams {
  page?: number
  pageSize?: number
  status?: string
  label?: string
  q?: string
}

export interface EventListResponse {
  items: EventItem[]
  total: number
  page: number
  pageSize: number
}

interface V2EventResponse {
  id: string
  title: string
  eventType: string
  summary: string
  occurredAt?: string | null
  evidenceRefs?: unknown
  missingData?: unknown
  riskNotes?: unknown
  confidence?: string
  labels?: unknown
  status: 'suggested' | 'confirmed' | 'ignored' | 'archived' | string
  createdAt?: string
  updatedAt?: string
}

interface V2EvidenceResponse {
  id: string
  sourceType: string
  claim: string
  text?: string | null
  url?: string | null
  author?: string | null
  metadata?: unknown
}

interface V2EventListResponse {
  items: V2EventResponse[]
  total: number
  page: number
  pageSize: number
}

/** 获取 v2 事件热点列表（分页 + 状态筛选 + 关键词搜索） */
export async function getEvents(params: EventListParams = {}): Promise<EventListResponse> {
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.max(params.pageSize ?? 20, 1)
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (params.status) query.set('status', params.status)
  if (params.label) query.set('label', params.label)

  const response = await request<V2EventListResponse>(`/opportunities/events?${query.toString()}`)
  const rows = response.items
  const evidenceById = await fetchEvidenceByRefs(rows.flatMap((item) => stringArray(item.evidenceRefs)))
  const q = params.q?.trim().toLowerCase()

  const filtered = rows
    .map((item) => mapV2EventToEventItem(item, evidenceById))
    .filter((item) => {
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.trigger.toLowerCase().includes(q)
      )
    })

  return {
    items: filtered,
    total: q ? filtered.length : response.total,
    page: response.page,
    pageSize: response.pageSize,
  }
}

export function mapV2EventToEventItem(
  item: V2EventResponse,
  evidenceById: Map<string, V2EvidenceResponse> = new Map(),
): EventItem {
  const evidenceRefs = stringArray(item.evidenceRefs)
  const missingData = stringArray(item.missingData)
  const riskNotes = stringArray(item.riskNotes)
  const verify = missingData.length || riskNotes.length || item.confidence === 'low' ? '存在冲突' : '信息一致'

  return {
    id: item.id,
    title: item.title,
    summary: item.summary || '暂无摘要',
    eventType: item.eventType,
    confidence: item.confidence,
    occurredAt: item.occurredAt ?? null,
    rawStatus: item.status,
    status: mapEventStatus(item.status),
    verify,
    regions: '—',
    trigger: formatTrigger(item),
    urls: [],
    labels: eventLabels(item.labels),
    evidence: evidenceRefs.map((ref) => mapEvidenceRef(ref, evidenceById.get(ref))),
    related: [],
  }
}

async function fetchEvidenceByRefs(refs: string[]) {
  const ids = Array.from(new Set(refs)).filter(Boolean)
  if (!ids.length) return new Map<string, V2EvidenceResponse>()

  const items = await request<V2EvidenceResponse[]>(
    `/signals/evidence?ids=${encodeURIComponent(ids.join(','))}`,
  )
  const evidenceByRef = new Map(items.map((item) => [item.id, item]))
  const unresolvedRefs = ids.filter((id) => !evidenceByRef.has(id)).slice(0, 20)

  const signalEvidence = await Promise.all(
    unresolvedRefs.map(async (id) => {
      try {
        const signalItems = await request<V2EvidenceResponse[]>(
          `/signals/${encodeURIComponent(id)}/evidence?take=5`,
        )
        const bestEvidence = signalItems.find((item) => item.url) ?? signalItems[0]
        return bestEvidence ? ([id, bestEvidence] as const) : null
      } catch {
        return null
      }
    }),
  )

  signalEvidence.forEach((entry) => {
    if (entry) evidenceByRef.set(entry[0], entry[1])
  })

  return evidenceByRef
}

function mapEvidenceRef(ref: string, evidence?: V2EvidenceResponse) {
  if (!evidence) {
    return {
      sourceType: 'evidence_ref',
      claim: '证据详情待同步',
    }
  }

  const claim = evidence.text || evidence.claim || evidence.url || '证据详情待同步'
  return {
    sourceType: evidence.sourceType,
    claim: isOpaqueId(claim) ? '证据详情待同步' : claim,
    url: evidence.url ?? undefined,
    metadata: evidence.metadata,
  }
}

function isOpaqueId(value: string) {
  return /^c[a-z0-9]{18,}$/i.test(value.trim())
}

function mapEventStatus(status: string) {
  const labels: Record<string, string> = {
    suggested: '内容生成中',
    confirmed: '待发布',
    ignored: '已完成',
    archived: '已完成',
  }
  return labels[status] ?? '内容生成中'
}

function formatTrigger(item: V2EventResponse) {
  const parts = ['热点挖掘 Agent']
  if (item.eventType) parts.push(item.eventType)
  if (item.confidence) parts.push(`置信度 ${formatConfidence(item.confidence)}`)
  if (item.occurredAt) parts.push(new Date(item.occurredAt).toLocaleString('zh-CN', { hour12: false }))
  return parts.join(' / ')
}

function formatConfidence(value: string) {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return labels[value] ?? value
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function eventLabels(value: unknown): EventLabel[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.code !== 'string' || typeof item.name !== 'string') return []
    return [{
      code: item.code,
      name: item.name,
      category: typeof item.category === 'string' ? item.category : 'trigger',
      sourcePath: typeof item.sourcePath === 'string' ? item.sourcePath : null,
      evidenceRefs: stringArray(item.evidenceRefs),
      reason: typeof item.reason === 'string' ? item.reason : undefined,
      confidence: typeof item.confidence === 'string' ? item.confidence : undefined,
    }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
