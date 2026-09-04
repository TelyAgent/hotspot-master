import { useEffect, useState } from 'react'
import { Button, Empty, Input, Spin, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import {
  backfillPublishedPost,
  listApprovedOperationContentDrafts,
  type ApprovedOperationContentDraft,
} from '../../api'
import styles from './Decision.module.css'


interface PublishItem {
  id: string
  contentTaskId: string
  title: string
  summary: string
  accountName: string
  link: string
  draft: string
  updatedAt: string
  format?: string | null
}

export default function ContentPublishing() {
  const [items, setItems] = useState<PublishItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const selected = items[selectedIndex] ?? items[0]

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await listApprovedOperationContentDrafts({ take: 100 })
        setItems(response.map(mapApprovedDraftToPublishItem))
        setSelectedIndex(0)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '内容发布列表加载失败')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const updateSelected = (patch: Partial<PublishItem>) => {
    setItems((prev) => prev.map((item, index) => (index === selectedIndex ? { ...item, ...patch } : item)))
  }

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(selected.draft)
      message.success('已复制正文')
    } catch {
      message.error('复制失败，请手动复制正文')
    }
  }

  const markPublished = async () => {
    if (!selected) return
    if (!selected.accountName.trim()) {
      message.warning('请先填写发布账号')
      return
    }
    if (!/^https?:\/\//i.test(selected.link.trim())) {
      message.warning('请先填写有效的发布链接')
      return
    }
    setPublishing(true)
    try {
      await backfillPublishedPost({
        contentTaskId: selected.contentTaskId,
        accountName: selected.accountName.trim(),
        platform: 'x',
        url: selected.link.trim(),
      })
      message.success('已标记发布并记录链接')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发布回填失败')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return <Spin fullscreen tip="加载内容发布列表..." />
  }

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>PUBLISHING LOOP</div>
      <div className={styles.head}>
        <div>
          <h1>内容发布</h1>
          <p>选好的终稿进入这里。运营人员复制内容，到外部平台粘贴发布，再回填链接或结果。</p>
        </div>
      </div>

      <section className={styles.publishLayout}>
        <div className={styles.publishList}>
          {items.length ? items.map((item, index) => (
            <button
              className={`${styles.publishCard} ${selectedIndex === index ? styles.publishCardActive : ''}`}
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
            >
              <b>{item.title}</b>
              <small>{item.format || '待人工发布'} · 更新 {formatDateTime(item.updatedAt)}</small>
            </button>
          )) : <Empty description="暂无已采用终稿" />}
        </div>

        {selected ? (
          <div className={styles.publishDetail}>
            <div className={styles.between}>
              <h2>{selected.title}</h2>
            </div>
            <p className={styles.muted}>{selected.summary}</p>
            <div className={styles.draftPreview}>{selected.draft}</div>
            <div className={styles.miniActions}>
              <Button type="primary" icon={<CopyOutlined />} onClick={copyDraft}>复制正文</Button>
              <Button onClick={() => window.open('https://x.com/compose/post', '_blank', 'noopener,noreferrer')}>打开 X 发布页</Button>
            </div>
            <div className={styles.publishForm}>
              <label>
                <span className={styles.fieldLabel}>发布账号</span>
                <Input value={selected.accountName} placeholder="例如 @PredX" onChange={(event) => updateSelected({ accountName: event.target.value })} />
              </label>
              <label>
                <span className={styles.fieldLabel}>发布链接</span>
                <Input value={selected.link} placeholder="发布后粘贴 URL" onChange={(event) => updateSelected({ link: event.target.value })} />
              </label>
            </div>
            <div className={styles.miniActions}>
              <Button type="primary" loading={publishing} onClick={() => void markPublished()}>标记已发布</Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function mapApprovedDraftToPublishItem(item: ApprovedOperationContentDraft): PublishItem {
  return {
    id: item.id,
    contentTaskId: item.contentTaskId,
    title: item.title,
    summary: item.summary,
    accountName: '',
    link: '',
    draft: item.draft,
    updatedAt: item.updatedAt,
    format: item.format,
  }
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
