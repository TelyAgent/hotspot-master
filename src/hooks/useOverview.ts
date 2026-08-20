import { useCallback, useEffect, useState } from 'react'
import { getOverview } from '../api/overview'
import type { OverviewRange, OverviewResponse } from '../api/overview'

export function useOverview(range: OverviewRange) {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getOverview(range)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载运营总览失败'),
      )
      .finally(() => setLoading(false))
  }, [range])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload }
}
