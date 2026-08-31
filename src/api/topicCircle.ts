import { request } from './client'

export interface TopicCircleTopicItem {
  id: string
  circle: string
  title: string
  summary: string
  coreFact: string
  postIds: string[]
  posts: TopicCircleTopicPost[]
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

export interface TopicCircleTopicPost {
  postId: string
  authorHandle: string
  authorName: string | null
  text: string
  url: string | null
  postType: string | null
  publishedAt: string
  metrics: {
    views?: number
    likes?: number
    replies?: number
    reposts?: number
    quotes?: number
  } | null
}

export interface TopicCirclePostLeaderboardItem extends TopicCircleTopicPost {
  rank: number
  signalId: string
  topicWatchId: string
  topicWatchName: string
  firstObservedAt: string
  lastObservedAt: string
  deltaViews: number | null
  previousRank: number | null
  status: 'hot_event_candidate' | 'watching'
}

export interface TopicCirclePostLeaderboard {
  topicWatchId: string
  topicWatchName: string
  calculatedAt: string
  windowStartAt: string
  windowEndAt: string
  items: TopicCirclePostLeaderboardItem[]
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

interface V2TopicWatch {
  id: string
  name: string
  status: string
  monitoringPlans?: {
    sources?: {
      platform?: string
      sourceType?: string
      handle?: string
    }[]
  }[]
}

interface V2TopicCandidate {
  id: string
  topicWatchId: string
  title: string
  summary: string
  firstSeenAt: string
  lastSeenAt: string
  signalCount: number
  postCount?: number | null
  accountCount?: number | null
  sourceTypes: string[]
  representativeSignalIds: string[]
  evidenceRefs: string[]
  metrics?: {
    b3h?: number
    b24h?: number
    tmax?: number | null
    tmaxTop5?: boolean
  } | null
  status: string
  createdAt: string
  updatedAt: string
}

interface V2TopicWatchCollectionResult {
  topicWatchCount: number
  sourceCount: number
  rawItemCount: number
  signalCount: number
  evidenceCount: number
  candidateCount?: number
  runs: {
    topicWatchId: string
    handle: string
    runId: string
    status: string
    rawItemCount: number
    errorMessage?: string | null
  }[]
}

export async function getTopicCircleMonitorTopics(): Promise<TopicCircleMonitorTopic[]> {
  const watches = await request<V2TopicWatch[]>('/topic-watches')

  return Promise.all(
    watches.map(async (watch) => {
      const leaderboard = await request<TopicCirclePostLeaderboard>(
        `/topic-watches/${encodeURIComponent(watch.id)}/post-leaderboard`,
      )
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000

      return {
        id: watch.id,
        name: watch.name,
        enabled: watch.status === 'active',
        accountCount: getTopicWatchAccountCount(watch),
        recentPostCount3h: leaderboard.items.filter(
          (item) => new Date(item.publishedAt).getTime() >= threeHoursAgo,
        ).length,
        candidateCount24h: leaderboard.items.length,
        triggeredEventCount24h: leaderboard.items.filter((item) => item.status === 'hot_event_candidate').length,
        latestCandidates: [],
      }
    }),
  )
}

function getTopicWatchAccountCount(watch: V2TopicWatch) {
  const sources = watch.monitoringPlans?.[0]?.sources ?? []
  return sources.filter((source) => source.platform === 'x' && source.sourceType === 'account' && source.handle).length
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

export async function getTopicCirclePipelineStatus(): Promise<TopicCirclePipelineStatus> {
  return request<TopicCirclePipelineStatus>('/topic-watches/status')
}

/** 获取主题圈总结出的话题（可按主题圈名筛选） */
export async function getTopicCircleTopics(
  circle?: string,
): Promise<TopicCircleTopicItem[]> {
  const watches = await request<V2TopicWatch[]>('/topic-watches')
  const matchedWatch = circle
    ? watches.find((watch) => watch.id === circle || watch.name === circle)
    : watches[0]

  if (!matchedWatch) return []

  const candidates = await request<V2TopicCandidate[]>(
    `/topic-watches/${encodeURIComponent(matchedWatch.id)}/candidates`,
  )

  return candidates.map((candidate) => mapCandidate(candidate, matchedWatch))
}

export async function getTopicCirclePostLeaderboard(
  circle: string,
): Promise<TopicCirclePostLeaderboard | null> {
  const watches = await request<V2TopicWatch[]>('/topic-watches')
  const matchedWatch = watches.find((watch) => watch.id === circle || watch.name === circle)
  if (!matchedWatch) return null

  return request<TopicCirclePostLeaderboard>(
    `/topic-watches/${encodeURIComponent(matchedWatch.id)}/post-leaderboard`,
  )
}

export async function getTopicCircleTopicPosts(
  topic: TopicCircleTopicItem,
): Promise<TopicCircleTopicPost[]> {
  const watches = await request<V2TopicWatch[]>('/topic-watches')
  const matchedWatch = watches.find((watch) => watch.name === topic.circle)
  if (!matchedWatch) return []

  return request<TopicCircleTopicPost[]>(
    `/topic-watches/${encodeURIComponent(matchedWatch.id)}/candidates/${encodeURIComponent(topic.id)}/posts`,
  )
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
export async function refreshTopicCircleTopics(circle?: string): Promise<TopicCircleRefreshResult> {
  const watches = circle ? await request<V2TopicWatch[]>('/topic-watches') : []
  const matchedWatch = circle
    ? watches.find((watch) => watch.id === circle || watch.name === circle)
    : null
  const path = matchedWatch
    ? `/topic-watches/${encodeURIComponent(matchedWatch.id)}/collect`
    : '/topic-watches/collect'
  const result = await request<V2TopicWatchCollectionResult>(path, {
    method: 'POST',
  })

  return {
    accounts: result.sourceCount,
    collected: result.rawItemCount,
    status: result.runs.some((run) => run.status === 'failed') ? 'partial_success' : 'success',
    fetchRunId: result.runs[0]?.runId ?? '',
    error: result.runs.find((run) => run.errorMessage)?.errorMessage ?? null,
    analysis: {
      topics: result.candidateCount ?? 0,
      computed: 0,
      triggered: 0,
      refreshed: 0,
    },
  }
}

function mapCandidate(candidate: V2TopicCandidate, watch: V2TopicWatch): TopicCircleTopicItem {
  return {
    id: candidate.id,
    circle: watch.name,
    title: candidate.title,
    summary: candidate.summary,
    coreFact: candidate.summary,
    postIds: candidate.representativeSignalIds,
    posts: [],
    b3h: candidate.metrics?.b3h ?? candidate.accountCount ?? candidate.signalCount,
    b24h: candidate.metrics?.b24h ?? candidate.accountCount ?? candidate.signalCount,
    tmax: candidate.metrics?.tmax ?? null,
    tmaxTop5: candidate.metrics?.tmaxTop5 ?? false,
    eventId: null,
    triggeredAt: null,
    triggerType: null,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  }
}
