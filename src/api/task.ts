import { request } from './client'
import type { TaskItem } from '../data/types'

export interface TaskListParams {
  page?: number
  pageSize?: number
  event?: string
  role?: string
  status?: string
  risk?: string
}

export interface TaskListResponse {
  items: TaskItem[]
  total: number
  page: number
  pageSize: number
}

export interface TaskFacets {
  events: string[]
  statuses: string[]
  risks: string[]
}

/** 获取账号任务列表（分页 + 服务端筛选） */
export function getTasks(params: TaskListParams = {}): Promise<TaskListResponse> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.event) q.set('event', params.event)
  if (params.role) q.set('role', params.role)
  if (params.status) q.set('status', params.status)
  if (params.risk) q.set('risk', params.risk)
  const qs = q.toString()
  return request<TaskListResponse>(`/task${qs ? `?${qs}` : ''}`)
}

/** 获取筛选下拉选项（去重的事件/状态/风险） */
export function getTaskFacets(): Promise<TaskFacets> {
  return request<TaskFacets>('/task/facets')
}

/** 重新生成某个任务的候选（可带调整要求） */
export function regenerateTask(
  id: string,
  instruction?: string,
): Promise<{ status: string; candidates: string[] }> {
  return request(`/task/${id}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ instruction }),
  })
}

/** 回填发布 URL，启动追踪 */
export function publishTask(
  id: string,
  url: string,
  selectedCandidate?: number,
): Promise<{ status: string; message: string }> {
  return request(`/task/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ url, selectedCandidate }),
  })
}
