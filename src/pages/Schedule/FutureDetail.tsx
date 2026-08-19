import type { ExpressionBoundary, FutureEvent } from '../../api/futureEvents'
import {
  BOUNDARY_LABEL,
  CONFIRMATION_LABEL,
  PRECISION_LABEL,
  SOURCE_LABEL,
  scoreBand,
} from '../../data/futureEventLabels'
import styles from './Schedule.module.css'

const BOUNDARY_TONE: Record<ExpressionBoundary, string> = {
  factual: 'green',
  qualified: 'orange',
  internal_only: 'orange',
  blocked: 'red',
}

export default function FutureDetail({
  event,
  onGenerate,
  onCampaign,
}: {
  event: FutureEvent
  onGenerate: () => void
  onCampaign: () => void
}) {
  const a = event.actionScore
  const band = scoreBand(a.total)
  const primarySource = event.evidence[0]?.sourceType ?? 'manual'

  return (
    <aside className={styles.eventDetail}>
      <span className="small">
        {SOURCE_LABEL[primarySource]} · {PRECISION_LABEL[event.schedulePrecision]}
        {event.factTime ? ` · ${event.factTime}` : ''}
      </span>
      <h1 style={{ fontSize: 21 }}>{event.title}</h1>
      <p>{event.subject}</p>

      <div className={styles.confidenceName}>
        <b>{CONFIRMATION_LABEL[event.confirmationLevel]}</b>
        <br />
        <small>
          表达边界：
          <span className={`pill ${BOUNDARY_TONE[event.expressionBoundary]}`}>
            {BOUNDARY_LABEL[event.expressionBoundary]}
          </span>
        </small>
      </div>

      <div className={styles.futureDetailScore}>
        <strong>{a.total}</strong>
        <span>
          <b>{band.label}</b>
          <br />
          <small className="muted">系统建议，运营可以修改</small>
        </span>
      </div>

      <h2>Action Score 分解</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          ['影响力', a.impact.scope + a.impact.relevance + a.impact.outcomeImportance, '/30'],
          ['证据可靠度', a.evidence, '/20'],
          ['热度动量', a.heatMomentum, '/30'],
          ['时间紧迫度', a.timeUrgency, '/10'],
          ['内容可执行性', a.contentReadiness, '/10'],
        ].map(([label, value, max]) => (
          <div key={label} style={{ background: '#f4f7f7', padding: 8 }}>
            <small className="muted">{label}</small>
            <br />
            <b>
              {value}
              {max}
            </b>
          </div>
        ))}
      </div>

      <h2>证据与来源</h2>
      {event.evidence.length === 0 && <div className="note">暂无证据记录。</div>}
      {event.evidence.map((s) => (
        <div className={styles.sourceRow} key={s.id}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {SOURCE_LABEL[s.sourceType]} ↗
          </a>
          <br />
          <small className="muted">{s.url}</small>
          <p>{s.claims.join('；')}</p>
          <small className="muted">核验于 {s.verifiedAt}</small>
        </div>
      ))}

      <h2 style={{ marginTop: 16 }}>响应窗口</h2>
      <div className={styles.windowTrack}>
        <i></i>
      </div>
      <div className={styles.windowLabels}>
        <span>持续监测</span>
        <span>内容预热</span>
        <span>事件进行</span>
        <span>结果跟进</span>
      </div>
      <div className="note">
        监测 {event.windows.monitoring ? event.windows.monitoring.join(' ~ ') : '—'} · 预热{' '}
        {event.windows.preheat ? event.windows.preheat.join(' ~ ') : '—'}
      </div>

      {event.relatedEventId && (
        <div className="note">关联 Event：{event.relatedEventId}</div>
      )}

      <button
        className="btn primary"
        style={{ width: '100%', marginBottom: 8 }}
        onClick={onGenerate}
      >
        生成内容
      </button>
      <button className="btn" style={{ width: '100%' }} onClick={onCampaign}>
        生成营销方案
      </button>
    </aside>
  )
}
