import { request } from './client'

export interface PlatformCollectionConfig {
  id: string
  platform: 'x'
  connectorId: string
  displayName: string
  enabled: boolean
  defaultTimezone: string
  defaultRegions: string[]
  variables: {
    regions?: string[]
    regionWoeids?: Record<string, number>
    monitoredAccounts?: string[]
    topicKeywords?: string[]
    topicNegativeKeywords?: string[]
    topicConfigs?: TopicTrackingConfig[]
    trendCollectionCron?: string
    trendCollectionIntervalMs?: number
    trendEventWorkflowId?: string
    defaultTrendLimit?: number
    defaultPostLimit?: number
  }
}

export interface TopicTrackingConfig {
  id: string
  name: string
  enabled: boolean
  keywords: string[]
  positiveExamples: string[]
  negativeExamples: string[]
  action: string
  accounts: string[]
  collectionFrequency: string
  workflowId: string
  defaultPostLimit: number
}

export interface CollectionJobConfig {
  id: string
  platform: 'x'
  name: string
  toolName: string
  sourceType: string
  enabled: boolean
  schedule: {
    type: 'cron' | 'interval'
    value: string
  }
}

export function getPlatformCollectionConfig(platform: 'x') {
  return request<PlatformCollectionConfig>(`/collection/platforms/${platform}/config`)
}

export function updatePlatformCollectionConfig(
  platform: 'x',
  data: Partial<Pick<PlatformCollectionConfig, 'enabled' | 'defaultRegions' | 'variables'>>,
) {
  return request<PlatformCollectionConfig>(`/collection/platforms/${platform}/config`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function getPlatformCollectionJobs(platform: 'x') {
  return request<CollectionJobConfig[]>(`/collection/platforms/${platform}/jobs`)
}

export function updateCollectionJobConfig(
  jobId: string,
  data: Partial<Pick<CollectionJobConfig, 'enabled' | 'schedule'>>,
) {
  return request<CollectionJobConfig>(`/collection/jobs/${jobId}/config`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
