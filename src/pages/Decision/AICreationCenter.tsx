import { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Spin, message } from 'antd'
import { FileAddOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  listOperationRecommendations,
  type OperationRecommendation,
} from '../../api'
import styles from './Decision.module.css'

type CreationStatus = 'draft' | 'generated'
interface CreationTask {
  id: string
  title: string
  context: string
  angle: string
  status: CreationStatus
  action: string
}

function CreationRow({ item, onOpen }: { item: CreationTask; onOpen: () => void }) {
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
        <Button className={styles.ghostButton} onClick={onOpen}>
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
  const tasks = useMemo(() => items.map(toCreationTask), [items])
  const openWorkspace = (item: CreationTask) => {
    if (item.status === 'generated') {
      navigate('/decision/publish')
      return
    }
    navigate(`/decision/creation/workspace?recommendation=${item.id}`)
  }

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

      <Spin spinning={loading}>
        {tasks.length ? (
          <>
            <div className={styles.sectionTitle}>
              <h2>创作队列</h2>
            </div>
            <section className={styles.creationList}>
              {tasks.map((item) => (
                <CreationRow item={item} key={item.id} onOpen={() => openWorkspace(item)} />
              ))}
            </section>
          </>
        ) : (
          <Empty description="暂无可创作的选题推荐" />
      )}
      </Spin>
    </div>
  )
}

function toCreationTask(item: OperationRecommendation): CreationTask {
  const status: CreationStatus = isContentGenerated(item.status) ? 'generated' : 'draft'
  return {
    id: item.id,
    title: item.title,
    context: `Context Pack 已就绪 · ${basisText(item.basis)}`,
    angle: item.angles[0]?.claim ?? item.reason,
    status,
    action: '开始创作',
  }
}

function isContentGenerated(status: string): boolean {
  return ['content_generated', 'generated', 'publishing', 'published'].includes(status)
}

function basisText(basis: OperationRecommendation['basis']) {
  if (basis === 'heat') return '公共热度'
  if (basis === 'market') return '实时市场'
  return '产品价值'
}
