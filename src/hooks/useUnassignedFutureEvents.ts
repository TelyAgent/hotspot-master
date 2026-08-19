import { useCallback, useEffect, useState } from 'react'
import { getFutureEvents } from '../api/futureEvents'
import type { FutureEvent } from '../api/futureEvents'

export function useUnassignedFutureEvents() {
  const [events, setEvents] = useState<FutureEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getFutureEvents({ unassigned: true })
      .then(setEvents)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载时间待确认事件失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { events, loading, error, reload }
}
