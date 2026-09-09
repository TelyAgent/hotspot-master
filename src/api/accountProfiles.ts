import { request } from './client'

export interface AccountProfile {
  handle: string
  displayHandle: string | null
  displayName: string | null
  followers: number | null
  region: string | null
  regionSource: string | null
  bio: string | null
  accountType: string | null
  monitorEnabled: boolean
  groupTag: string | null
  joinedAt: string
  source: string
  weeklyPosts: number
  avgComments: number | null
  avgReposts: number | null
  avgViews: number | null
  avgLikes: number | null
  lastActiveAt: string | null
  isActive: boolean
  lastFetchedAt: string | null
  lastAggregatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListAccountProfilesParams {
  monitored?: boolean
  monitoring?: boolean
  active?: boolean
  q?: string
}

export interface CreateAccountProfileInput {
  handle: string
  groupTag?: string | null
  monitorEnabled?: boolean
}

export interface UpdateAccountProfileInput {
  groupTag?: string | null
  monitorEnabled?: boolean
  region?: string | null
  accountType?: string | null
  displayName?: string | null
  bio?: string | null
  isActive?: boolean
}

export interface AccountProfileRefreshResult {
  intervalMs: number
  batchSize: number
  scanned: number
  refreshed: number
  failed: number
  missingKey: boolean
  finishedAt: string
}

export interface EngagementRefreshResult {
  windowDays: number
  windowStart: string
  scannedSignals: number
  matchedSignals: number
  authors: number
  updated: number
  created: number
  skippedTombstoned: number
  resetStale: number
  finishedAt: string
}

function buildQuery(params: ListAccountProfilesParams = {}) {
  const search = new URLSearchParams()
  if (typeof params.monitored === 'boolean') search.set('monitored', String(params.monitored))
  if (typeof params.monitoring === 'boolean') search.set('monitoring', String(params.monitoring))
  if (typeof params.active === 'boolean') search.set('active', String(params.active))
  if (params.q?.trim()) search.set('q', params.q.trim())
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listAccountProfiles(params: ListAccountProfilesParams = {}) {
  return request<AccountProfile[]>(`/account-profiles${buildQuery(params)}`)
}

export async function createAccountProfile(input: CreateAccountProfileInput) {
  return request<AccountProfile>('/account-profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateAccountProfile(
  handle: string,
  patch: UpdateAccountProfileInput,
) {
  return request<AccountProfile>(`/account-profiles/${encodeURIComponent(handle)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteAccountProfile(handle: string) {
  return request<{ deleted: true }>(`/account-profiles/${encodeURIComponent(handle)}`, {
    method: 'DELETE',
  })
}

/** 触发一次「从已采集帖子聚合互动指标」的刷新，返回统计结果。 */
export async function refreshAccountMetrics(windowDays = 7) {
  return request<EngagementRefreshResult>('/account-profiles/metrics/refresh', {
    method: 'POST',
    body: JSON.stringify({ windowDays }),
  })
}

/** 触发一次「静态资料批量刷新」：粉丝量 / region / bio / displayName。 */
export async function refreshAccountProfiles() {
  return request<AccountProfileRefreshResult>('/account-profiles/refresh', {
    method: 'POST',
  })
}
