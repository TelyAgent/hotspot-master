import { useCallback, useEffect, useState } from 'react'
import { getTopicCircleMonitorTopics } from '../api/topicCircle'
import type { TopicCircleMonitorTopic } from '../api/topicCircle'

export function useTopicCircleMonitorTopics() {
  const [topics, setTopics] = useState<TopicCircleMonitorTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getTopicCircleMonitorTopics()
      .then(setTopics)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载主题圈失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { topics, loading, error, reload }
}
