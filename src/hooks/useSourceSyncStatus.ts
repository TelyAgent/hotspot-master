import { useCallback, useEffect, useState } from 'react'
import { getSourceSyncStatus } from '../api/futureEvents'
import type { SourceSyncStatus } from '../api/futureEvents'

export function useSourceSyncStatus() {
  const [sources, setSources] = useState<SourceSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getSourceSyncStatus()
      .then(setSources)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载来源状态失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { sources, loading, error, reload }
}
