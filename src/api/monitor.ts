import { request } from './client'
import type { RefreshResponse, TrendingResponse } from './types'
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

/** 获取指定地区热搜排行榜前 N 条 */
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
      query: item.query,
      url: item.url ?? `https://x.com/search?q=${encodeURIComponent(item.query)}`,
      heat: item.heat ?? '',
    })),
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
