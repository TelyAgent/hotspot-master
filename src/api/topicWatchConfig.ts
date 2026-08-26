import { request } from './client'

export interface TopicWatchConfig {
  id: string
  name: string
  description: string
  domains: string[]
  watchIntent: string
  collectionPolicy: string
  triggerPolicy: string
  evidencePolicy: string
  exclusionPolicy?: string | null
  status: string
  accounts?: TopicWatchAccountConfig[]
  monitoringPlans?: TopicMonitoringPlanConfig[]
}

export interface TopicWatchAccountConfig {
  id?: string
  topicWatchId?: string
  handle: string
  primaryRole: string
  singleTriggerPolicy: 'S1' | 'S2' | 'C' | string
  authorityScope: string
  status?: string
  sortOrder?: number
}

export interface TopicMonitoringPlanConfig {
  id: string
  version: number
  status: string
  sources?: TopicMonitoringSource[]
  triggerRules?: TopicRuleConfig[]
  evidenceRequirements?: TopicEvidenceRequirement[]
  refreshPolicy?: {
    intervalMinutes?: number
    lookbackMinutes?: number
    [key: string]: unknown
  }
  generatedBy: string
  reason: string
}

export interface TopicMonitoringSource {
  platform?: string
  sourceType?: string
  handle?: string
  primaryRole?: string
  singleTriggerPolicy?: 'S1' | 'S2' | 'C' | string
  authorityScope?: string
  includeReplies?: boolean
  includeQuotes?: boolean
  includeReposts?: boolean
  maxPages?: number
}

export interface TopicRuleConfig {
  ruleId?: string
  description?: string
  positiveExamples?: string[]
}

export interface TopicEvidenceRequirement {
  sourceType?: string
  requiredFields?: string[]
}

export interface TopicWatchCollectionResult {
  topicWatchCount: number
  sourceCount: number
  rawItemCount: number
  signalCount: number
  evidenceCount: number
  candidateCount?: number
  runs: {
    topicWatchId: string
    handle: string
    runId: string
    status: string
    rawItemCount: number
    errorMessage?: string | null
  }[]
}

export interface UpdateTopicWatchConfigInput {
  name: string
  description: string
  domains: string[]
  watchIntent: string
  collectionPolicy: string
  triggerPolicy: string
  evidencePolicy: string
  exclusionPolicy: string | null
  status: string
}

export interface UpdateTopicMonitoringPlanInput {
  sources: TopicMonitoringSource[]
  triggerRules: TopicRuleConfig[]
  evidenceRequirements: TopicEvidenceRequirement[]
  refreshPolicy: TopicMonitoringPlanConfig['refreshPolicy']
  reason: string
}

export interface UpdateTopicWatchAccountsInput {
  accounts: TopicWatchAccountConfig[]
}

export function getTopicWatchConfigs() {
  return request<TopicWatchConfig[]>('/topic-watches')
}

export function collectAllTopicWatches() {
  return request<TopicWatchCollectionResult>('/topic-watches/collect', {
    method: 'POST',
  })
}

export function collectTopicWatch(id: string) {
  return request<TopicWatchCollectionResult>(`/topic-watches/${encodeURIComponent(id)}/collect`, {
    method: 'POST',
  })
}

export function updateTopicWatchConfig(id: string, input: UpdateTopicWatchConfigInput) {
  return request<TopicWatchConfig>(`/topic-watches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function updateActiveTopicMonitoringPlan(
  id: string,
  input: UpdateTopicMonitoringPlanInput,
) {
  return request<TopicMonitoringPlanConfig>(
    `/topic-watches/${encodeURIComponent(id)}/monitoring-plans/active`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export function updateTopicWatchAccounts(id: string, input: UpdateTopicWatchAccountsInput) {
  return request<TopicWatchAccountConfig[]>(`/topic-watches/${encodeURIComponent(id)}/accounts`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
