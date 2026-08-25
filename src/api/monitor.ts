import { request } from './client'
import type { RefreshResponse, TrendingResponse } from './types'
import { getPlatformCollectionConfig } from './collectionConfig'

interface SignalResponse {
  id: string
  signalType: string
  title: string
  observedAt: string
  metrics?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

interface CollectionRunResponse {
  id: string
  status: string
  rawItemCount: number
  errorMessage?: string | null
}

/** 获取指定地区热搜排行榜前 N 条 */
export async function getTrending(region: string, limit = 30): Promise<TrendingResponse> {
  const signals = await request<SignalResponse[]>('/signals?signalType=x_trend&take=500')
  const snapshotRegion = region === 'Worldwide' ? 'global' : region
  const matching = signals
    .filter((signal) => signal.signalType === 'x_trend')
    .filter((signal) => stringValue(signal.metadata?.region) === snapshotRegion)
    .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())
  const latestObservedAt = matching[0]?.observedAt
  const latest = latestObservedAt
    ? matching.filter((signal) => signal.observedAt === latestObservedAt)
    : []

  return {
    region,
    collectedAt: latestObservedAt ?? '',
    source: 'twitter',
    items: latest
      .sort((a, b) => numberValue(a.metrics?.rank) - numberValue(b.metrics?.rank))
      .slice(0, limit)
      .map((signal) => {
        const query = stringValue(signal.metadata?.query) ?? signal.title
        return {
          rank: numberValue(signal.metrics?.rank),
          name: signal.title,
          query,
          url: `https://x.com/search?q=${encodeURIComponent(query)}`,
          heat: stringValue(signal.metrics?.heat) ?? '',
        }
      }),
  }
}

/** 触发立即采集（对应「立即采集」按钮） */
export async function refreshMonitor(): Promise<RefreshResponse> {
  const config = await getPlatformCollectionConfig('x')
  const result = await request<CollectionRunResponse>('/data-sources/collect', {
    method: 'POST',
    body: JSON.stringify({
      id: 'x-trends-manual-refresh',
      pluginId: 'x-trends',
      capabilityId: 'x.trends.list',
      params: {
        regions: config.variables.regions,
        regionWoeids: config.variables.regionWoeids,
        limit: config.variables.defaultTrendLimit,
      },
    }),
  })

  return {
    status: result.status,
    message:
      result.status === 'failed'
        ? '采集失败'
        : `已采集 ${result.rawItemCount} 条热搜排行榜数据`,
    fetchRunId: result.id,
    itemCount: result.rawItemCount,
    error: result.errorMessage ?? undefined,
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}
