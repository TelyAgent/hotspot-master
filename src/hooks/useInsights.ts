import { useCallback, useEffect, useState } from 'react'
import { getInsights } from '../api/insights'
import type { InsightsResponse } from '../api/insights'

export function useInsights(range: string) {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getInsights(range)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [range])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload }
}
