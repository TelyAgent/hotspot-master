import { useMemo, useState } from 'react'
import { Alert, Button, Empty, List, Select, Space, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { KolRadarFeedResponse } from '../../api/types'
import styles from './Monitor.module.css'

type SortKey = 'views' | 'latest' | 'likes' | 'comments' | 'handle'

function formatDateTime(iso?: string | null) {
  if (!iso) return '--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

export default function KolRadar({
  data,
  loading,
  collecting,
  error,
  onCollect,
}: {
  data: KolRadarFeedResponse | null
  loading: boolean
  collecting: boolean
  error: string | null
  onCollect: () => Promise<number>
}) {
  const { toast } = useApp()
  const [sortBy, setSortBy] = useState<SortKey>('views')

  const items = data?.items ?? []
  const sortedItems = useMemo(() => {
    const next = [...items]

    next.sort((a, b) => {
      if (sortBy === 'handle') return a.handle.localeCompare(b.handle)

      if (sortBy === 'latest') {
        return new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
      }

      if (sortBy === 'likes') {
        return getMetricNumber(b.metrics, 'likes', 'likeCount') - getMetricNumber(a.metrics, 'likes', 'likeCount')
      }

      if (sortBy === 'comments') {
        return getMetricNumber(b.metrics, 'replies', 'replyCount', 'commentCount', 'comments') - getMetricNumber(a.metrics, 'replies', 'replyCount', 'commentCount', 'comments')
      }

      return getMetricNumber(b.metrics, 'views', 'viewCount') - getMetricNumber(a.metrics, 'views', 'viewCount')
    })

    return next
  }, [items, sortBy])

  const uniqueHandles = new Set(items.map((item) => item.handle)).size
  const observedLabel = formatDateTime(data?.collectedAt || items[0]?.observedAt)

  const handleCollect = () => {
    toast('已发起 KOL 雷达立即采集')
    onCollect()
      .then((count) => {
        toast(`KOL 雷达采集完成，新增 ${count} 条原始帖子`)
      })
      .catch((e: unknown) => {
        toast(e instanceof Error ? e.message : 'KOL 雷达采集失败')
      })
  }

  return (
    <>
      <div className={styles.topicToolbar}>
        <Space wrap>
          <span className="small">
            KOL 人驱动热点雷达每 6 小时自动采集；最近成功采集 {observedLabel || '--'}
          </span>
          <Select
            style={{ minWidth: 170 }}
            value={sortBy}
            options={[
              { value: 'views', label: '按浏览量' },
              { value: 'latest', label: '按最新采集' },
              { value: 'likes', label: '按点赞数' },
              { value: 'comments', label: '按评论数' },
              { value: 'handle', label: '按账号名' },
            ]}
            onChange={(value) => setSortBy(value)}
          />
        </Space>
        <Button type="primary" icon={<ReloadOutlined />} loading={collecting} onClick={handleCollect}>
          立即采集
        </Button>
      </div>
      <section className={styles.kolWrap}>
        <div className={styles.kolStats}>
          <div>
            <strong>{items.length}</strong>
            <span>最新帖子</span>
          </div>
          <div>
            <strong>{uniqueHandles}</strong>
            <span>活跃账号</span>
          </div>
          <div>
            <strong>{observedLabel || '--'}</strong>
            <span>最近采集</span>
          </div>
        </div>
        {loading ? (
          <div className="note">正在加载 KOL 雷达数据…</div>
        ) : error ? (
          <Alert type="error" message={`加载失败：${error}`} showIcon />
        ) : items.length === 0 ? (
          <Empty description="暂无 KOL 采集数据" />
        ) : (
          <List
            className={styles.kolList}
            dataSource={sortedItems}
            renderItem={(item) => (
              <List.Item className={styles.kolListItem}>
                <div className={styles.kolCard}>
                  <div className={styles.kolCardTop}>
                    <div className={styles.kolCardTitleRow}>
                      <h3>{item.title}</h3>
                      <Tag color="blue">@{item.handle}</Tag>
                    </div>
                    <div className={styles.kolCardMeta}>
                      {item.authorName ? <span>{item.authorName}</span> : null}
                      {item.postType ? <span>{item.postType}</span> : null}
                      {item.publishedAt ? <span>发表于 {formatDateTime(item.publishedAt)}</span> : null}
                      <span>采集于 {formatDateTime(item.observedAt)}</span>
                    </div>
                  </div>
                  <p className={styles.kolSummary}>{item.summary}</p>
                  <div className={styles.kolMetricRow}>
                    <Tag color="blue">浏览量 {formatMetricNumber(getMetricNumber(item.metrics, 'views', 'viewCount'))}</Tag>
                    <Tag color="green">点赞 {formatMetricNumber(getMetricNumber(item.metrics, 'likes', 'likeCount'))}</Tag>
                    <Tag color="orange">评论 {formatMetricNumber(getMetricNumber(item.metrics, 'replies', 'replyCount', 'commentCount', 'comments'))}</Tag>
                  </div>
                  <div className={styles.kolCardFoot}>
                    <span className="muted">来源：X 人驱动雷达</span>
                    {item.url ? (
                      <Button type="link" href={item.url} target="_blank" rel="noreferrer">
                        打开帖子
                      </Button>
                    ) : null}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </section>
      <div className="note">
        这里只展示 KOL 雷达自动采集出来的帖子信号，后续可继续接到内容创作或事件管理流程。
      </div>
    </>
  )
}

function getMetricNumber(metrics: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metrics[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

function formatMetricNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`
  }
  return String(value)
}
