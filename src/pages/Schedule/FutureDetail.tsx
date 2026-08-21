import { Alert, Button, Empty, Tag } from 'antd'
import { BulbOutlined, FileTextOutlined } from '@ant-design/icons'
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
          <Tag color={BOUNDARY_TONE[event.expressionBoundary] === 'red' ? 'error' : BOUNDARY_TONE[event.expressionBoundary] === 'green' ? 'success' : 'warning'}>
            {BOUNDARY_LABEL[event.expressionBoundary]}
          </Tag>
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
      <div className={styles.scoreBreakdown}>
        {[
          ['影响力', a.impact.scope + a.impact.relevance + a.impact.outcomeImportance, '/30'],
          ['证据可靠度', a.evidence, '/20'],
          ['热度动量', a.heatMomentum, '/30'],
          ['时间紧迫度', a.timeUrgency, '/10'],
          ['内容可执行性', a.contentReadiness, '/10'],
        ].map(([label, value, max]) => (
          <div key={label} className={styles.scoreItem}>
            <span>{label}</span>
            <strong>
              {value}
              <small>{max}</small>
            </strong>
          </div>
        ))}
      </div>

      <h2>证据与来源</h2>
      {event.evidence.length === 0 && <Empty description="暂无证据记录" />}
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
      <Alert
        className={styles.windowAlert}
        message={`监测 ${event.windows.monitoring ? event.windows.monitoring.join(' ~ ') : '—'} · 预热 ${
          event.windows.preheat ? event.windows.preheat.join(' ~ ') : '—'
        }`}
        showIcon
      />

      {event.relatedEventId && (
        <Alert style={{ marginTop: 8 }} message={`关联 Event：${event.relatedEventId}`} showIcon />
      )}

      <Button
        type="primary"
        icon={<FileTextOutlined />}
        style={{ width: '100%', marginBottom: 8 }}
        onClick={onGenerate}
      >
        生成内容
      </Button>
      <Button icon={<BulbOutlined />} style={{ width: '100%' }} onClick={onCampaign}>
        生成营销方案
      </Button>
    </aside>
  )
}
