import { useCallback, useEffect, useState } from 'react'
import {
  getTopicCirclePipelineStatus,
  type TopicCirclePipelineStatus,
} from '../api/topicCircle'

export function useTopicCirclePipelineStatus() {
  const [status, setStatus] = useState<TopicCirclePipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getTopicCirclePipelineStatus()
      .then(setStatus)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载主题圈流水线状态失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { status, loading, error, reload }
}
