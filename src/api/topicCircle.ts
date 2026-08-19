import { request } from './client'

export interface TopicCircleTopicItem {
  id: string
  circle: string
  title: string
  summary: string
  coreFact: string
  postIds: string[]
  b3h: number
  b24h: number
  tmax: number | null
  tmaxTop5: boolean
  eventId: string | null
  triggeredAt: string | null
  triggerType: string | null
  createdAt: string
  updatedAt: string
}

/** 获取主题圈总结出的话题（可按主题圈名筛选） */
export function getTopicCircleTopics(
  circle?: string,
): Promise<TopicCircleTopicItem[]> {
  const q = circle ? `?circle=${encodeURIComponent(circle)}` : ''
  return request<TopicCircleTopicItem[]>(`/topic-circle${q}`)
}

export interface TopicCircleRefreshResult {
  collect: { accounts: number; collected: number }
  summarize: { topics: number }
  metrics: { computed: number }
  trigger: { triggered: number; refreshed: number }
}

/** 手动跑一次主题圈数据流水线：采集帖子 → 总结话题 → 计算指标 → 触发判断 */
export async function refreshTopicCircleTopics(): Promise<TopicCircleRefreshResult> {
  const collect = await request<TopicCircleRefreshResult['collect']>(
    '/topic-circle/collect',
    { method: 'POST' },
  )
  const summarize = await request<TopicCircleRefreshResult['summarize']>(
    '/topic-circle/summarize',
    { method: 'POST' },
  )
  const metrics = await request<TopicCircleRefreshResult['metrics']>(
    '/topic-circle/metrics',
    { method: 'POST' },
  )
  const trigger = await request<TopicCircleRefreshResult['trigger']>(
    '/topic-circle/trigger',
    { method: 'POST' },
  )

  return { collect, summarize, metrics, trigger }
}
