import { useMemo, useState } from 'react'
import { Button, Input, Tag, message } from 'antd'
import { CopyOutlined, PlusOutlined, RollbackOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'

type PublishStatus = '待发布' | '已复制' | '等待回填' | '已发布' | '暂缓'

interface PublishItem {
  title: string
  format: string
  note: string
  status: PublishStatus
  link: string
  draft: string
}

const initialPublishing: PublishItem[] = [
  {
    title: 'GPT-6 API：开发者迁移判断',
    format: 'X Thread',
    note: '已采用候选 1',
    status: '待发布',
    link: '',
    draft:
      'GPT-6 API 已经开放，但“新模型上线”不等于“现在就该迁移”。\n\n先回答三个问题：\n1. 你的任务是否真的需要新增能力？\n2. 成本能否覆盖质量增益？\n3. 现有工具链是否兼容？\n\n免费额度尚未得到官方确认。不要把社区猜测写进迁移预算。',
  },
  {
    title: 'AI 团队成本结构长文',
    format: '长文 / Newsletter',
    note: '已采用候选 2',
    status: '待发布',
    link: '',
    draft: 'AI 团队的真实成本，来自模型价格、上下文长度、失败重试与人工复核的共同作用。',
  },
  {
    title: '60 秒迁移判断视频脚本',
    format: '短视频脚本',
    note: '已复制待回填',
    status: '已复制',
    link: '',
    draft: '60 秒判断是否值得迁移：先看任务收益，再看单位成本，最后验证工具链。',
  },
  {
    title: '模型能力边界解释',
    format: '图文事实卡',
    note: '外部发布中',
    status: '等待回填',
    link: '',
    draft: '能力提升并不代表每一种任务都会获得同等收益。',
  },
]

const filters: Array<PublishStatus | '全部'> = ['全部', '待发布', '已复制', '等待回填', '已发布', '暂缓']

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function statusColor(status: PublishStatus) {
  if (status === '已发布') return 'green'
  if (status === '已复制') return 'blue'
  if (status === '暂缓') return 'red'
  return 'orange'
}

export default function ContentPublishing() {
  const [items, setItems] = useState(initialPublishing)
  const [filter, setFilter] = useState<PublishStatus | '全部'>('全部')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const visible = useMemo(
    () => items.map((item, index) => ({ item, index })).filter(({ item }) => filter === '全部' || item.status === filter),
    [filter, items],
  )
  const selected = items[selectedIndex] ?? items[0]

  const updateSelected = (patch: Partial<PublishItem>) => {
    setItems((prev) => prev.map((item, index) => (index === selectedIndex ? { ...item, ...patch } : item)))
  }

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(selected.draft)
      updateSelected({ status: '已复制' })
      message.success('已复制正文')
    } catch {
      message.error('复制失败，请手动复制正文')
    }
  }

  const markPublished = () => {
    if (!/^https?:\/\//i.test(selected.link.trim())) {
      message.warning('请先填写有效的发布链接')
      updateSelected({ status: '已复制' })
      return
    }
    updateSelected({ status: '已发布' })
    message.success('已标记发布并记录链接')
  }

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>PUBLISHING LOOP</div>
      <div className={styles.head}>
        <div>
          <h1>内容发布</h1>
          <p>选好的终稿进入这里。运营人员复制内容，到外部平台粘贴发布，再回填链接或结果。</p>
        </div>
        <Button className={styles.headButton} type="primary" icon={<PlusOutlined />}>
          手动新增终稿
        </Button>
      </div>

      <section className={styles.metrics}>
        <Metric value={items.length} label="待处理终稿" />
        <Metric value={items.filter((item) => item.status === '待发布').length} label="待发布" />
        <Metric value={items.filter((item) => item.status === '已复制').length} label="已复制" />
        <Metric value={items.filter((item) => item.status === '等待回填').length} label="等待回填" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filters}>
          {filters.map((item) => (
            <button className={`${styles.chip} ${filter === item ? styles.chipActive : ''}`} key={item} type="button" onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <span className={styles.muted}>当前 {visible.length} 条</span>
      </section>

      <section className={styles.publishLayout}>
        <div className={styles.publishList}>
          {visible.map(({ item, index }) => (
            <button
              className={`${styles.publishCard} ${selectedIndex === index ? styles.publishCardActive : ''}`}
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
            >
              <span>
                <b>{item.title}</b>
                <small>{item.format} · {item.note}</small>
              </span>
              <Tag color={statusColor(item.status)}>{item.status}</Tag>
            </button>
          ))}
        </div>

        <div className={styles.publishDetail}>
          <div className={styles.between}>
            <div>
              <h2>{selected.title}</h2>
              <p className={styles.muted}>{selected.format} · 来自内容厨房采用稿</p>
            </div>
            <Tag color={statusColor(selected.status)}>{selected.status}</Tag>
          </div>
          <div className={styles.draftPreview}>{selected.draft}</div>
          <div className={styles.miniActions}>
            <Button type="primary" icon={<CopyOutlined />} onClick={copyDraft}>复制正文</Button>
            <Button onClick={() => message.info('请在外部平台完成发布')}>打开 X 发布页</Button>
            <Button icon={<RollbackOutlined />} onClick={() => message.info('退回内容厨房能力后续接入真实任务')}>退回修改</Button>
          </div>
          <div className={styles.publishForm}>
            <label>
              <span className={styles.fieldLabel}>发布链接</span>
              <Input value={selected.link} placeholder="发布后粘贴 URL" onChange={(event) => updateSelected({ link: event.target.value })} />
            </label>
            <label>
              <span className={styles.fieldLabel}>发布状态</span>
              <Input value={selected.status} readOnly />
            </label>
          </div>
          <div className={styles.miniActions}>
            <Button type="primary" onClick={markPublished}>标记已发布</Button>
            <Button onClick={() => updateSelected({ status: '已复制' })}>标记已复制</Button>
            <Button danger onClick={() => updateSelected({ status: '暂缓' })}>暂缓发布</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
