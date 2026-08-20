import { useCallback, useEffect, useState } from 'react'
import { getTasks, getTaskFacets } from '../api/task'
import type { TaskItem } from '../data/types'
import type { TaskFacets } from '../api/task'

export interface UseTasksParams {
  page: number
  pageSize?: number
  event?: string
  role?: string
  status?: string
  risk?: string
}

export function useTasks({
  page,
  pageSize = 20,
  event,
  role,
  status,
  risk,
}: UseTasksParams) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [accountTypes, setAccountTypes] = useState<string[]>([])
  const [facets, setFacets] = useState<TaskFacets>({ events: [], roles: [], statuses: [], risks: [] })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getTasks({ page, pageSize, event, role, status, risk }),
      getTaskFacets(),
    ])
      .then(([t, f]) => {
        setTasks(t.items)
        setTotal(t.total)
        setAccountTypes(f.roles)
        setFacets(f)
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载任务失败'),
      )
      .finally(() => setLoading(false))
  }, [page, pageSize, event, role, status, risk])

  useEffect(() => {
    reload()
  }, [reload])

  return { tasks, accountTypes, facets, total, pageSize, loading, error, reload }
}
