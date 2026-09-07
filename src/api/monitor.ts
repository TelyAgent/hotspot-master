import { request } from './client'
import type { RefreshResponse, KolRadarFeedResponse, TrendingResponse } from './types'
import { getPlatformCollectionConfig } from './collectionConfig'

interface CollectionRunResponse {
  id: string
  status: string
  rawItemCount: number
  errorMessage?: string | null
}

interface XTrendRankingResponse {
  region: string
  observedAt: string | null
  items: Array<{
    id: string
    name: string
    query: string
    rank: number
    url?: string | null
    heat?: string | null
    category?: string | null
  }>
}

interface KolRadarFeedApiResponse {
  collectedAt: string
  windowHours?: number
  items: KolRadarFeedResponse['items']
}

export async function getTrending(region: string, limit = 30): Promise<TrendingResponse> {
  const snapshotRegion = region === 'Worldwide' ? 'global' : region
  const ranking = await request<XTrendRankingResponse>(
    `/data-sources/x-trends/latest?region=${encodeURIComponent(snapshotRegion)}&limit=${limit}`,
  )

  return {
    region,
    collectedAt: ranking.observedAt ?? '',
    source: 'twitter',
    items: ranking.items.map((item) => ({
      rank: item.rank,
      name: item.name,
      query: normalizeTrendQuery(item.query || item.name),
      url: `https://x.com/search?q=${encodeURIComponent(normalizeTrendQuery(item.query || item.name))}`,
      heat: item.heat ?? '',
    })),
  }
}

export async function getKolRadarFeed(take = 30): Promise<KolRadarFeedResponse> {
  return request<KolRadarFeedApiResponse>(`/signals/kol-radar?take=${take}`)
}

function normalizeTrendQuery(value: string) {
  return value.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
}

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
