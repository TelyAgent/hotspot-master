import { useCallback, useEffect, useState } from 'react'
import { getTasks, getTaskFacets } from '../api/task'
import { getAccounts } from '../api/account'
import type { TaskItem } from '../data/types'
import type { TaskFacets } from '../api/task'

export interface UseTasksParams {
  page: number
  pageSize?: number
  event?: string
  account?: string
  status?: string
  risk?: string
}

export function useTasks({
  page,
  pageSize = 20,
  event,
  account,
  status,
  risk,
}: UseTasksParams) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [accounts, setAccounts] = useState<string[]>([])
  const [facets, setFacets] = useState<TaskFacets>({ events: [], accounts: [], statuses: [], risks: [] })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getTasks({ page, pageSize, event, account, status, risk }),
      getTaskFacets(),
      getAccounts(),
    ])
      .then(([t, f, accountOptions]) => {
        setTasks(t.items)
        setTotal(t.total)
        setAccounts(accountOptions.map((item) => item.name).filter(Boolean))
        setFacets(f)
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载任务失败'),
      )
      .finally(() => setLoading(false))
  }, [page, pageSize, event, account, status, risk])

  useEffect(() => {
    reload()
  }, [reload])

  return { tasks, accounts, facets, total, pageSize, loading, error, reload }
}
