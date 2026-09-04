import type { FutureEvent } from '../../api/futureEvents'
import styles from './Schedule.module.css'

export default function HeatPanel({ event }: { event: FutureEvent }) {
  const { heat } = event
  const buckets = heat.buckets.slice(-28)
  const maxCount = Math.max(0, ...buckets.map((b) => b.count))
  const level = (count: number) =>
    maxCount === 0 ? 0 : Math.ceil((count / maxCount) * 4)

  // 累计讨论量曲线：按时间排序后累加，只画真实数据
  const sorted = [...heat.buckets].sort((a, b) => a.startAt.localeCompare(b.startAt))
  const cumulative: number[] = []
  let acc = 0
  for (const b of sorted) {
    acc += b.count
    cumulative.push(acc)
  }
  const cumMax = Math.max(1, ...cumulative)
  const W = 560
  const H = 140
  const PAD = 6
  const points = cumulative.map((v, i) => {
    const x = sorted.length === 1 ? W / 2 : (i / (sorted.length - 1)) * W
    const y = H - (v / cumMax) * (H - PAD * 2) - PAD
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const polyline = points.join(' L ')
  const rangeLabel =
    sorted.length > 0
      ? `${sorted[0].startAt} ~ ${sorted[sorted.length - 1].endAt}`
      : '暂无热力数据'

  return (
    <div className={styles.heatPanel}>
      <div className={styles.heatPanelHead}>
        <div>
          <h2>热度热力图与趋势</h2>
          <p className="small">
            {event.title} · 基于 X Post Count 与 6 小时桶计算，不代表事件事实已确认
          </p>
        </div>
        <div>
          <span className="small">当前关注强度</span>
          <div className={styles.heatScore}>
            {heat.intensityMultiple != null
              ? `${heat.intensityMultiple.toFixed(1)}x`
              : '热度历史不足'}
          </div>
        </div>
      </div>

      <div className={styles.heatBody}>
        <div>
          <div className={styles.heatChart}>
            {sorted.length === 0 ? (
              <div className="note">暂无热力数据</div>
            ) : (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                aria-label="累计讨论量趋势"
              >
                <path d={`M0 ${H} L${polyline} L${W} ${H} Z`} fill="#e6f4ff" />
                <path
                  d={`M${polyline}`}
                  fill="none"
                  stroke="#1677ff"
                  strokeWidth="3"
                />
              </svg>
            )}
          </div>
          <div className={styles.heatAxis}>
            <span>持续监测</span>
            <span>进入预热</span>
            <span>事件临近</span>
            <span>结果窗口</span>
          </div>
        </div>
        <div>
          <div className={styles.heatGrid}>
            {buckets.length === 0 ? (
              <div className="note">暂无热力数据</div>
            ) : (
              buckets.map((b, i) => (
                <i
                  key={i}
                  className={`${styles.heatCell} ${level(b.count) ? styles['l' + level(b.count)] : ''}`}
                  title={`${b.startAt} 起 6h：${b.count} 条`}
                />
              ))
            )}
          </div>
          <div className={styles.heatLegend}>
            <span>低</span>
            <i style={{ background: '#f0f5ff' }} />
            <i style={{ background: '#d6e4ff' }} />
            <i style={{ background: '#91caff' }} />
            <i style={{ background: '#4096ff' }} />
            <i style={{ background: '#1677ff' }} />
            <span>高</span>
          </div>
          <p className="small" style={{ marginTop: 10 }}>
            最近 6h：{heat.last6h} · 前 6h：{heat.prev6h} ·{' '}
            {heat.growthPct != null ? `增长 ${heat.growthPct}%` : '新出现'} · 累计{' '}
            {heat.cumulative}
            <br />
            {rangeLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
