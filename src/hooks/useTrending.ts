import { useCallback, useEffect, useState } from 'react'
import { getTrending } from '../api/monitor'
import type { TrendingResponse } from '../api/types'

export interface UseTrendingResult {
  data: TrendingResponse | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** 拉取指定地区的热搜排行榜；region 变化时自动重新请求 */
export function useTrending(region: string): UseTrendingResult {
  const [data, setData] = useState<TrendingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getTrending(region)
      .then(setData)
      .catch((e: unknown) => {
        setError(
          e instanceof Error
            ? e.message
            : '加载热搜排行榜失败',
        )
      })
      .finally(() => setLoading(false))
  }, [region])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
