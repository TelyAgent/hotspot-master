import { useCallback, useEffect, useState } from 'react'
import { getPlatformCollectionConfig } from '../api/collectionConfig'
import type { TopicTrackingConfig } from '../api/collectionConfig'

export function useTwitterTopicConfigs() {
  const [topics, setTopics] = useState<TopicTrackingConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getPlatformCollectionConfig('x')
      .then((config) => setTopics(config.variables.topicConfigs ?? []))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载 Twitter 主题配置失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { topics, loading, error, reload }
}
