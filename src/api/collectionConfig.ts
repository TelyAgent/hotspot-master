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
    trendCollectionEnabled?: boolean
    topicWatchSchedulerEnabled?: boolean
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

interface XTrendCollectionConfig {
  regions: string[]
  limit: number
  collectionIntervalMs: number
  trendCollectionEnabled: boolean
  topicWatchSchedulerEnabled: boolean
}

const REGION_WOEIDS: Record<string, number> = {
  global: 1,
  Worldwide: 1,
  'United States': 23424977,
  'United Kingdom': 23424975,
  Japan: 23424856,
  Korea: 23424868,
}

export async function getPlatformCollectionConfig(platform: 'x') {
  assertXPlatform(platform)
  const config = await request<XTrendCollectionConfig>('/project-config/x-trends')
  return toPlatformCollectionConfig(config)
}

export async function updatePlatformCollectionConfig(
  platform: 'x',
  data: Partial<Pick<PlatformCollectionConfig, 'enabled' | 'defaultRegions' | 'variables'>>,
) {
  assertXPlatform(platform)
  const config = await request<XTrendCollectionConfig>('/project-config/x-trends', {
    method: 'PATCH',
    body: JSON.stringify({
      regions: data.variables?.regions ?? data.defaultRegions,
      limit: data.variables?.defaultTrendLimit,
      collectionIntervalMs: data.variables?.trendCollectionIntervalMs,
      trendCollectionEnabled: data.variables?.trendCollectionEnabled,
      topicWatchSchedulerEnabled: data.variables?.topicWatchSchedulerEnabled,
    }),
  })
  return toPlatformCollectionConfig(config)
}

export async function getPlatformCollectionJobs(platform: 'x') {
  assertXPlatform(platform)
  const config = await request<XTrendCollectionConfig>('/project-config/x-trends')
  return [
    {
      id: 'x-trends-default',
      platform: 'x' as const,
      name: 'X 目标地区热搜榜',
      toolName: 'x.trends.list',
      sourceType: 'trend',
      enabled: true,
      schedule: {
        type: 'interval' as const,
        value: String(config.collectionIntervalMs),
      },
    },
  ]
}

export async function updateCollectionJobConfig(
  jobId: string,
  data: Partial<Pick<CollectionJobConfig, 'enabled' | 'schedule'>>,
) {
  const config = await request<XTrendCollectionConfig>('/project-config/x-trends', {
    method: 'PATCH',
    body: JSON.stringify({
      collectionIntervalMs:
        data.schedule?.type === 'interval'
          ? Number(data.schedule.value)
          : undefined,
    }),
  })
  return {
    id: jobId,
    platform: 'x',
    name: 'X 目标地区热搜榜',
    toolName: 'x.trends.list',
    sourceType: 'trend',
    enabled: data.enabled ?? true,
    schedule: {
      type: 'interval',
      value: String(config.collectionIntervalMs),
    },
  }
}

function toPlatformCollectionConfig(config: XTrendCollectionConfig): PlatformCollectionConfig {
  return {
    id: 'x-default',
    platform: 'x',
    connectorId: 'x-twitterapi-io',
    displayName: 'X / twitterapi.io',
    enabled: config.trendCollectionEnabled,
    defaultTimezone: 'Asia/Shanghai',
    defaultRegions: config.regions,
    variables: {
      regions: config.regions,
      regionWoeids: REGION_WOEIDS,
      trendCollectionIntervalMs: config.collectionIntervalMs,
      trendCollectionEnabled: config.trendCollectionEnabled,
      topicWatchSchedulerEnabled: config.topicWatchSchedulerEnabled,
      defaultTrendLimit: config.limit,
      trendEventWorkflowId: 'x-trend-event-formation',
      defaultPostLimit: 3,
    },
  }
}

function assertXPlatform(platform: 'x') {
  if (platform !== 'x') {
    throw new Error(`不支持的平台：${platform}`)
  }
}
