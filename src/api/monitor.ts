import { request } from './client'
import type { RefreshResponse, TrendingResponse } from './types'

/** 获取指定地区热搜排行榜前 N 条 */
export function getTrending(region: string, limit = 30): Promise<TrendingResponse> {
  const query = new URLSearchParams({ region, limit: String(limit) })
  return request<TrendingResponse>(`/monitor/trending?${query.toString()}`)
}

/** 触发立即采集（对应「立即采集」按钮） */
export function refreshMonitor(): Promise<RefreshResponse> {
  return request<RefreshResponse>('/monitor/refresh', { method: 'POST' })
}
