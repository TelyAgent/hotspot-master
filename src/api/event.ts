import { request } from './client'
import type { EventItem } from '../data/types'

export interface EventListParams {
  page?: number
  pageSize?: number
  status?: string
  q?: string
}

export interface EventListResponse {
  items: EventItem[]
  total: number
  page: number
  pageSize: number
}

/** 获取事件列表（分页 + 状态筛选 + 关键词搜索） */
export function getEvents(params: EventListParams = {}): Promise<EventListResponse> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.status) q.set('status', params.status)
  if (params.q) q.set('q', params.q)
  const qs = q.toString()
  return request<EventListResponse>(`/event${qs ? `?${qs}` : ''}`)
}
