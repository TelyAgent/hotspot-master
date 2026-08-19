import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useInsights } from '../../hooks/useInsights'
import styles from './Insights.module.css'

const RANGES: [string, string][] = [
  ['7d', '过去7天'],
  ['30d', '过去30天'],
  ['1y', '过去一年'],
]

const RISKS: [string, string][] = [
  ['BREAKING使用不当', '6次'],
  ['产品硬关联', '4次'],
  ['追踪接口异常', '3次'],
]

function formatPercent(v?: number): string {
  if (v == null) return '0%'
  return `${(v * 100).toFixed(1)}%`
}

function formatViews(v?: number): string {
  if (v == null) return '0'
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(Math.round(v))
}

export default function Insights() {
  const { go } = useApp()
  const [range, setRange] = useState('7d')
  const { data, loading, error } = useInsights(range)

  const stats = data?.stats
  const accounts = data?.accounts ?? []

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
          <span className="small">风险触发版本</span>
          <strong style={{ fontSize: 25, display: 'block' }}>—</strong>
        </div>
      </div>

      {error && <div className="note warning">加载失败：{error}</div>}

      <div className="two grid" style={{ marginTop: 14 }}>
        <section className="card">
          <h2>账号表现</h2>
          {accounts.map((a) => (
            <div className={styles.settingRow} key={a.name}>
              <b>{a.name}</b>
              <span>{formatViews(a.avgViews)}平均浏览</span>
              <span className="pill green">{formatPercent(a.wellPerformingRate)}</span>
              <button className="btn link">详情</button>
            </div>
          ))}
          {!loading && accounts.length === 0 && (
            <div className="note">暂无账号表现数据</div>
          )}
        </section>

        <section className="card">
          <h2>风险与异常线索</h2>
          {RISKS.map((x) => (
            <div className={styles.attention} key={x[0]}>
              <i className={styles.severity}></i>
              <span>
                <b>{x[0]}</b>
                <br />
                <small>建议进入设置检查规则</small>
              </span>
              <button className="btn mini" onClick={() => go('settings')}>
                处理
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
