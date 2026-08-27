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
  createdAt?: string
  updatedAt?: string
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
    author?: string | null
    publishedAt?: string | null
    observedAt?: string
    metrics?: unknown
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

export interface EventMergeDimensionResult {
  dimension: string
  label: string
  score: number
  result: 'compatible' | 'conflict' | 'uncertain' | string
  comparison: string
  evidenceRefs: string[]
}

export interface EventSourceContext {
  id: string
  mainEventId?: string | null
  sourceEventId?: string | null
  sourceType: string
  triggerType: string
  triggerRuleCode?: string | null
  ruleVersion?: string | null
  contextVersion: number
  title: string
  summary: string
  evidenceRefs: string[]
  signalRefs: string[]
  triggeredAt: string
  createdAt?: string
  updatedAt?: string
}

export interface EventMergeDetail {
  eventId: string
  contextVersion: number
  sourceContexts: EventSourceContext[]
  latestIdentityDecision?: {
    mergeConfidence: number
    decision: string
    dimensionResults: EventMergeDimensionResult[]
    conflictPoints: string[]
    systemAction: string
    reason: string
    decidedAt?: string
    createdAt?: string
  }
  relations: EventRelation[]
}

export interface EventRelation {
  id: string
  fromEventId: string
  toEventId: string
  relationType: string
  reason: string
  evidenceRefs: string[]
  createdBy: string
  createdAt: string
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
