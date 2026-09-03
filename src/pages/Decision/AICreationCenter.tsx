import { Button, Tag } from 'antd'
import { EditOutlined, FileAddOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './Decision.module.css'

type CreationStatus = 'draft' | 'selecting' | 'editing' | 'publishing'

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

const tasks: CreationTask[] = [
  {
    id: 'creation-gpt6-api',
    title: 'GPT-6 API：开发者迁移判断',
    context: 'Context Pack 已就绪',
    angle: '开发者迁移判断清单',
    status: 'selecting',
    candidateCount: 3,
    action: '选择终稿',
    group: 'priority',
  },
  {
    id: 'creation-team-cost',
    title: 'AI 团队成本结构长文',
    context: 'Context Pack 已就绪',
    angle: '开发者迁移判断清单',
    status: 'draft',
    candidateCount: 3,
    action: '开始创作',
    group: 'priority',
  },
  {
    id: 'creation-60s',
    title: '60 秒迁移判断视频脚本',
    context: 'Context Pack 已就绪',
    angle: '开发者迁移判断清单',
    status: 'editing',
    candidateCount: 3,
    action: '继续编辑',
    group: 'active',
  },
]

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
  const priorityTasks = tasks.filter((item) => item.group === 'priority')
  const activeTasks = tasks.filter((item) => item.group === 'active')
  const openWorkspace = () => navigate('/decision/creation/workspace')

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
        <Metric value="5" label="今日推荐" />
        <Metric value={tasks.filter((item) => item.status === 'draft').length} label="待创作" />
        <Metric value={tasks.filter((item) => item.status === 'selecting').length} label="待选择候选" />
        <Metric value="3" label="待人工发布" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filters}>
          {['全部任务', '待创作', '待选择候选', '编辑中'].map((item, index) => (
            <button className={`${styles.chip} ${index === 0 ? styles.chipActive : ''}`} key={item} type="button">
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.sectionTitle}>
        <h2>优先开始</h2>
      </div>
      <section className={styles.creationList}>
        {priorityTasks.map((item) => (
          <CreationRow item={item} key={item.id} onOpen={openWorkspace} />
        ))}
      </section>

      <div className={styles.sectionTitle}>
        <h2>进行中的创作</h2>
      </div>
      <section className={styles.creationList}>
        {activeTasks.map((item) => (
          <CreationRow item={item} key={item.id} onOpen={openWorkspace} />
        ))}
      </section>

      <section className={styles.creationNote}>
        <Tag color="cyan" icon={<EditOutlined />}>
          后续接入推荐采用记录后，这里会展示真实创作队列
        </Tag>
      </section>
    </div>
  )
}
