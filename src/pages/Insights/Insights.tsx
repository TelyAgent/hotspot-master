import { useState } from 'react'
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
          <select
            className="filter"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        }
      />

      <div className="four grid">
        <div className="card">
          <span className="small">追踪中帖子</span>
          <strong style={{ fontSize: 25, display: 'block' }}>
            {loading ? '…' : stats?.trackingPosts ?? 0}
          </strong>
        </div>
        <div className="card">
          <span className="small">48h表现良好率</span>
          <strong style={{ fontSize: 25, display: 'block' }}>
            {loading ? '…' : formatPercent(stats?.wellPerformingRate)}
          </strong>
        </div>
        <div className="card">
          <span className="small">平均互动率</span>
          <strong style={{ fontSize: 25, display: 'block' }}>
            {loading ? '…' : formatPercent(stats?.avgInteractionRate)}
          </strong>
        </div>
        <div className="card">
          <span className="small">追踪异常</span>
          <strong style={{ fontSize: 25, display: 'block' }}>
            {loading ? '…' : stats?.trackingErrorPosts ?? 0}
          </strong>
        </div>
      </div>

      {error && <div className="note warning">加载失败：{error}</div>}

      <div className="two grid" style={{ marginTop: 14 }}>
        <section className="card">
          <h2>账号表现</h2>
          {accounts.map((a) => (
            <div className={styles.settingRow} key={a.accountId}>
              <b>{a.name}</b>
              <span>{a.publishedPosts}条发布</span>
              <span>{formatViews(a.avgViews)}平均浏览</span>
              <span>
                {formatNumber(a.avgLikes)}赞 / {formatNumber(a.avgReplies)}回复 / {formatNumber(a.avgReposts)}转发
              </span>
              <span className="pill green">{formatPercent(a.wellPerformingRate)}</span>
            </div>
          ))}
          {!loading && accounts.length === 0 && (
            <div className="note">暂无账号表现数据</div>
          )}
        </section>

        <section className="card">
          <h2>追踪异常线索</h2>
          {trackingIssues.map((issue) => (
            <div className={styles.attention} key={issue.publicationRecordId}>
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
              <a className="btn mini" href={issue.url} target="_blank" rel="noreferrer">
                原帖
              </a>
            </div>
          ))}
          {!loading && trackingIssues.length === 0 && (
            <div className="note">暂无追踪异常</div>
          )}
        </section>
      </div>
    </>
  )
}
