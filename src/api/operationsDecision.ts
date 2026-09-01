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

export type OperationDecisionResult = 'adopted' | 'edited' | 'rejected'

export interface OperationDecisionRecord {
  id: string
  recommendationId: string
  result: OperationDecisionResult
  finalAngle?: string | null
  note?: string | null
  operator?: string | null
  regenCount: number
  createdAt: string
  updatedAt: string
  recommendation: OperationRecommendation
}

export interface OperationRecommendationRunResponse {
  syncedPredxNewsCount: number
  generatedCount: number
  items: OperationRecommendation[]
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

export function runOperationRecommendations() {
  return request<OperationRecommendationRunResponse>('/operations-decision/recommendations/run', {
    method: 'POST',
    body: JSON.stringify({
      eventTake: 30,
      newsTake: 20,
    }),
  })
}

export function adoptOperationRecommendation(
  id: string,
  body: { angleId: string; operator?: string; note?: string },
) {
  return request<OperationDecisionRecord>(`/operations-decision/recommendations/${id}/adopt`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function adoptEditedOperationRecommendation(
  id: string,
  body: { angleId?: string; finalAngle: string; operator?: string; note?: string },
) {
  return request<OperationDecisionRecord>(`/operations-decision/recommendations/${id}/adopt-edited`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function rejectOperationRecommendation(
  id: string,
  body: { operator?: string; note?: string } = {},
) {
  return request<OperationDecisionRecord>(`/operations-decision/recommendations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function listOperationDecisionRecords() {
  return request<OperationDecisionRecord[]>('/operations-decision/records')
}
