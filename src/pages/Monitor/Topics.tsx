import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { refreshTopicCircleTopics } from '../../api/topicCircle'
import { useSettings } from '../../hooks/useSettings'
import { useTopicCircleTopics } from '../../hooks/useTopicCircleTopics'
import styles from './Monitor.module.css'

const TRIGGER_LABEL: Record<string, string> = {
  short_term: '短期集中',
  sustained: '持续热议',
  burst: '单点爆发',
  mixed: '混合上升',
}

export default function Topics() {
  const { topicDetail, set, toast } = useApp()
  const { items, loading, error } = useSettings('topics')
  const [refreshing, setRefreshing] = useState(false)

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics()
      toast(
        `主题圈采集完成：新增 ${result.collect.collected} 条帖子，新增 ${result.summarize.topics} 个话题`,
      )
    } catch (e) {
      toast(e instanceof Error ? e.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  if (topicDetail) return <TopicDetail name={topicDetail} />

  if (loading) return <div className="note">正在加载主题…</div>
  if (error) return <div className="note warning">加载失败：{error}</div>
  if (items.length === 0) return <div className="note">暂无主题，请在系统设置里配置。</div>

  return (
    <>
      <div className={styles.topicToolbar}>
        <span className="small">主题圈每 3 小时自动采集；需要立即产出话题时可手动运行一次。</span>
        <button className="btn primary" onClick={refreshTopics} disabled={refreshing}>
          {refreshing ? '采集中…' : '立即采集并总结'}
        </button>
      </div>
      <div className="three grid">
        {items.map((c) => {
          const accountCount = String(c.accounts ?? '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean).length
          return (
            <article className={styles.topic} key={c.id}>
              <div className={styles.topicTop}>
                <div>
                  <h2>{c.name}</h2>
                  <span className="small">{accountCount} 个监控账号</span>
                </div>
                <span className={styles.number}>{accountCount}</span>
              </div>
              <p>{c.description}</p>
              <button className="btn link" onClick={() => set({ topicDetail: c.name })}>
                查看该主题全部话题 →
              </button>
            </article>
          )
        })}
      </div>
    </>
  )
}

function TopicDetail({ name }: { name: string }) {
  const { set, toast } = useApp()
  const { topics, loading, error, reload } = useTopicCircleTopics(name)
  const [refreshing, setRefreshing] = useState(false)

  const triggered = topics.filter((t) => t.triggeredAt).length

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics()
      reload()
      toast(
        `主题圈采集完成：新增 ${result.collect.collected} 条帖子，新增 ${result.summarize.topics} 个话题`,
      )
    } catch (e) {
      toast(e instanceof Error ? e.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className={styles.topicDetailBreadcrumb}>
        <button className="btn link" onClick={() => set({ topicDetail: null })}>
          重点主题追踪
        </button>
        <span className="muted">/</span>
        <b>{name}</b>
      </div>
      <section className={styles.topicDetailSummary}>
        <div>
          <span className="small">当前主题</span>
          <h1 style={{ fontSize: 22, margin: '3px 0' }}>{name}话题</h1>
          <span className="small">从监控账号帖子总结出的具体事件/话题</span>
        </div>
        <div>
          <span className="small">话题数</span>
          <strong>{topics.length}</strong>
          <span className="small">个话题</span>
        </div>
        <div>
          <span className="small">已触发响应</span>
          <strong>{triggered}</strong>
          <span className="small">已进入内容链路</span>
        </div>
        <div>
          <span className="small">手动刷新</span>
          <button className="btn primary" onClick={refreshTopics} disabled={refreshing}>
            {refreshing ? '采集中…' : '立即采集并总结'}
          </button>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>全部话题</h2>
            <p className="small">按讨论广度（B3h/B24h）与流量（Tmax）展示</p>
          </div>
        </div>
        <div className={styles.topicTrendHead}>
          <span>话题</span>
          <span>B3h</span>
          <span>B24h</span>
          <span>Tmax</span>
          <span>状态</span>
        </div>
        {loading ? (
          <div className="note">正在加载话题…</div>
        ) : error ? (
          <div className="note warning">加载失败：{error}</div>
        ) : topics.length === 0 ? (
          <div className="note">暂无话题，等待采集与总结。</div>
        ) : (
          topics.map((t) => (
            <div className={styles.topicTrendRow} key={t.id}>
              <span>
                <b>{t.title}</b>
                <br />
                <small className="muted">{t.summary}</small>
              </span>
              <strong>{t.b3h}</strong>
              <strong>{t.b24h}</strong>
              <span>{t.tmax != null ? `${t.tmax.toFixed(1)}x` : '—'}</span>
              <span className={`pill ${t.triggerType ? 'green' : ''}`}>
                {t.triggerType ? TRIGGER_LABEL[t.triggerType] ?? '已触发' : '观察中'}
              </span>
            </div>
          ))
        )}
      </section>
    </>
  )
}
