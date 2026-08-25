import { request } from './client'

export type OpportunityRulePackStatus = 'preset' | 'draft' | 'active' | 'archived'

export interface OpportunityRuleDocument {
  id: string
  title: string
  path: string
  markdown: string
}

export interface OpportunityRuleRoute {
  signalType: string
  documents: string[]
  lookbackHours: number
  batchLimit: number
  priority: 'high' | 'medium' | 'low'
}

export interface OpportunityRulePackSnapshot {
  id: string
  version: number
  status: OpportunityRulePackStatus
  basePath: string
  documents: OpportunityRuleDocument[]
  routes: OpportunityRuleRoute[]
}

export interface OpportunityRulePackRecord {
  id: string
  version: number
  status: 'draft' | 'active' | 'archived'
  basePath: string
  manifest: {
    documents?: OpportunityRuleDocument[]
    [key: string]: unknown
  }
  description?: string | null
  generatedBy: string
  createdAt: string
  updatedAt: string
}

export interface OpportunityRulePackTestRunInput {
  signalId?: string
  rulePackId?: string
  instruction?: string
}

export interface OpportunityRulePackAiDraftResponse {
  document: OpportunityRuleDocument
  changeSummary: string
  suggestions: string[]
}

export function getActiveOpportunityRulePack() {
  return request<OpportunityRulePackSnapshot | OpportunityRulePackRecord | null>('/opportunities/rule-pack')
}

export function createOpportunityRulePackDraft(input: {
  description?: string
  documents: Array<Pick<OpportunityRuleDocument, 'id' | 'title' | 'markdown'>>
}) {
  return request<OpportunityRulePackRecord>('/opportunities/rule-pack/draft', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function createOpportunityRulePackAiDraft(input: {
  documentId: string
  instruction: string
}) {
  return request<OpportunityRulePackAiDraftResponse>('/opportunities/rule-pack/ai-draft', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function activateOpportunityRulePack(id: string) {
  return request<OpportunityRulePackRecord>(`/opportunities/rule-pack/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
  })
}

export function resetOpportunityRulePack() {
  return request<OpportunityRulePackRecord>('/opportunities/rule-pack/reset', {
    method: 'POST',
  })
}

export function testOpportunityRulePack(input: OpportunityRulePackTestRunInput) {
  return request<unknown>('/opportunities/rule-pack/test-run', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
