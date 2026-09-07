import { useCallback, useEffect, useState } from 'react'
import { collectKolRadar, getKolRadarFeed } from '../api/monitor'
import type { KolRadarFeedResponse } from '../api/types'

export interface UseKolRadarFeedResult {
  data: KolRadarFeedResponse | null
  loading: boolean
  collecting: boolean
  error: string | null
  reload: () => Promise<void>
  collectNow: () => Promise<number>
}

export function useKolRadarFeed(): UseKolRadarFeedResult {
  const [data, setData] = useState<KolRadarFeedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getKolRadarFeed())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 KOL 雷达数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const collectNow = useCallback(async () => {
    setCollecting(true)
    setError(null)
    try {
      const run = await collectKolRadar()
      await load()
      return run.rawItemCount
    } catch (e) {
      const message = e instanceof Error ? e.message : 'KOL 雷达立即采集失败'
      setError(message)
      throw e
    } finally {
      setCollecting(false)
    }
  }, [load])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, collecting, error, reload: load, collectNow }
}
