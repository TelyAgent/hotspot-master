import { useState } from 'react'
import { Alert, Button, Card, Empty, List, Select, Statistic, Tag } from 'antd'
import { Head } from '../../components/ui'
import { useInsights } from '../../hooks/useInsights'
import styles from './Insights.module.css'

const RANGES: [string, string][] = [
  ['7d', '过去7天'],
  ['30d', '过去30天'],
  ['1y', '过去一年'],
]

function formatPercent(v?: number): string {
  if (v == null) return '0%'
  return `${(v * 100).toFixed(1)}%`
}

function formatViews(v?: number): string {
  if (v == null) return '缺失'
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(Math.round(v))
}

function formatNumber(v?: number): string {
  if (v == null) return '缺失'
  return String(Math.round(v))
}

function formatTime(value: string): string {
  if (!value) return '未知时间'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return '未知时间'
  return new Date(timestamp).toLocaleString()
}

export default function Insights() {
  const [range, setRange] = useState('7d')
  const { data, loading, error } = useInsights(range)

  const stats = data?.stats
  const accounts = data?.accounts ?? []
  const trackingIssues = data?.trackingIssues ?? []

  return (
    <>
      <Head
        title="复盘优化"
        desc="查看内容效果、风险版本与异常原因。"
        actions={
          <Select
            style={{ minWidth: 140 }}
            value={range}
            options={RANGES.map(([value, label]) => ({ value, label }))}
            onChange={setRange}
          />
        }
      />

      <div className="four grid">
        <Card>
          <Statistic title="追踪中帖子" value={loading ? '…' : stats?.trackingPosts ?? 0} />
        </Card>
        <Card>
          <Statistic title="48h表现良好率" value={loading ? '…' : formatPercent(stats?.wellPerformingRate)} />
        </Card>
        <Card>
          <Statistic title="平均互动率" value={loading ? '…' : formatPercent(stats?.avgInteractionRate)} />
        </Card>
        <Card>
          <Statistic title="追踪异常" value={loading ? '…' : stats?.trackingErrorPosts ?? 0} />
        </Card>
      </div>

      {error && <Alert style={{ marginTop: 14 }} type="error" message={`加载失败：${error}`} showIcon />}

      <div className="two grid" style={{ marginTop: 14 }}>
        <section className="card">
          <h2>账号表现</h2>
          <List
            dataSource={accounts}
            locale={{ emptyText: loading ? '加载中' : <Empty description="暂无账号表现数据" /> }}
            renderItem={(a) => (
              <List.Item className={styles.settingRow}>
                <b>{a.name}</b>
                <span>{a.publishedPosts}条发布</span>
                <span>{formatViews(a.avgViews)}平均浏览</span>
                <span>
                  {formatNumber(a.avgLikes)}赞 / {formatNumber(a.avgReplies)}回复 / {formatNumber(a.avgReposts)}转发
                </span>
                <Tag color="success">{formatPercent(a.wellPerformingRate)}</Tag>
              </List.Item>
            )}
          />
        </section>

        <section className="card">
          <h2>追踪异常线索</h2>
          <List
            dataSource={trackingIssues}
            locale={{ emptyText: loading ? '加载中' : <Empty description="暂无追踪异常" /> }}
            renderItem={(issue) => (
              <List.Item className={styles.attention}>
                <i className={styles.severity}></i>
                <span>
                  <b>{issue.accountName}</b>
                  <br />
                  <small>{issue.lastTrackingError}</small>
                  <br />
                  <small>
                    失败 {issue.trackingFailureCount} 次 · {formatTime(issue.lastTrackingErrorAt)}
                  </small>
                </span>
                <Button size="small" href={issue.url} target="_blank" rel="noreferrer">
                  原帖
                </Button>
              </List.Item>
            )}
          />
        </section>
      </div>
    </>
  )
}
