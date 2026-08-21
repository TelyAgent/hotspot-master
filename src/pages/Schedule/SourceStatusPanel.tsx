import { useState } from 'react'
import { Alert, Button, Empty, Spin, Tag } from 'antd'
import { useApp } from '../../context/AppContext'
import { useSourceSyncStatus } from '../../hooks/useSourceSyncStatus'
import { resyncSource } from '../../api/futureEvents'
import type { SourceSyncStatus } from '../../api/futureEvents'
import { SOURCE_LABEL } from '../../data/futureEventLabels'
import styles from './Schedule.module.css'

const STATUS_LABEL: Record<SourceSyncStatus['status'], string> = {
  ok: '正常',
  error: '异常',
  disabled: '未启用',
  pending: '待配置',
}

const STATUS_TONE: Record<SourceSyncStatus['status'], string> = {
  ok: 'success',
  error: 'error',
  disabled: 'warning',
  pending: 'warning',
}

export default function SourceStatusPanel() {
  const { toast } = useApp()
  const { sources, loading, error, reload } = useSourceSyncStatus()
  const [syncing, setSyncing] = useState<string | null>(null)

  const onResync = (source: SourceSyncStatus) => {
    setSyncing(source.source)
    resyncSource(source.source)
      .then(() => {
        toast('已触发重新同步')
        reload()
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : '同步失败'))
      .finally(() => setSyncing(null))
  }

  return (
    <section className="card" style={{ marginBottom: 14 }}>
      <div className={styles.monthHead}>
        <div>
          <span className={styles.monthTitle}>来源同步状态</span>
          <br />
          <span className="small">首版五类来源的接入、健康与同步记录；失败仅重试该来源</span>
        </div>
      </div>

      {loading ? (
        <Spin tip="正在加载来源状态…" />
      ) : error ? (
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      ) : sources.length === 0 ? (
        <Empty description="暂无来源状态" />
      ) : (
        <div className={styles.sourceList}>
          {sources.map((s) => (
            <div className={styles.sourceRow} key={s.source}>
              <div className={styles.sourceRowMain}>
                <b>{SOURCE_LABEL[s.source]}</b>
                <Tag color={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Tag>
                {s.status !== 'disabled' && (
                  <Button
                    onClick={() => onResync(s)}
                    loading={syncing === s.source}
                  >
                    {syncing === s.source ? '同步中…' : s.status === 'error' ? '重新同步' : '立即同步'}
                  </Button>
                )}
              </div>
              <small className="muted">
                上次成功：{s.lastSyncAt ?? '—'} · 下次：{s.nextSyncAt ?? '—'}
                {s.message ? ` · ${s.message}` : ''}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
