import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Spin, Tag, message } from 'antd'
import { EditOutlined, FileAddOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  listOperationRecommendations,
  type OperationRecommendation,
} from '../../api'
import styles from './Decision.module.css'

type CreationStatus = 'draft' | 'selecting' | 'editing' | 'publishing'
type CreationFilter = '全部任务' | '待创作' | '待选择候选' | '编辑中'

interface CreationTask {
  id: string
  title: string
  context: string
  angle: string
  status: CreationStatus
  candidateCount: number
  action: string
  group: 'priority' | 'active'
}

const statusMeta: Record<CreationStatus, { label: string; className: string }> = {
  draft: { label: '待创作', className: styles.creationStatusDraft },
  selecting: { label: '待选择候选', className: styles.creationStatusSelect },
  editing: { label: '编辑中', className: styles.creationStatusEdit },
  publishing: { label: '待人工发布', className: styles.creationStatusPublish },
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function CreationRow({ item, onOpen }: { item: CreationTask; onOpen: () => void }) {
  const meta = statusMeta[item.status]

  return (
    <article className={styles.creationRow}>
      <div className={styles.creationMain}>
        <h3>{item.title}</h3>
        <p>
          <b>Angle · </b>
          {item.angle}
          <span>{item.context}</span>
        </p>
      </div>
      <div className={styles.creationSide}>
        <span className={`${styles.creationStatus} ${meta.className}`}>{meta.label}</span>
        <span className={styles.muted}>当前内容：{item.candidateCount} 个候选</span>
        <Button className={styles.ghostButton} icon={<RightOutlined />} onClick={onOpen}>
          {item.action}
        </Button>
      </div>
    </article>
  )
}

export default function AICreationCenter() {
  const navigate = useNavigate()
  const [items, setItems] = useState<OperationRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<CreationFilter>('全部任务')
  const tasks = useMemo(() => items.map(toCreationTask), [items])
  const visibleTasks = useMemo(
    () =>
      tasks.filter((item) => {
        if (filter === '全部任务') return true
        return statusMeta[item.status].label === filter
      }),
    [filter, tasks],
  )
  const priorityTasks = visibleTasks.filter((item) => item.group === 'priority')
  const activeTasks = visibleTasks.filter((item) => item.group === 'active')
  const openWorkspace = (id: string) => navigate(`/decision/creation/workspace?recommendation=${id}`)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listOperationRecommendations({ take: 50 }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'AI 创作中心加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>AI CREATION CENTER</div>
      <div className={styles.head}>
        <div>
          <h1>AI 创作中心</h1>
          <p>lead 的制作任务队列；内容厨房在任务内完成候选与终稿。</p>
        </div>
        <Button className={styles.headButton} type="primary" icon={<FileAddOutlined />} onClick={() => navigate('/decision/inbox')}>
          从收件箱新建
        </Button>
      </div>

      <section className={styles.metrics}>
        <Metric value={items.length} label="今日推荐" />
        <Metric value={tasks.filter((item) => item.status === 'draft').length} label="待创作" />
        <Metric value={tasks.filter((item) => item.status === 'selecting').length} label="待选择候选" />
        <Metric value={tasks.filter((item) => item.status === 'publishing').length} label="待人工发布" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filters}>
          {(['全部任务', '待创作', '待选择候选', '编辑中'] as CreationFilter[]).map((item) => (
            <button
              className={`${styles.chip} ${filter === item ? styles.chipActive : ''}`}
              key={item}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className={styles.muted}>当前 {visibleTasks.length} 条</span>
      </section>

      <Spin spinning={loading}>
        {visibleTasks.length ? (
          <>
            <div className={styles.sectionTitle}>
              <h2>优先开始</h2>
            </div>
            <section className={styles.creationList}>
              {priorityTasks.map((item) => (
                <CreationRow item={item} key={item.id} onOpen={() => openWorkspace(item.id)} />
              ))}
            </section>

            <div className={styles.sectionTitle}>
              <h2>进行中的创作</h2>
            </div>
            <section className={styles.creationList}>
              {activeTasks.length ? (
                activeTasks.map((item) => (
                  <CreationRow item={item} key={item.id} onOpen={() => openWorkspace(item.id)} />
                ))
              ) : (
                <Empty description="当前没有进行中的创作" />
              )}
            </section>
          </>
        ) : (
          <Empty description="暂无可创作的选题推荐" />
        )}
      </Spin>

      <section className={styles.creationNote}>
        <Tag color="cyan" icon={<EditOutlined />}>
          后续接入推荐采用记录后，这里会展示真实创作队列
        </Tag>
      </section>
    </div>
  )
}

function toCreationTask(item: OperationRecommendation): CreationTask {
  const status = toCreationStatus(item)
  return {
    id: item.id,
    title: item.title,
    context: `Context Pack 已就绪 · ${basisText(item.basis)}`,
    angle: item.angles[0]?.claim ?? item.reason,
    status,
    candidateCount: item.angles.length,
    action: status === 'selecting' ? '选择终稿' : status === 'editing' ? '继续编辑' : '开始创作',
    group: status === 'editing' ? 'active' : 'priority',
  }
}

function toCreationStatus(item: OperationRecommendation): CreationStatus {
  if (item.status === 'adopted' || item.status === 'edited') return 'publishing'
  if (item.status === 'editing') return 'editing'
  if (item.angles.length > 1) return 'selecting'
  return 'draft'
}

function basisText(basis: OperationRecommendation['basis']) {
  if (basis === 'heat') return '公共热度'
  if (basis === 'market') return '实时市场'
  return '产品价值'
}
