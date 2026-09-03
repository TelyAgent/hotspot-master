import { useState } from 'react'
import { Button, Input, message } from 'antd'
import { CopyOutlined, RollbackOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'


interface PublishItem {
  title: string
  link: string
  draft: string
}

const initialPublishing: PublishItem[] = [
  {
    title: 'GPT-6 API：开发者迁移判断',
    link: '',
    draft:
      'GPT-6 API 已经开放，但“新模型上线”不等于“现在就该迁移”。\n\n先回答三个问题：\n1. 你的任务是否真的需要新增能力？\n2. 成本能否覆盖质量增益？\n3. 现有工具链是否兼容？\n\n免费额度尚未得到官方确认。不要把社区猜测写进迁移预算。',
  },
  {
    title: 'AI 团队成本结构长文',
    link: '',
    draft: 'AI 团队的真实成本，来自模型价格、上下文长度、失败重试与人工复核的共同作用。',
  },
  {
    title: '60 秒迁移判断视频脚本',
    link: '',
    draft: '60 秒判断是否值得迁移：先看任务收益，再看单位成本，最后验证工具链。',
  },
  {
    title: '模型能力边界解释',
    link: '',
    draft: '能力提升并不代表每一种任务都会获得同等收益。',
  },
]


export default function ContentPublishing() {
  const [items, setItems] = useState(initialPublishing)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = items[selectedIndex] ?? items[0]

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

  const markPublished = () => {
    if (!/^https?:\/\//i.test(selected.link.trim())) {
      message.warning('请先填写有效的发布链接')
      return
    }
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
      </div>

      <section className={styles.publishLayout}>
        <div className={styles.publishList}>
          {initialPublishing.map((item, index) => (
            <button
              className={`${styles.publishCard} ${selectedIndex === index ? styles.publishCardActive : ''}`}
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
            >
              <b>{item.title}</b>
            </button>
          ))}
        </div>

        <div className={styles.publishDetail}>
          <div className={styles.between}>
            <h2>{selected.title}</h2>
          </div>
          <div className={styles.draftPreview}>{selected.draft}</div>
          <div className={styles.miniActions}>
            <Button type="primary" icon={<CopyOutlined />} onClick={copyDraft}>复制正文</Button>
            <Button onClick={() => message.info('请在外部平台完成发布')}>打开 X 发布页</Button>
          </div>
          <div className={styles.publishForm}>
            <label>
              <span className={styles.fieldLabel}>发布链接</span>
              <Input value={selected.link} placeholder="发布后粘贴 URL" onChange={(event) => updateSelected({ link: event.target.value })} />
            </label>
          </div>
          <div className={styles.miniActions}>
            <Button type="primary" onClick={markPublished}>标记已发布</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
