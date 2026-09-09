import { useCallback, useEffect, useState } from 'react'
import {
  listAccountProfiles,
  refreshAccountMetrics,
  type AccountProfile,
} from '../api/accountProfiles'

export type AccountType = 'official' | 'kol' | 'media' | 'project' | 'institution'

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'official', label: '官方账号' },
  { value: 'kol', label: 'KOL' },
  { value: 'media', label: '媒体' },
  { value: 'project', label: '项目方' },
  { value: 'institution', label: '机构' },
]

const ACCOUNT_TYPE_SET = new Set<string>(ACCOUNT_TYPE_OPTIONS.map((item) => item.value))

export interface MonitoringAccount {
  /** 与 handle 保持一致（小写无 @），用作筛选、手动纳入/排除的唯一标识 */
  id: string
  handle: string
  name: string
  followers: number
  weeklyPosts: number
  avgComments: number
  avgReposts: number
  avgViews: number
  avgLikes: number
  region: string
  lastActiveAt: string
  accountType: AccountType
}

/** 人工标签缺失时，按 handle 猜一个账号类型 */
export function inferAccountType(handle: string): AccountType {
  const normalized = handle.replace(/^@/, '').toLowerCase()
  if (['openai', 'anthropicai', 'googledeepmind', 'metaai', 'xai', 'microsoft'].includes(normalized)) {
    return 'official'
  }
  if (['reuters', 'ap', 'bbcworld', 'business', 'bloomberg', 'techcrunch', 'coindesk', 'cointelegraph', 'nikkeiasia'].includes(normalized)) {
    return 'media'
  }
  if (['polymarket', 'kalshi'].includes(normalized)) return 'project'
  if (['a16z', 'ycombinator'].includes(normalized)) return 'institution'
  return 'kol'
}

export function toMonitoringAccount(profile: AccountProfile): MonitoringAccount {
  const handle = profile.handle
  return {
    id: handle,
    handle,
    name: profile.displayName || profile.displayHandle || handle,
    followers: profile.followers ?? 0,
    weeklyPosts: profile.weeklyPosts,
    avgComments: profile.avgComments ?? 0,
    avgReposts: profile.avgReposts ?? 0,
    avgViews: profile.avgViews ?? 0,
    avgLikes: profile.avgLikes ?? 0,
    region: profile.region || '未知',
    lastActiveAt: profile.lastActiveAt ?? '',
    accountType: profile.accountType && ACCOUNT_TYPE_SET.has(profile.accountType)
      ? (profile.accountType as AccountType)
      : inferAccountType(handle),
  }
}

// ---------------------------------------------------------------------------
// 模块级共享缓存：多个组件同时使用时只发一次请求
// ---------------------------------------------------------------------------

interface PoolCache {
  accounts: MonitoringAccount[]
  updatedAt: string
}

let cache: PoolCache | null = null
let loadInflight: Promise<MonitoringAccount[]> | null = null
let refreshInflight: Promise<MonitoringAccount[]> | null = null

async function loadPool(force = false): Promise<MonitoringAccount[]> {
  if (!force && cache) {
    return cache.accounts
  }
  if (loadInflight) {
    return loadInflight
  }

  loadInflight = (async () => {
    const rows = await listAccountProfiles({ active: true })
    const accounts = rows.map(toMonitoringAccount)
    cache = { accounts, updatedAt: new Date().toISOString() }
    return accounts
  })().finally(() => {
    loadInflight = null
  });

  return loadInflight
}

/** 先让后端从已采集帖子重算互动指标，再拉最新账号池 */
async function refreshPool(): Promise<MonitoringAccount[]> {
  if (refreshInflight) {
    return refreshInflight
  }

  refreshInflight = (async () => {
    await refreshAccountMetrics(7)
    return loadPool(true)
  })().finally(() => {
    refreshInflight = null
  });

  return refreshInflight
}

export interface UseAccountPoolResult {
  accounts: MonitoringAccount[]
  updatedAt: string | null
  loading: boolean
  refreshing: boolean
  error: string | null
  reload: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAccountPool(): UseAccountPoolResult {
  const [accounts, setAccounts] = useState<MonitoringAccount[]>(() => cache?.accounts ?? [])
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => cache?.updatedAt ?? null)
  const [loading, setLoading] = useState(() => !cache)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await loadPool()
      setAccounts(cache?.accounts ?? [])
      setUpdatedAt(cache?.updatedAt ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载账号池失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const next = await refreshPool()
      setAccounts(next)
      setUpdatedAt(cache?.updatedAt ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新账号池失败')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { accounts, updatedAt, loading, refreshing, error, reload, refresh }
}
