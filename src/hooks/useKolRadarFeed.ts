import { useCallback, useEffect, useState } from 'react'
import { getKolRadarFeed } from '../api/monitor'
import type { KolRadarFeedResponse } from '../api/types'

export interface UseKolRadarFeedResult {
  data: KolRadarFeedResponse | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useKolRadarFeed(): UseKolRadarFeedResult {
  const [data, setData] = useState<KolRadarFeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getKolRadarFeed()
      .then(setData)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '加载 KOL 雷达数据失败')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
