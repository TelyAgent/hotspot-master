import { Alert, Button, Empty, Spin, Tag } from 'antd'
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
        <Spin tip="正在加载…" />
      ) : error ? (
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      ) : events.length === 0 ? (
        <Empty description="暂无时间待确认事件" />
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
                    <Tag>{CONFIRMATION_LABEL[e.confirmationLevel]}</Tag>
                  </div>
                  <small className="muted">
                    {SOURCE_LABEL[e.evidence[0]?.sourceType ?? 'manual']} · {e.subject} ·{' '}
                    {e.actionScore.total}分 {scoreBand(e.actionScore.total).label}
                  </small>
                </div>
                <Button onClick={() => onOpen(e)}>
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
