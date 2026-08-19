import { useState } from 'react'
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
  ok: 'green',
  error: 'red',
  disabled: 'orange',
  pending: 'orange',
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
        <div className="note">正在加载来源状态…</div>
      ) : error ? (
        <div className="note warning">加载失败：{error}</div>
      ) : sources.length === 0 ? (
        <div className="note">暂无来源状态。</div>
      ) : (
        <div className={styles.sourceList}>
          {sources.map((s) => (
            <div className={styles.sourceRow} key={s.source}>
              <div className={styles.sourceRowMain}>
                <b>{SOURCE_LABEL[s.source]}</b>
                <span className={`pill ${STATUS_TONE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                {s.status === 'error' && (
                  <button
                    className="btn"
                    onClick={() => onResync(s)}
                    disabled={syncing === s.source}
                  >
                    {syncing === s.source ? '同步中…' : '重新同步'}
                  </button>
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
