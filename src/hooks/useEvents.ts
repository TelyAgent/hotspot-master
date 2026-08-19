import { useCallback, useEffect, useState } from 'react'
import { getEvents } from '../api/event'
import type { EventItem } from '../data/types'

export interface UseEventsParams {
  page: number
  pageSize?: number
  status?: string
  q?: string
}

export function useEvents({ page, pageSize = 20, status, q }: UseEventsParams) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getEvents({ page, pageSize, status, q })
      .then((r) => {
        setEvents(r.items)
        setTotal(r.total)
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载事件失败'),
      )
      .finally(() => setLoading(false))
  }, [page, pageSize, status, q])

  useEffect(() => {
    reload()
  }, [reload])

  return { events, total, pageSize, loading, error, reload }
}
