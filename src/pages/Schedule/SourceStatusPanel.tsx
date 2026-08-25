import { Alert, Spin, Tag } from 'antd'
import { useSourceSyncStatus } from '../../hooks/useSourceSyncStatus'
import type { FutureEventSourcePlanStatus } from '../../api/futureEvents'
import styles from './Schedule.module.css'

const STATUS_LABEL: Record<FutureEventSourcePlanStatus['status'], string> = {
  ok: '正常',
  error: '异常',
  disabled: '未启用',
  pending: '待配置',
}

const STATUS_TONE: Record<FutureEventSourcePlanStatus['status'], string> = {
  ok: 'success',
  error: 'error',
  disabled: 'warning',
  pending: 'warning',
}

export default function SourceStatusPanel() {
  const { sourceStatus, loading, error } = useSourceSyncStatus()

  return (
    <section className="card" style={{ marginBottom: 14 }}>
      <div className={styles.monthHead}>
        <div>
          <span className={styles.monthTitle}>来源同步状态</span>
          <br />
          <span className="small">未来事件来源由 Markdown 策略生成来源计划，采集只执行已激活计划</span>
        </div>
      </div>

      {loading ? (
        <Spin tip="正在加载来源状态…" />
      ) : error ? (
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      ) : !sourceStatus ? (
        <Alert type="warning" message="暂无来源状态" showIcon />
      ) : (
        <div className={styles.sourceList}>
          <div className={styles.sourceRow}>
            <div className={styles.sourceRowMain}>
              <b>{sourceStatus.activePlan ? `来源计划 v${sourceStatus.activePlan.version}` : '来源计划'}</b>
              <Tag color={STATUS_TONE[sourceStatus.status]}>{STATUS_LABEL[sourceStatus.status]}</Tag>
            </div>
            <small className="muted">
              来源数量：{sourceStatus.activePlan?.sourceCount ?? 0} · 上次成功：
              {sourceStatus.lastSyncAt ?? '—'} · 下次：{sourceStatus.nextSyncAt ?? '—'}
              {sourceStatus.message ? ` · ${sourceStatus.message}` : ''}
            </small>
            {sourceStatus.activePlan?.reason ? (
              <small className="muted">计划说明：{sourceStatus.activePlan.reason}</small>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
