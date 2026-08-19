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

export interface TopicCircleMonitorTopic {
  id: string
  name: string
  enabled: boolean
  accountCount: number
  recentPostCount3h: number
  candidateCount24h: number
  triggeredEventCount24h: number
  latestCandidates: TopicCircleTopicItem[]
}

export function getTopicCircleMonitorTopics(): Promise<TopicCircleMonitorTopic[]> {
  return request<TopicCircleMonitorTopic[]>('/topic-circle/topics')
}

export interface TopicCirclePipelineStatus {
  latestFetchRun: null | {
    id: string
    status: string
    startedAt: string
    finishedAt: string | null
    accountCount: number
    itemCount: number
    error: string | null
  }
  failedAccounts: {
    handle: string
    status: string
    startedAt: string
    finishedAt: string | null
    since: string
    until: string
    itemCount: number
    error: string | null
  }[]
  recentPostCount24h: number
  candidateCount24h: number
  triggeredCandidateCount24h: number
  latestWorkflowRun: null | {
    id: string
    workflowId: string
    workflowVersion: string
    status: string
    startedAt: string
    finishedAt: string | null
    error: string | null
  }
}

export function getTopicCirclePipelineStatus(): Promise<TopicCirclePipelineStatus> {
  return request<TopicCirclePipelineStatus>('/topic-circle/status')
}

/** 获取主题圈总结出的话题（可按主题圈名筛选） */
export function getTopicCircleTopics(
  circle?: string,
): Promise<TopicCircleTopicItem[]> {
  const q = circle ? `?circle=${encodeURIComponent(circle)}` : ''
  return request<TopicCircleTopicItem[]>(`/topic-circle${q}`)
}

export interface TopicCircleRefreshResult {
  accounts: number
  collected: number
  status: string
  fetchRunId: string
  error?: string | null
  analysis: null | {
    topics: number
    computed: number
    triggered: number
    refreshed: number
  }
}

/** 手动跑一次主题圈数据流水线：采集帖子 → 总结话题 → 计算指标 → 触发判断 */
export async function refreshTopicCircleTopics(): Promise<TopicCircleRefreshResult> {
  return request<TopicCircleRefreshResult>('/topic-circle/collect', {
    method: 'POST',
  })
}
