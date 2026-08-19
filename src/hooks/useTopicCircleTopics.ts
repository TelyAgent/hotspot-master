import { useCallback, useEffect, useState } from 'react'
import { getTopicCircleTopics } from '../api/topicCircle'
import type { TopicCircleTopicItem } from '../api/topicCircle'

export function useTopicCircleTopics(circle?: string) {
  const [topics, setTopics] = useState<TopicCircleTopicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getTopicCircleTopics(circle)
      .then(setTopics)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载话题失败'),
      )
      .finally(() => setLoading(false))
  }, [circle])

  useEffect(() => {
    reload()
  }, [reload])

  return { topics, loading, error, reload }
}
