export type PageId =
  | 'overview'
  | 'monitor'
  | 'events'
  | 'future'
  | 'insights'
  | 'settings'

export interface TrendItem {
  rank: number
  name: string
  change: string
  signal: '已触发' | '持续观察'
  heat: string
}

export interface EventItem {
  id: string
  title: string
  summary: string
  eventType?: string
  confidence?: string
  occurredAt?: string | null
  rawStatus?: string
  status: string
  verify: string
  regions: string
  trigger: string
  urls: string[]
  labels?: EventLabel[]
  evidence?: {
    sourceType: string
    claim: string
    url?: string
    metadata?: unknown
  }[]
  related: string[]
}

export interface EventLabel {
  code: string
  name: string
  category: 'source' | 'trigger' | 'aggregation' | string
  sourcePath?: string | null
  evidenceRefs?: string[]
  reason?: string
  confidence?: string
}

export interface TaskItem {
  id: string
  eventId?: string
  code: string
  event: string
  eventSummary?: string
  eventEvidence?: {
    sourceType: string
    claim: string
    url?: string
  }[]
  account: string
  role: string
  status: string
  risk: string
  time: string
  copies: string[]
  candidateIds?: string[]
}
