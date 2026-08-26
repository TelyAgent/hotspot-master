import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Empty, Input, Space, Tag, Typography } from 'antd'
import {
  CopyOutlined,
  DownOutlined,
  LinkOutlined,
  ReloadOutlined,
  SendOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { TaskItem } from '../../data/types'
import styles from './HotspotOperationDetail.module.css'

export default function HotspotOperationDetail({
  task,
  onRegenerate,
  onPublish,
}: {
  task: TaskItem
  onRegenerate: (instruction?: string) => Promise<void>
  onPublish: (url: string, candidateId: string, accountName?: string) => Promise<void>
}) {
  const { toast } = useApp()
  const [instruction, setInstruction] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const autoGenerateStarted = useRef(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const [publishAccount, setPublishAccount] = useState('')
  const [publishUrl, setPublishUrl] = useState('')
  const [publishing, setPublishing] = useState(false)

  const handleRegenerate = async (withInstruction: boolean) => {
    setRegenerating(true)
    try {
      await onRegenerate(withInstruction ? instruction : undefined)
    } catch {
      // 错误已在 onRegenerate 内 toast
    } finally {
      setRegenerating(false)
    }
  }

  const copyCandidate = (copy: string) => {
    void navigator.clipboard?.writeText(copy)
    toast('内容已复制，请前往 X 人工发布')
  }

  const handlePublish = async () => {
    const candidateId = task.candidateIds?.[0]
    if (!candidateId) {
      toast('找不到可关联的候选内容，请重新生成后再回填')
      return
    }
    if (!publishAccount.trim()) {
      toast('请填写发布账号')
      return
    }
    if (!publishUrl.trim()) {
      toast('请填写发布 URL')
      return
    }
    setPublishing(true)
    try {
      await onPublish(publishUrl.trim(), candidateId, publishAccount.trim())
    } catch {
      // 错误已在 onPublish 内 toast
    } finally {
      setPublishing(false)
    }
  }

  useEffect(() => {
    if (task.copies.length > 0 || autoGenerateStarted.current) {
      return
    }
    autoGenerateStarted.current = true
    void handleRegenerate(false)
  }, [task.id, task.copies.length])

  return (
    <div className={styles.operationDetail}>
      <section className={styles.hero}>
        <div>
          <div className={styles.heroMeta}>
            <Tag className={styles.statusTag}>{task.status}</Tag>
            <span>{task.code}</span>
            <span>{task.role}</span>
          </div>
          <Typography.Title level={3}>{task.event}</Typography.Title>
          <Typography.Paragraph>{task.eventSummary || task.event}</Typography.Paragraph>
        </div>
        <div className={styles.heroActions}>
          <span>面向账号：{task.account}</span>
          <Button
            icon={showEvidence ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setShowEvidence((value) => !value)}
          >
            Event 依据
          </Button>
        </div>
      </section>

      {showEvidence && (
        <section className={styles.evidencePanel}>
          <div className={styles.evidenceSummary}>
            <b>一句话事实摘要</b>
            <p>{task.eventSummary || task.event}</p>
          </div>
          {task.eventEvidence?.length ? (
            task.eventEvidence.map((item, i) => (
              <div className={styles.evidenceItem} key={`${item.sourceType}-${i}`}>
                <span>
                  <b>依据 {i + 1}</b>
                  <small className="muted">{item.sourceType}</small>
                  <p>{item.claim}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.url}
                    </a>
                  ) : null}
                </span>
                {item.url ? (
                  <Button size="small" icon={<LinkOutlined />} href={item.url} target="_blank" rel="noreferrer">
                    打开来源
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <Empty description="暂无事实依据" />
          )}
        </section>
      )}

      {task.copies.length ? (
        <>
          <section className={styles.candidateSection}>
            <div className={styles.sectionHeader}>
              <div>
                <b>发布候选</b>
                <span>根据当前热点上下文生成 3 条可发布文案。</span>
              </div>
              <Tag className={styles.countTag}>{task.copies.length} 条</Tag>
            </div>
            {task.copies.map((copy, index) => (
              <Card
                key={index}
                className={styles.candidate}
                title={`候选 ${String.fromCharCode('A'.charCodeAt(0) + index)}`}
                extra={
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyCandidate(copy)}
                  >
                    复制
                  </Button>
                }
              >
                <div className={styles.copy}>{copy}</div>
              </Card>
            ))}
          </section>

          <div className={styles.operationTools}>
            <div className={styles.toolBox}>
              <div>
                <h3>与 AI 调整</h3>
                <p>补充语气、角度或禁用表达后，重新生成一组候选。</p>
              </div>
              <Input.TextArea
                rows={5}
                placeholder="补充本轮生成要求"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={regenerating}
                onClick={() => handleRegenerate(true)}
              >
                {regenerating ? '生成中…' : '重新生成3条'}
              </Button>
            </div>
            <div className={styles.toolBox}>
              <div>
                <h3>发布回填</h3>
                <p>记录发布账号和帖子链接，用于后续效果追踪。</p>
              </div>
              <Input
                placeholder="发布账号，如 @PredX"
                value={publishAccount}
                onChange={(e) => setPublishAccount(e.target.value)}
              />
              <Input
                placeholder="X发布URL"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={publishing}
                onClick={handlePublish}
              >
                {publishing ? '提交中…' : '提交回填'}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Alert
          type={task.status === '异常' ? 'warning' : 'info'}
          message={
            regenerating
              ? '正在自动生成3条候选'
              : task.status === '异常'
                ? '重试3次后生成失败'
                : '暂无候选内容'
          }
          action={
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                loading={regenerating}
                onClick={() => handleRegenerate(false)}
              >
                {regenerating ? '生成中…' : '重新运行'}
              </Button>
            </Space>
          }
          showIcon
        />
      )}
    </div>
  )
}
