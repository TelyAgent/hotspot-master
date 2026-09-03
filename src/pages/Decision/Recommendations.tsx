import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Spin, Tag, message } from 'antd'
import { ClockCircleOutlined, ImportOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  listOperationRecommendations,
  runOperationRecommendations,
  type OperationRecommendation,
  type OperationRecommendationBasis,
  type OperationRecommendationPriority,
} from '../../api'
import styles from './Decision.module.css'

const basisFilters: { key: OperationRecommendationBasis | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'heat', label: '公共热度' },
  { key: 'market', label: '实时市场' },
  { key: 'product', label: '产品价值' },
]

const priorityFilters: { key: OperationRecommendationPriority | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'immediate', label: '立即响应' },
  { key: 'today', label: '今日处理' },
]

function priorityText(priority: OperationRecommendationPriority) {
  return priority === 'immediate' ? '立即响应' : '今日处理'
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function DecisionRecommendations() {
  const navigate = useNavigate()
  const [basis, setBasis] = useState<OperationRecommendationBasis | 'all'>('all')
  const [priority, setPriority] = useState<OperationRecommendationPriority | 'all'>('all')
  const [items, setItems] = useState<OperationRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (basis === 'all' || item.basis === basis) &&
          (priority === 'all' || item.priority === priority),
      ),
    [basis, items, priority],
  )
  const lastGeneratedAt = useMemo(() => getLatestRecommendationTime(items), [items])

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listOperationRecommendations({ take: 50 }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '选题推荐加载失败')
    } finally {
      setLoading(false)
    }
  }

  const run = async () => {
    setRunning(true)
    try {
      const result = await runOperationRecommendations()
      message.success(`已生成 ${result.generatedCount} 条选题推荐`)
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '生成选题推荐失败')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const goCreation = (id: string) => {
    navigate(`/decision/creation/workspace?recommendation=${encodeURIComponent(id)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>OPPORTUNITY DECISION</div>
      <div className={styles.head}>
        <div>
          <h1>选题推荐</h1>
          <p>只呈现已通过准入判断的事件；点击任一选题查看证据、产品承接与候选角度。</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.headActionButtons}>
            <Button className={styles.exportButton} icon={<ReloadOutlined />} loading={running} onClick={run}>
              生成推荐
            </Button>
            <Button className={styles.headButton} type="primary" icon={<ImportOutlined />} href="/decision/inbox">
              导入事件上下文
            </Button>
          </div>
          <div className={styles.scheduleTip}>
            <ClockCircleOutlined />
            <span>
              后台每 3 小时自动生成一次；上一次生成：
              {lastGeneratedAt ? formatDateTime(lastGeneratedAt) : '暂无记录'}；生成推荐用于立即补跑。
            </span>
          </div>
        </div>
      </div>

      <section className={styles.metrics}>
        <Metric value={visible.length} label="今日推荐" />
        <div className={`${styles.metric} ${styles.metricRed}`}>
          <strong>{items.filter((item) => item.basis === 'heat').length}</strong>
          <span>公共热度</span>
        </div>
        <Metric value={items.filter((item) => item.basis === 'market').length} label="实时市场承接" />
        <Metric value={items.filter((item) => item.basis === 'product').length} label="产品价值承接" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>推荐依据</div>
          <div className={styles.filters}>
          <b>推荐依据</b>
          {basisFilters.map((item) => (
            <button
              className={`${styles.chip} ${basis === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setBasis(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>处理节奏</div>
          <div className={styles.filters}>
          <b>处理节奏</b>
          {priorityFilters.map((item) => (
            <button
              className={`${styles.chip} ${priority === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setPriority(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionTitle}>
        <h2>优先处理</h2>
        <span>卡片直接呈现推荐依据与承接对象</span>
      </div>

      <Spin spinning={loading}>
      {visible.length ? (
        <section className={styles.cards}>
          {visible.map((item) => (
            <article className={styles.recommendCard} key={item.id} onClick={() => goCreation(item.id)}>
              <div className={styles.cardTop}>
                <div className={styles.tagrow}>
                  {item.recommendationLabels.map((label) => (
                    <Tag color="cyan" key={label}>{label}</Tag>
                  ))}
                </div>
                <span className={styles.muted}>{formatAge(item.createdAt)}</span>
              </div>
              <h3>{item.title}</h3>
              <p className={styles.summary}>{item.summary}</p>
              <div className={styles.reason}>
                <b>推荐原因：</b>{item.reason}
              </div>
              <div className={styles.bridge}>
                <b>承接判断：</b>{item.productAssociationRationale}
              </div>
              <div className={styles.anglePreview}>建议优先探索：{item.angles[0]?.claim ?? '等待补充候选角度'}</div>
              <div className={styles.cardFoot}>
                <span className={styles.window}>{priorityText(item.priority)}</span>
                <Button className={styles.ghostButton} icon={<RightOutlined />}>内容创作</Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <Empty description="暂无选题推荐，点击生成推荐从最近热点和 PredX 新闻中提取" />
      )}
      </Spin>
    </div>
  )
}

function formatAge(iso: string): string {
  const time = new Date(iso).getTime()
  const diff = Date.now() - time
  if (!Number.isFinite(time) || diff < 0) return '刚刚'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getLatestRecommendationTime(items: OperationRecommendation[]): string | null {
  const latest = items.reduce<number | null>((max, item) => {
    const time = new Date(item.updatedAt || item.createdAt).getTime()
    if (!Number.isFinite(time)) return max
    return max == null || time > max ? time : max
  }, null)
  return latest == null ? null : new Date(latest).toISOString()
}
