import { useState } from 'react'
import { Alert, Button, Empty, Spin, Statistic, Tag } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import { refreshTopicCircleTopics } from '../../api/topicCircle'
import { useTopicCircleMonitorTopics } from '../../hooks/useTopicCircleMonitorTopics'
import { useTopicCirclePipelineStatus } from '../../hooks/useTopicCirclePipelineStatus'
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
  const { topics, loading, error, reload } = useTopicCircleMonitorTopics()
  const pipeline = useTopicCirclePipelineStatus()
  const [refreshing, setRefreshing] = useState(false)

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics()
      reload()
      pipeline.reload()
      toast(`主题圈采集完成：${result.collected} 条帖子，候选 ${result.analysis?.topics ?? 0} 个`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  if (topicDetail) return <TopicDetail name={topicDetail} />

  if (loading) return <Spin tip="正在加载主题…" />
  if (error) return <Alert type="error" message={`加载失败：${error}`} showIcon />
  if (topics.length === 0) return <Empty description="暂无主题，请在系统设置里配置" />

  return (
    <>
      <div className={styles.topicToolbar}>
        <span className="small">
          主题圈每 3 小时自动采集；最近一次：
          {pipeline.status?.latestFetchRun
            ? `${pipeline.status.latestFetchRun.status} · ${pipeline.status.latestFetchRun.itemCount} 条 · ${formatTime(pipeline.status.latestFetchRun.startedAt)}`
            : pipeline.loading
              ? '读取中'
              : '暂无记录'}
          {pipeline.status?.latestWorkflowRun ? ` · Workflow ${pipeline.status.latestWorkflowRun.status}` : ''}
        </span>
        <Button type="primary" icon={<ReloadOutlined />} onClick={refreshTopics} loading={refreshing}>
          {refreshing ? '采集中…' : '立即采集并总结'}
        </Button>
      </div>
      {pipeline.error ? <Alert type="warning" message={`流水线状态加载失败：${pipeline.error}`} showIcon /> : null}
      <div className="three grid">
        {topics.map((c) => {
          return (
            <article className={styles.topic} key={c.id}>
              <div className={styles.topicTop}>
                <div>
                  <h2>{c.name}</h2>
                  <span className="small">
                    {c.enabled ? '启用' : '停用'} · {c.accountCount} 个监控账号 · 近 3 小时 {c.recentPostCount3h} 条帖子
                  </span>
                </div>
                <span className={styles.number}>{c.accountCount}</span>
              </div>
              <p>
                24 小时候选 {c.candidateCount24h} 个，已触发 {c.triggeredEventCount24h} 个。
              </p>
              <Button type="link" onClick={() => set({ topicDetail: c.name })}>查看该主题全部话题</Button>
            </article>
          )
        })}
      </div>
    </>
  )
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TopicDetail({ name }: { name: string }) {
  const { set, toast } = useApp()
  const { topics, loading, error, reload } = useTopicCircleTopics(name)
  const [refreshing, setRefreshing] = useState(false)

  const triggered = topics.filter((t) => t.triggeredAt).length

  const refreshTopics = async () => {
    setRefreshing(true)
    try {
      const result = await refreshTopicCircleTopics(name)
      reload()
      toast(`${name}采集完成：${result.collected} 条帖子，候选 ${result.analysis?.topics ?? 0} 个`)
    } catch (error) {
      toast(error instanceof Error ? error.message : '主题圈采集失败')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className={styles.topicDetailBreadcrumb}>
        <Button type="link" onClick={() => set({ topicDetail: null })}>
          重点主题追踪
        </Button>
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
          <Statistic title="话题数" value={topics.length} />
          <span className="small">个话题</span>
        </div>
        <div>
          <Statistic title="已触发响应" value={triggered} />
          <span className="small">已进入内容链路</span>
        </div>
        <div>
          <span className="small">手动刷新</span>
          <Button type="primary" icon={<ReloadOutlined />} onClick={refreshTopics} loading={refreshing}>
            {refreshing ? '采集中…' : '立即采集并总结'}
          </Button>
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
          <Spin tip="正在加载话题…" />
        ) : error ? (
          <Alert type="error" message={`加载失败：${error}`} showIcon />
        ) : topics.length === 0 ? (
          <Empty description="暂无话题，等待采集与总结" />
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
              <Tag color={t.triggerType ? 'success' : 'default'}>{t.triggerType ? TRIGGER_LABEL[t.triggerType] ?? '已触发' : '观察中'}</Tag>
            </div>
          ))
        )}
      </section>
    </>
  )
}
