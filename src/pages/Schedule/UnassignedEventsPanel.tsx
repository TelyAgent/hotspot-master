import { useUnassignedFutureEvents } from '../../hooks/useUnassignedFutureEvents'
import type { FutureEvent } from '../../api/futureEvents'
import {
  CONFIRMATION_LABEL,
  SOURCE_LABEL,
  scoreBand,
} from '../../data/futureEventLabels'
import styles from './Schedule.module.css'

export default function UnassignedEventsPanel({
  onOpen,
}: {
  onOpen: (e: FutureEvent) => void
}) {
  const { events, loading, error } = useUnassignedFutureEvents()

  return (
    <section className="card" style={{ marginBottom: 14 }}>
      <div className={styles.monthHead}>
        <div>
          <span className={styles.monthTitle}>时间待确认</span>
          <br />
          <span className="small">尚未确定事实时间的事件，持续观察官方更新，不进入预热</span>
        </div>
      </div>

      {loading ? (
        <div className="note">正在加载…</div>
      ) : error ? (
        <div className="note warning">加载失败：{error}</div>
      ) : events.length === 0 ? (
        <div className="note">暂无时间待确认事件。</div>
      ) : (
        <div className={styles.sourceList}>
          {events.map((e) => (
            <div className={styles.sourceRow} key={e.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div className={styles.sourceRowMain}>
                    <b>{e.title}</b>
                    <span className="pill">{CONFIRMATION_LABEL[e.confirmationLevel]}</span>
                  </div>
                  <small className="muted">
                    {SOURCE_LABEL[e.evidence[0]?.sourceType ?? 'manual']} · {e.subject} ·{' '}
                    {e.actionScore.total}分 {scoreBand(e.actionScore.total).label}
                  </small>
                </div>
                <button className="btn" onClick={() => onOpen(e)}>
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
