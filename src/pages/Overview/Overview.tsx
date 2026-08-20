import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Head } from '../../components/ui'
import { useOverview } from '../../hooks/useOverview'
import { useTrending } from '../../hooks/useTrending'
import type { OverviewRange } from '../../api/overview'
import styles from './Overview.module.css'

const RANGES: [OverviewRange, string][] = [
  ['7d', '过去7天'],
  ['30d', '过去30天'],
  ['1y', '过去一年'],
]

function formatPercent(v?: number): string {
  if (v == null) return '0%'
  return `${(v * 100).toFixed(1)}%`
}

function formatCompact(v?: number): string {
  if (v == null) return '缺失'
  if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(Math.round(v))
}

function formatLatency(v?: number): string {
  if (v == null) return '—'
  const minutes = Math.round(v / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = minutes / 60
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

export default function Overview() {
  const { go, region } = useApp()
  const [range, setRange] = useState<OverviewRange>('7d')
  const { data, loading, error } = useOverview(range)
  const trending = useTrending(region)
  const stats = data?.stats
  const anomalyCount = data?.anomalies.reduce((total, item) => total + item.count, 0) ?? 0
  const maxTrendValue = Math.max(
    1,
    ...(data?.trend ?? []).map((point) => (point.views ?? 0) + point.interactions),
  )

  return (
    <>
      <Head
        title="运营总览"
        desc="先看运营结果，再处理待办、异常、任务进度与当前热点。"
        actions={
          <>
            <select
              className="filter"
              value={range}
              onChange={(e) => setRange(e.target.value as OverviewRange)}
            >
              {RANGES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn primary" onClick={() => go('tasks')}>
              进入内容发布
            </button>
          </>
        }
      />

      <section className={styles.stats}>
        <div className={styles.stat}>
          <label>48小时表现良好率</label>
          <strong>{loading ? '…' : formatPercent(stats?.wellPerformingRate)}</strong>
          <span className="small">
            {loading ? '加载中' : `${stats?.wellPerformingCount ?? 0}/${stats?.publishedCount ?? 0} 条达到1,000+浏览`}
          </span>
        </div>
        {(
          [
            ['总浏览量', loading ? '…' : formatCompact(stats?.totalViews), '最新快照'],
            ['互动总量', loading ? '…' : formatCompact(stats?.totalInteractions), '赞/回复/转发/引用'],
            ['已发布内容', loading ? '…' : String(stats?.publishedCount ?? 0), `${stats?.publishedAccounts ?? 0}个账号`],
            ['平均首发用时', loading ? '…' : formatLatency(stats?.avgFirstPublishLatencyMs), '事件生成到URL回填'],
          ] as [string, string, string][]
        ).map((x, i) => (
          <div className={styles.stat} key={i}>
            <label>{x[0]}</label>
            <strong>{x[1]}</strong>
            <span className={styles.delta}>{x[2]}</span>
          </div>
        ))}
      </section>

      <div className={`two grid ${styles.overviewBlock}`}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>结果趋势</h2>
              <p className="small">浏览、互动与发布数量变化</p>
            </div>
            <span className="pill green">{RANGES.find(([value]) => value === range)?.[1]}</span>
          </div>
          {error && <div className="note warning">加载失败：{error}</div>}
          {(data?.trend ?? []).map((point) => (
            <div className={styles.trendRow} key={point.date}>
              <span>{point.date.slice(5)}</span>
              <span className={styles.progressTrack}>
                <i style={{ width: `${Math.round((((point.views ?? 0) + point.interactions) / maxTrendValue) * 100)}%` }}></i>
              </span>
              <small className="muted">
                {formatCompact(point.views)}浏览 · {formatCompact(point.interactions)}互动 · {point.publishedCount}条
              </small>
            </div>
          ))}
          {!loading && !error && (data?.trend.length ?? 0) === 0 && (
            <div className="note">暂无趋势数据</div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>账号表现</h2>
              <p className="small">用于判断账号负载与内容效果</p>
            </div>
            <button className="btn link" onClick={() => go('insights')}>
              查看复盘 →
            </button>
          </div>
          {(data?.accountPerformance ?? []).map((account) => (
            <div className={styles.accountPerformance} key={account.accountId}>
              <b>{account.name}</b>
              <span className={styles.miniBar}>
                <i style={{ width: `${account.score}%` }}></i>
              </span>
              <strong>{formatPercent(account.wellPerformingRate)}</strong>
            </div>
          ))}
          {!loading && (data?.accountPerformance.length ?? 0) === 0 && (
            <div className="note">暂无账号表现数据</div>
          )}
        </section>
      </div>

      <div className={`two grid ${styles.overviewBlock}`}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>需要人工处理</h2>
              <p className="small">只呈现自动链路无法自行完成的工作</p>
            </div>
            <span className="pill orange">{data?.manualItems.length ?? 0}项</span>
          </div>
          {(data?.manualItems ?? []).map((item) => (
            <div className={styles.attention} key={`${item.taskId ?? item.eventId}-${item.description}`}>
              <i className={`${styles.severity} ${item.severity === 'critical' ? styles.red : ''}`}></i>
              <span>
                <b>{item.title}</b>
                <br />
                <small className="muted">{item.description}</small>
              </span>
              <button className="btn mini" onClick={() => go(item.actionPage)}>
                处理
              </button>
            </div>
          ))}
          {!loading && (data?.manualItems.length ?? 0) === 0 && (
            <div className="note">暂无需要人工处理的事项</div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>链路异常</h2>
              <p className="small">定位采集、生成、发布与追踪中的问题</p>
            </div>
            <span className={styles.anomalyCount}>{anomalyCount}</span>
          </div>
          {(data?.anomalies ?? []).map((item) => (
            <div className={styles.attention} key={item.type}>
              <i className={`${styles.severity} ${item.severity === 'critical' ? styles.red : ''}`}></i>
              <span>
                <b>
                  {item.type} · {item.count}项
                </b>
                <br />
                <small className="muted">{item.description}</small>
              </span>
              <button className="btn mini" onClick={() => go(item.actionPage)}>
                查看
              </button>
            </div>
          ))}
          {!loading && (data?.anomalies.length ?? 0) === 0 && (
            <div className="note">暂无链路异常</div>
          )}
        </section>
      </div>

      <div className="section">
        <div>
          <h2>进行中的任务组</h2>
          <p className="small">按Event查看账号任务的整体推进情况</p>
        </div>
        <button className="btn link" onClick={() => go('tasks')}>
          查看全部发布任务 →
        </button>
      </div>
      <section className="card">
        <div className={styles.taskProgress}>
          <span>关联Event</span>
          <span>账号任务</span>
          <span>进度</span>
          <span>状态</span>
        </div>
        {(data?.taskGroups ?? []).map((group) => (
          <div className={styles.taskProgress} key={group.eventId}>
            <b>{group.eventTitle}</b>
            <span>{group.taskCount}个账号任务</span>
            <span className={styles.progressTrack}>
              <i style={{ width: `${group.progressPercent}%` }}></i>
            </span>
            <span className={`pill ${group.progressPercent >= 100 ? 'green' : 'orange'}`}>{group.statusLabel}</span>
          </div>
        ))}
        {!loading && (data?.taskGroups.length ?? 0) === 0 && (
          <div className="note">暂无进行中的任务组</div>
        )}
      </section>

      <div className="section">
        <div>
          <h2>当前榜单重点</h2>
          <p className="small">快速了解当前热度；完整Top30与聚合信息在热点监测</p>
        </div>
        <button className="btn link" onClick={() => go('monitor')}>
          查看Top30 →
        </button>
      </div>
      {trending.error && <div className="note warning">热点榜单加载失败：{trending.error}</div>}
      <div className="three grid">
        {(trending.data?.items ?? []).slice(0, 3).map((x) => (
          <div className={styles.topic} key={x.rank}>
            <span className={styles.number}>#{x.rank}</span>
            <h3>{x.name}</h3>
            <span className="small">
              {x.heat}
            </span>
          </div>
        ))}
        {!trending.loading && !trending.error && (trending.data?.items.length ?? 0) === 0 && (
          <div className="note">暂无榜单数据</div>
        )}
      </div>
    </>
  )
}
