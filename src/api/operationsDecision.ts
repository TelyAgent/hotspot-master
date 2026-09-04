import { request } from './client'

export type OperationRecommendationBasis = 'heat' | 'market' | 'product'
export type OperationRecommendationPriority = 'immediate' | 'today'

export interface OperationRecommendationAngle {
  id: string
  level: string
  claim: string
  targetUser?: string | null
  userValue?: string | null
  evidence: string[]
  productUrl?: string | null
  riskNotes: string[]
}

export interface OperationRecommendationEvidence {
  id: string
  sourceType: string
  sourceName?: string | null
  authorName?: string | null
  title?: string | null
  summary: string
  text?: string | null
  url?: string | null
  publishedAt?: string | null
  observedAt: string
  metrics?: Record<string, unknown> | null
  confidence: string
}

export interface OperationRecommendation {
  id: string
  sourceEventId?: string | null
  title: string
  summary: string
  recommendationLabels: string[]
  basis: OperationRecommendationBasis
  priority: OperationRecommendationPriority
  reason: string
  productAssociationStatus: string
  productAssociationLevel: string
  productAssociationRationale: string
  selectedProductValue?: string | null
  recommendedProductPage?: string | null
  recommendedProductUrl?: string | null
  urlReason?: string | null
  evidenceRefs: string[]
  evidenceItems?: OperationRecommendationEvidence[]
  riskNotes: string[]
  missingData: string[]
  status: string
  confidence: string
  createdAt: string
  updatedAt: string
  predxNewsItem?: {
    title: string
    newsTitle?: string | null
    sourceName?: string | null
    sourceUrl?: string | null
    primaryMarketTitle?: string | null
    primaryMarketUrl?: string | null
    publishedAt: string
  } | null
  angles: OperationRecommendationAngle[]
}

export type OperationContextInboxStatus = 'pending' | 'working' | 'missing' | 'done'

export interface OperationContextInboxItem {
  id: string
  title: string
  source: string
  sourceUrl?: string | null
  rawContent: string
  summary: string
  quality: string
  status: OperationContextInboxStatus
  conclusion: string
  createdAt: string
  updatedAt: string
}

export interface OperationRecommendationRunResponse {
  syncedPredxNewsCount: number
  generatedCount: number
  items: OperationRecommendation[]
}

export interface OperationContentDraft {
  id: string
  contentTaskId: string
  version: number
  body: string
  evidenceRefs: string[]
  generationInput: Record<string, unknown>
  userInstruction?: string | null
  status: 'draft' | 'approved' | 'rejected' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface OperationContentDraftResponse {
  contentTaskId: string
  draft: OperationContentDraft
}

export interface ApprovedOperationContentDraft {
  id: string
  contentTaskId: string
  recommendationId: string
  title: string
  summary: string
  draft: string
  status: string
  updatedAt: string
  recommendationLabels: string[]
  selectedAngle?: string | null
  format?: string | null
  predxUrl?: string | null
}

export function listOperationRecommendations(params: {
  basis?: string
  priority?: string
  take?: number
} = {}) {
  const query = new URLSearchParams()
  if (params.basis && params.basis !== 'all') query.set('basis', params.basis)
  if (params.priority && params.priority !== 'all') query.set('priority', params.priority)
  if (params.take) query.set('take', String(params.take))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<OperationRecommendation[]>(`/operations-decision/recommendations${suffix}`)
}

export function generateOperationRecommendationContent(
  recommendationId: string,
  body: {
    angleIds: string[]
    goals: string[]
    readers: string[]
    formats: string[]
    userInstruction?: string
  },
) {
  return request<OperationContentDraftResponse>(
    `/operations-decision/recommendations/${encodeURIComponent(recommendationId)}/content/generate`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function reviseOperationRecommendationContent(
  recommendationId: string,
  body: {
    angleIds: string[]
    goals: string[]
    readers: string[]
    formats: string[]
    body: string
    instruction: string
  },
) {
  return request<OperationContentDraftResponse>(
    `/operations-decision/recommendations/${encodeURIComponent(recommendationId)}/content/revise`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function adoptOperationRecommendationContent(
  recommendationId: string,
  body: {
    angleIds: string[]
    goals: string[]
    readers: string[]
    formats: string[]
    draftId?: string
    body?: string
  },
) {
  return request<{ contentTaskId: string; draft: OperationContentDraft; publishPath: string }>(
    `/operations-decision/recommendations/${encodeURIComponent(recommendationId)}/content/adopt`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function listApprovedOperationContentDrafts(params: { take?: number } = {}) {
  const query = new URLSearchParams()
  if (params.take) query.set('take', String(params.take))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request<ApprovedOperationContentDraft[]>(`/operations-decision/content-drafts/approved${suffix}`)
}

export function backfillPublishedPost(body: {
  contentTaskId: string
  accountName?: string
  platform: string
  url: string
}) {
  return request('/published-posts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function runOperationRecommendations() {
  return request<OperationRecommendationRunResponse>('/operations-decision/recommendations/run', {
    method: 'POST',
    body: JSON.stringify({
      eventTake: 30,
      newsTake: 20,
    }),
  })
}

export function listOperationContextInboxItems() {
  return request<OperationContextInboxItem[]>('/operations-decision/inbox')
}

export function createOperationContextInboxItem(body: {
  rawContent: string
  source?: string
  sourceUrl?: string
}) {
  return request<OperationContextInboxItem>('/operations-decision/inbox', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
