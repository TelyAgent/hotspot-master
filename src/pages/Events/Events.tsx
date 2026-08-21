import { useEffect, useState } from 'react'
import { Alert, Button, Empty, Input, List, Pagination, Select, Space, Tag, Typography } from 'antd'
import { CheckCircleOutlined, ProfileOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { EventItem } from '../../data/types'
import { Head } from '../../components/ui'
import { useEvents } from '../../hooks/useEvents'
import { CorrectModal, MergeModal, RelateModal, SplitModal } from './EventModals'
import styles from './Events.module.css'

const STATUS_OPTIONS = ['内容生成中', '待发布', '处理异常', '已完成']

function eventStatusColor(status: string) {
  if (status === '处理异常') return 'error'
  if (status === '已完成') return 'success'
  return 'warning'
}

function verifyColor(verify: string) {
  return verify === '存在冲突' ? 'error' : 'success'
}

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
            <Select
              style={{ minWidth: 150 }}
              value={eventStatus}
              options={[
                { value: '全部', label: '全部' },
                ...STATUS_OPTIONS.map((x) => ({ value: x, label: x })),
              ]}
              onChange={(value) => {
                set({ eventStatus: value })
                setPage(1)
              }}
            />
            <Button icon={<CheckCircleOutlined />} onClick={() => set({ eventStatus: '已完成' })}>
              已完成事件库
            </Button>
          </>
        }
      />

      <div className={styles.eventLayout}>
        <aside className={styles.eventList}>
          <Input.Search
            style={{ width: '100%', marginBottom: 7 }}
            placeholder="搜索Event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          {loading ? (
            <div className="note">正在加载事件…</div>
          ) : error ? (
            <Alert type="error" message={`加载失败：${error}`} showIcon />
          ) : list.length ? (
            <List
              className={styles.eventListItems}
              dataSource={list}
              renderItem={(x) => (
                <List.Item
                  className={`${styles.eventItem} ${current && x.id === current.id ? styles.active : ''}`}
                  onClick={() => set({ event: x.id })}
                >
                  <List.Item.Meta
                    title={<Typography.Text strong>{x.title}</Typography.Text>}
                    description={
                      <Space direction="vertical" size={5}>
                        <span className="small">
                          {x.status} · {x.regions}
                        </span>
                        <Tag color={verifyColor(x.verify)}>{x.verify}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="当前状态下没有Event" />
          )}

          <div className={styles.eventPagination}>
            <span className="small">
              第 {page} / {totalPages} 页
            </span>
            <Pagination
              simple
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
            />
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
  const evidence = e.evidence ?? e.urls.map((url) => ({ sourceType: 'x_post', claim: url, url }))

  return (
    <section className={styles.eventDetail}>
      <div className="card-head">
        <div>
          <h1 style={{ fontSize: 21 }}>{e.title}</h1>
          <div className="inline">
            <Tag color={eventStatusColor(e.status)}>{e.status}</Tag>
            <Tag color={verifyColor(e.verify)}>{e.verify}</Tag>
          </div>
        </div>
        <Button type="primary" icon={<ProfileOutlined />} onClick={onGoTasks}>
          查看内容任务
        </Button>
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
          <b>{evidence.length}</b>
        </div>
        <div className={styles.eventMetric}>
          <small className="muted">任务进度</small>
          <br />
          <b>2/3</b>
        </div>
      </div>

      <div className={styles.eventActions}>
        <Button onClick={() => onAction('correct')}>
          校正摘要/依据
        </Button>
        <Button onClick={() => onAction('merge')}>
          合并Event
        </Button>
        <Button onClick={() => onAction('split')}>
          拆分Event
        </Button>
        <Button onClick={() => onAction('relate')}>
          管理关联
        </Button>
      </div>

      <h2>事实依据</h2>
      {evidence.length === 0 ? <div className="note">暂无事实依据。</div> : null}
      {evidence.map((item, i) => (
        <div className={styles.evidence} key={i}>
          <span>
            <b>依据 {i + 1}</b>
            {item.url ? (
              <a className={styles.url} href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            ) : (
              <span className={styles.url}>{item.claim}</span>
            )}
            <small className="muted">{item.sourceType === 'x_trend' ? 'X热搜榜快照' : item.sourceType}</small>
          </span>
          {item.url ? (
            <Button size="small" href={item.url} target="_blank" rel="noreferrer">
              打开来源
            </Button>
          ) : null}
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
