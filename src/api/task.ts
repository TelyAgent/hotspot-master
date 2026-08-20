import { request } from './client'
import type { TaskItem } from '../data/types'

export interface TaskListParams {
  page?: number
  pageSize?: number
  event?: string
  account?: string
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
  accounts: string[]
  statuses: string[]
  risks: string[]
}

interface ContentTaskItem {
  id: string
  eventId: string
  eventTitle?: string
  eventSummary?: string
  accountId: string
  accountName?: string
  status: string
  priority: string
  skill: string
  skillVersion: string
  assignmentReason: string
  riskStatus: string
  latestCandidateBatchId?: string
  candidateCount: number
  createdAt: string
  updatedAt: string
}

interface ContentCandidate {
  id: string
  text: string
  status: string
  riskStatus: string
}

interface ContentTaskDetail extends ContentTaskItem {
  candidates: ContentCandidate[]
}

interface ContentTaskListResponse {
  items: ContentTaskItem[]
  total: number
}

/** 获取账号任务列表（分页 + 服务端筛选） */
export async function getTasks(params: TaskListParams = {}): Promise<TaskListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const response = await request<ContentTaskListResponse>('/content/tasks')
  const mapped = response.items.map(mapContentTaskItem)
  const filtered = mapped.filter((item) => {
    if (params.event && item.event !== params.event) return false
    if (params.account && item.account !== params.account) return false
    if (params.status && item.status !== params.status) return false
    if (params.risk && item.risk !== params.risk) return false
    return true
  })
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)
  return {
    items: pageItems,
    total: filtered.length,
    page,
    pageSize,
  }
}

/** 获取单个账号任务详情（包含当前候选内容） */
export async function getTask(id: string): Promise<TaskItem> {
  const detail = await request<ContentTaskDetail>(`/content/tasks/${id}`)
  return mapContentTaskDetail(detail)
}

/** 获取筛选下拉选项（去重的事件/状态/风险） */
export async function getTaskFacets(): Promise<TaskFacets> {
  const response = await request<ContentTaskListResponse>('/content/tasks')
  const mapped = response.items.map(mapContentTaskItem)
  return {
    events: unique(mapped.map((item) => item.event)),
    accounts: unique(mapped.map((item) => item.account)),
    statuses: unique(mapped.map((item) => item.status)),
    risks: unique(mapped.map((item) => item.risk)),
  }
}

/** 重新生成某个任务的候选（可带调整要求） */
export function regenerateTask(
  id: string,
  instruction?: string,
): Promise<{ status: string; candidates: string[] }> {
  return request(`/content/tasks/${id}/generate`, {
    method: 'POST',
    body: JSON.stringify({ generationKind: 'regenerate_all', instruction }),
  })
}

/** 回填发布 URL，启动追踪 */
export function publishTask(
  id: string,
  url: string,
  candidateId: string,
): Promise<{ status: string; message: string }> {
  return request(`/content/tasks/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ url, candidateId }),
  })
}

function mapContentTaskDetail(detail: ContentTaskDetail): TaskItem {
  return {
    ...mapContentTaskItem(detail),
    copies: detail.candidates
      .filter((candidate) => candidate.status !== 'blocked')
      .map((candidate) => candidate.text),
    candidateIds: detail.candidates
      .filter((candidate) => candidate.status !== 'blocked')
      .map((candidate) => candidate.id),
  }
}

function mapContentTaskItem(item: ContentTaskItem): TaskItem {
  const eventName = item.eventTitle ?? item.eventId
  return {
    id: item.id,
    eventId: item.eventId,
    code: shortCode(item.id),
    event: eventName,
    account: item.accountName ?? item.accountId,
    role: item.skill,
    status: statusLabel(item.status),
    risk: riskLabel(item.riskStatus),
    time: timeLabel(item.updatedAt),
    copies: [],
    candidateIds: [],
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ready_for_generation: '待生成',
    generating: '生成中',
    generation_failed: '异常',
    ready_for_publish: '待发布',
    precheck_blocked: '异常',
    published: '已发布',
    tracking: '追踪中',
    completed: '已完成',
    abandoned: '已放弃',
  }
  return labels[status] ?? status
}

function riskLabel(risk: string) {
  if (risk === 'medium') return '中'
  if (risk === 'high' || risk === 'blocked') return '高'
  if (risk === 'not_checked') return '未检'
  return '普通'
}

function shortCode(id: string) {
  return id.replace(/^(content_task_|account_response_task_)/, 'T-').slice(0, 10)
}

function timeLabel(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}
