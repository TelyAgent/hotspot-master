import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Spin, Tabs, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import { getTopicCirclePostLeaderboard, refreshTopicCircleTopics } from '../../api/topicCircle'
import type { TopicCircleMonitorTopic, TopicCirclePostLeaderboardItem, TopicCircleTopicPost } from '../../api/topicCircle'
import { useTopicCircleMonitorTopics } from '../../hooks/useTopicCircleMonitorTopics'
import { useTopicCirclePipelineStatus } from '../../hooks/useTopicCirclePipelineStatus'
import styles from './Monitor.module.css'

type BoardMode = 'circle' | 'global' | 'rising'

const BOARD_MODES: { key: BoardMode; label: string; desc: string }[] = [
  { key: 'circle', label: '圈内榜', desc: '当前主题圈帖子 Top 10' },
  { key: 'global', label: '全圈总榜', desc: '所有重点主题帖子 Top 10' },
  { key: 'rising', label: '热度飙升榜', desc: '按本轮新增浏览排序' },
]

export default function Topics() {
  const { topicDetail, toast } = useApp()
  const { topics, loading, error, reload } = useTopicCircleMonitorTopics()
  const pipeline = useTopicCirclePipelineStatus()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTopic, setActiveTopic] = useState<string | undefined>()
  const [boardMode, setBoardMode] = useState<BoardMode>('circle')

  useEffect(() => {
    if (boardMode !== 'circle') {
      setActiveTopic(undefined)
      return
    }

    if (!topics.length) {
      setActiveTopic(undefined)
      return
    }
    setActiveTopic((current) =>
      current && topics.some((topic) => topic.name === current) ? current : topics[0].name,
    )
  }, [boardMode, topics])

  const switchBoardMode = (mode: BoardMode) => {
    setBoardMode(mode)
    if (mode === 'circle') {
      setActiveTopic((current) =>
        current && topics.some((topic) => topic.name === current) ? current : topics[0]?.name,
      )
      return
    }

    setActiveTopic(undefined)
  }

  const switchTopic = (topicName: string) => {
    setBoardMode('circle')
    setActiveTopic(topicName)
  }

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics()
      reload()
      pipeline.reload()
      toast(`主题圈采集完成：${result.collected} 条帖子`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  if (topicDetail) {
    return <TopicDetail name={topicDetail} topics={topics} />
  }

  if (loading) return <Spin tip="正在加载主题…" />
  if (error) return <Alert type="error" message={`加载失败：${error}`} showIcon />
  if (topics.length === 0) return <Empty description="暂无主题，请在系统设置里配置" />

  return (
    <>
      <div className={styles.topicToolbar}>
        <span className="small">
          主题圈每 3 小时自动采集；最近一次：
          {pipeline.status?.latestFetchRun
            ? `${pipeline.status.latestFetchRun.status} · ${pipeline.status.latestFetchRun.itemCount} 条 · ${formatTime(pipeline.status.latestFetchRun.startedAt)}`
            : pipeline.loading
              ? '读取中'
              : '暂无记录'}
          {pipeline.status?.latestWorkflowRun ? ` · Workflow ${pipeline.status.latestWorkflowRun.status}` : ''}
        </span>
        <Button type="primary" icon={<ReloadOutlined />} onClick={refreshTopics} loading={refreshing}>
          {refreshing ? '采集中…' : '立即采集'}
        </Button>
      </div>
      {pipeline.error ? <Alert type="warning" message={`流水线状态加载失败：${pipeline.error}`} showIcon /> : null}
      <div className={styles.topicModeTabs}>
        {BOARD_MODES.map((mode) => (
          <Button
            key={mode.key}
            type={boardMode === mode.key ? 'primary' : 'default'}
            onClick={() => switchBoardMode(mode.key)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      <Tabs
        className={styles.topicTabs}
        activeKey={boardMode === 'circle' ? activeTopic : ''}
        onChange={switchTopic}
        items={topics.map((topic) => ({
          key: topic.name,
          label: (
            <span>
              {topic.name}
              <small>{topic.candidateCount24h}</small>
            </span>
          ),
          children: <TopicDetail name={topic.name} topics={topics} embedded summary={topic} boardMode={boardMode} />,
        }))}
      />
      {boardMode !== 'circle' ? (
        <TopicDetail
          name={boardMode === 'global' ? '全部主题' : '热度飙升'}
          topics={topics}
          embedded
          boardMode={boardMode}
          modeOnly
        />
      ) : null}
    </>
  )
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TopicDetail({
  name,
  topics = [],
  embedded = false,
  summary,
  boardMode = 'circle',
  modeOnly = false,
}: {
  name: string
  topics?: TopicCircleMonitorTopic[]
  embedded?: boolean
  summary?: TopicCircleMonitorTopic
  boardMode?: BoardMode
  modeOnly?: boolean
}) {
  const { set, toast } = useApp()
  const [posts, setPosts] = useState<TopicCirclePostLeaderboardItem[]>([])
  const [calculatedAt, setCalculatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)

  const hotCandidates = posts.filter((post) => post.status === 'hot_event_candidate').length
  const activeMode = BOARD_MODES.find((mode) => mode.key === boardMode) ?? BOARD_MODES[0]
  const totalAccounts = modeOnly
    ? topics.reduce((total, topic) => total + topic.accountCount, 0)
    : summary?.accountCount ?? 0

  const boardPosts = useMemo(() => {
    if (boardMode === 'rising') {
      return [...posts]
        .sort((left, right) => {
          const delta = (right.deltaViews ?? 0) - (left.deltaViews ?? 0)
          if (delta !== 0) return delta
          return (right.metrics?.views ?? 0) - (left.metrics?.views ?? 0)
        })
        .slice(0, 10)
        .map((post, index) => ({ ...post, rank: index + 1 }))
    }

    return posts.slice(0, 10).map((post, index) => ({ ...post, rank: index + 1 }))
  }, [boardMode, posts])

  const loadLeaderboard = () => {
    setLoading(true)
    setError(null)
    const targetTopics = boardMode === 'circle' && !modeOnly
      ? [name]
      : topics.length
        ? topics.map((topic) => topic.name)
        : [name]

    Promise.all(targetTopics.map((topicName) => getTopicCirclePostLeaderboard(topicName)))
      .then((results) => {
        const mergedPosts = dedupeLeaderboardPosts(
          results.flatMap((result) => result?.items ?? []),
        )
        const sortedPosts = mergedPosts.sort((left, right) => {
          if (boardMode === 'rising') {
            const delta = (right.deltaViews ?? 0) - (left.deltaViews ?? 0)
            if (delta !== 0) return delta
          }
          return (right.metrics?.views ?? 0) - (left.metrics?.views ?? 0)
        })
        setPosts(sortedPosts)
        const calculatedTimes = results
          .map((result) => result?.calculatedAt)
          .filter((value): value is string => Boolean(value))
          .sort()
        setCalculatedAt(calculatedTimes[calculatedTimes.length - 1] ?? null)
        setExpandedPostId(null)
      })
      .catch((error: unknown) => {
        setError(error instanceof Error ? error.message : '帖子榜单加载失败')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLeaderboard()
  }, [name, boardMode, topics.length, modeOnly])

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics(name)
      loadLeaderboard()
      toast(`${name}采集完成：${result.collected} 条帖子`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      {!embedded ? (
        <div className={styles.topicDetailBreadcrumb}>
          <Button type="link" onClick={() => set({ topicDetail: null })}>
            重点主题追踪
          </Button>
          <span className="muted">/</span>
          <b>{name}</b>
        </div>
      ) : null}
      <section className={styles.topicDetailSummary}>
        <div>
          <span className="small">{modeOnly ? '当前榜单' : '当前主题'}</span>
          <h1>{modeOnly ? activeMode.label : `${name}帖子榜`}</h1>
          <span className="small">
            {modeOnly
              ? `${topics.length} 个主题圈 · ${totalAccounts} 个监控账号`
              : summary
              ? `${summary.enabled ? '启用' : '停用'} · ${summary.accountCount} 个监控账号 · 近 3 小时 ${summary.recentPostCount3h} 条帖子`
              : '按监控账号帖子表现生成圈内榜单'}
          </span>
        </div>
        <div>
          <span className="small">{boardMode === 'circle' ? '圈内上榜' : '进入当前榜单'}</span>
          <strong>{boardPosts.length}</strong>
          <span className="small">条帖子</span>
        </div>
        <div>
          <span className="small">Hot Event 候选</span>
          <strong>{hotCandidates}</strong>
          <span className="small">待事件判断</span>
        </div>
        <div>
          <span className="small">榜单计算时间</span>
          <strong>{calculatedAt ? formatTime(calculatedAt) : '—'}</strong>
        </div>
        <div>
          <span className="small">监控账号</span>
          <strong>{totalAccounts}</strong>
          <span className="small">个</span>
        </div>
      </section>
      <div className={styles.topicInlineRefresh}>
        <span className="small">{modeOnly ? '手动刷新全部主题' : '手动刷新当前主题'}</span>
        <Button type="primary" icon={<ReloadOutlined />} onClick={refreshTopics} loading={refreshing}>
            {refreshing ? '采集中…' : '立即采集'}
        </Button>
      </div>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>{modeOnly ? activeMode.label : `${name} · ${activeMode.label}`}</h2>
            <p className="small">{activeMode.desc} · 最近更新 {calculatedAt ? formatTime(calculatedAt) : '—'}</p>
          </div>
        </div>
        <div className={styles.topicTrendHead}>
          <span>排名</span>
          <span>热门内容</span>
          <span>来源账号</span>
          <span>当前浏览量</span>
          <span>本轮新增</span>
          <span>榜单变化</span>
          <span>状态</span>
        </div>
        {loading ? (
          <Spin tip="正在加载帖子榜单…" />
        ) : error ? (
          <Alert type="error" message={`加载失败：${error}`} showIcon />
        ) : boardPosts.length === 0 ? (
          <Empty description="暂无帖子榜单，等待采集" />
        ) : (
          <div className={styles.topicLeaderboard}>
            {boardPosts.map((post) => {
              const expanded = expandedPostId === post.signalId
              return (
                <article key={post.signalId} className={styles.topicRankItem}>
                  <button
                    type="button"
                    className={styles.topicTrendRow}
                    onClick={() => setExpandedPostId(expanded ? null : post.signalId)}
                  >
                    <RankBadge rank={post.rank} />
                    <TopicTrendLabel post={post} />
                  </button>
                  {expanded ? <TopicPostPanel post={post} /> : null}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function TopicTrendLabel({ post }: { post: TopicCirclePostLeaderboardItem }) {
  return (
    <>
      <span>
        <b>{summarizePost(post)}</b>
        <br />
        <small className="muted">{post.topicWatchName} · 发布 {formatTime(post.publishedAt)}</small>
      </span>
      <span className={styles.topicAuthor}>
        <i>{getAuthorInitial(post.authorHandle)}</i>
        @{post.authorHandle.replace(/^@/, '')}
      </span>
      <strong>{formatMetric(post.metrics?.views)}</strong>
      <span className={post.deltaViews ? styles.topicPositive : ''}>
        {post.deltaViews == null ? '—' : `+${formatMetric(post.deltaViews)}`}
      </span>
      <span>{formatRankChange(post.previousRank, post.rank)}</span>
      <Tag color={post.status === 'hot_event_candidate' ? 'orange' : 'processing'}>
        {post.status === 'hot_event_candidate' ? 'Hot Event 候选' : '观察中'}
      </Tag>
    </>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const tone = rank <= 3 ? styles.topicRankHot : ''
  return <span className={`${styles.topicRankBadge} ${tone}`}>{rank}</span>
}

function TopicPostPanel({ post }: { post: TopicCirclePostLeaderboardItem }) {
  return (
    <div className={styles.topicPostPanel}>
      <div className={styles.topicPostSummary}>
        <span>来源账号：@{post.authorHandle.replace(/^@/, '')}</span>
        <span>首次观测：{formatTime(post.firstObservedAt)}</span>
        <span>最近观测：{formatTime(post.lastObservedAt)}</span>
      </div>
      <div className={styles.topicPostList}>
        <TopicPostItem post={post} />
      </div>
    </div>
  )
}

function TopicPostItem({ post }: { post: TopicCircleTopicPost }) {
  return (
    <article className={styles.topicPostItem}>
      <div className={styles.topicPostMeta}>
        <strong>{post.authorName || post.authorHandle}</strong>
        <span>@{post.authorHandle.replace(/^@/, '')}</span>
        <span>{formatTime(post.publishedAt)}</span>
      </div>
      <p>{post.text || '暂无正文'}</p>
      <div className={styles.topicPostFooter}>
        <span>浏览 {formatMetric(post.metrics?.views)}</span>
        <span>点赞 {formatMetric(post.metrics?.likes)}</span>
        <span>回复 {formatMetric(post.metrics?.replies)}</span>
        <span>转发 {formatMetric(post.metrics?.reposts)}</span>
        {post.url ? (
          <Button size="small" href={post.url} target="_blank" rel="noreferrer">
            打开帖子
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function formatMetric(value?: number) {
  if (value == null) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(value)
}

function formatRankChange(previousRank: number | null, rank: number) {
  if (previousRank == null) return '—'
  const delta = previousRank - rank
  if (delta > 0) return `↑ ${delta}`
  if (delta < 0) return `↓ ${Math.abs(delta)}`
  return '—'
}

function getAuthorInitial(handle: string) {
  return handle.replace(/^@/, '').slice(0, 1).toUpperCase() || 'X'
}

function summarizePost(post: TopicCirclePostLeaderboardItem) {
  const text = post.text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()
  if (!text) return '暂无正文摘要'
  if (/[\u4e00-\u9fa5]/.test(text)) return truncateText(text, 42)
  return truncateText(`${post.authorHandle.replace(/^@/, '')} 发布了一条与${post.topicWatchName}相关的帖子：${text}`, 58)
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}

function dedupeLeaderboardPosts(posts: TopicCirclePostLeaderboardItem[]) {
  const map = new Map<string, TopicCirclePostLeaderboardItem>()
  posts.forEach((post) => {
    const key = post.postId || post.url || post.signalId
    const existing = map.get(key)
    if (!existing || new Date(post.lastObservedAt).getTime() > new Date(existing.lastObservedAt).getTime()) {
      map.set(key, post)
    }
  })
  return Array.from(map.values())
}
