import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { EventItem } from '../../data/types'
import { Head } from '../../components/ui'
import { useEvents } from '../../hooks/useEvents'
import { CorrectModal, MergeModal, RelateModal, SplitModal } from './EventModals'
import styles from './Events.module.css'

const STATUS_OPTIONS = ['内容生成中', '待发布', '处理异常', '已完成']

export default function Events() {
  const { eventStatus, event, set, go, openModal } = useApp()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { events, total, pageSize, loading, error } = useEvents({
    page,
    status: eventStatus === '全部' ? undefined : eventStatus,
    q,
  })

  const list = events
  const current = list.find((x) => x.id === event) || list[0]
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleAction = (type: string) => {
    const e = current
    if (!e) return

    if (type === 'correct') {
      openModal('校正摘要与依据', <CorrectModal e={e} />)
    } else if (type === 'merge') {
      openModal('合并Event', <MergeModal e={e} events={events} />)
    } else if (type === 'split') {
      openModal('拆分Event', <SplitModal />)
    } else {
      openModal('管理Event关联', <RelateModal e={e} events={events} />)
    }
  }

  return (
    <div className={styles.events}>
      <Head
        title="事件管理"
        desc="集中查看已触发自动响应的Event、任务状态与需要人工消除的异常。"
        actions={
          <>
            <select
              className="filter"
              value={eventStatus}
              onChange={(e) => {
                set({ eventStatus: e.target.value })
                setPage(1)
              }}
            >
              <option>全部</option>
              {STATUS_OPTIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <button className="btn" onClick={() => set({ eventStatus: '已完成' })}>
              已完成事件库
            </button>
          </>
        }
      />

      <div className={styles.eventLayout}>
        <aside className={styles.eventList}>
          <input
            className="filter"
            style={{ width: '100%', marginBottom: 7 }}
            placeholder="搜索Event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <div className="note">正在加载事件…</div>
          ) : error ? (
            <div className="note warning">加载失败：{error}</div>
          ) : list.length ? (
            list.map((x) => (
              <button
                key={x.id}
                className={`${styles.eventItem} ${current && x.id === current.id ? styles.active : ''}`}
                onClick={() => set({ event: x.id })}
              >
                <b>{x.title}</b>
                <br />
                <span className="small">
                  {x.status} · {x.regions}
                </span>
                <div style={{ marginTop: 5 }}>
                  <span className={`pill ${x.verify === '存在冲突' ? 'red' : 'green'}`}>
                    {x.verify}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="note">当前状态下没有Event。</div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              marginTop: 8,
            }}
          >
            <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <span className="small">
              第 {page} / {totalPages} 页
            </span>
            <button
              className="btn"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </aside>

        {current ? (
          <EventDetail e={current} onAction={handleAction} onGoTasks={() => go('tasks')} />
        ) : (
          <section className={styles.eventDetail}>请选择其他状态。</section>
        )}
      </div>
    </div>
  )
}

function EventDetail({
  e,
  onAction,
  onGoTasks,
}: {
  e: EventItem
  onAction: (type: string) => void
  onGoTasks: () => void
}) {
  return (
    <section className={styles.eventDetail}>
      <div className="card-head">
        <div>
          <h1 style={{ fontSize: 21 }}>{e.title}</h1>
          <div className="inline">
            <span className={`pill ${e.status === '处理异常' ? 'red' : e.status === '已完成' ? 'green' : 'orange'}`}>
              {e.status}
            </span>
            <span className={`pill ${e.verify === '存在冲突' ? 'red' : 'green'}`}>{e.verify}</span>
          </div>
        </div>
        <button className="btn primary" onClick={onGoTasks}>
          查看内容任务
        </button>
      </div>

      <div className={styles.fact}>
        <b>一句话事实摘要</b>
        <br />
        {e.summary}
      </div>

      <div className={styles.eventMetrics}>
        <div className={styles.eventMetric}>
          <small className="muted">地区</small>
          <br />
          <b>{e.regions}</b>
        </div>
        <div className={styles.eventMetric}>
          <small className="muted">触发原因</small>
          <br />
          <b>{e.trigger}</b>
        </div>
        <div className={styles.eventMetric}>
          <small className="muted">依据数量</small>
          <br />
          <b>{e.urls.length}</b>
        </div>
        <div className={styles.eventMetric}>
          <small className="muted">任务进度</small>
          <br />
          <b>2/3</b>
        </div>
      </div>

      <div className={styles.eventActions}>
        <button className="btn" onClick={() => onAction('correct')}>
          校正摘要/依据
        </button>
        <button className="btn" onClick={() => onAction('merge')}>
          合并Event
        </button>
        <button className="btn" onClick={() => onAction('split')}>
          拆分Event
        </button>
        <button className="btn" onClick={() => onAction('relate')}>
          管理关联
        </button>
      </div>

      <h2>事实依据</h2>
      {e.urls.map((u, i) => (
        <div className={styles.evidence} key={i}>
          <span>
            <b>依据 {i + 1}</b>
            <a className={styles.url} href={u} target="_blank" rel="noreferrer">
              {u}
            </a>
            <small className="muted">X默认热门排序 · 原帖来源</small>
          </span>
          <a className="btn mini" href={u} target="_blank" rel="noreferrer">
            打开原帖 ↗
          </a>
        </div>
      ))}

      <h2 style={{ marginTop: 18 }}>关联Event</h2>
      {e.related.length ? (
        e.related.map((x, i) => (
          <div className={styles.relation} key={i}>
            <b>{x}</b>
            <br />
            <small className="muted">用于当前内容上下文，不覆盖旧Event。</small>
          </div>
        ))
      ) : (
        <div className="note">暂时没有关联Event。</div>
      )}

      {e.status === '已完成' && (
        <>
          <h2 style={{ marginTop: 18 }}>已发布结果</h2>
          <div className="three grid">
            <div className={styles.eventMetric}>
              <small>已发布账号</small>
              <br />
              <b>3</b>
            </div>
            <div className={styles.eventMetric}>
              <small>累计浏览</small>
              <br />
              <b>28.4K</b>
            </div>
            <div className={styles.eventMetric}>
              <small>累计互动</small>
              <br />
              <b>1,240</b>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
