import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Empty, Input, Space } from 'antd'
import { CopyOutlined, DownOutlined, LinkOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { TaskItem } from '../../data/types'
import styles from './Tasks.module.css'

export default function TaskDetailModal({
  task,
  onRegenerate,
  onPublish,
}: {
  task: TaskItem
  onRegenerate: (instruction?: string) => Promise<void>
  onPublish: (url: string, candidateId: string) => Promise<void>
}) {
  const { toast } = useApp()
  const [instruction, setInstruction] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const autoGenerateStarted = useRef(false)
  const [showEvidence, setShowEvidence] = useState(false)
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

  const handlePublish = async () => {
    const candidateId = task.candidateIds?.[0]
    if (!candidateId) {
      toast('找不到可关联的候选内容，请重新生成后再回填')
      return
    }
    if (!publishUrl.trim()) {
      toast('请填写发布 URL')
      return
    }
    setPublishing(true)
    try {
      await onPublish(publishUrl.trim(), candidateId)
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
    <div>
      <div className="card-head">
        <div>
          <span className="small">
            {task.code} · {task.role}
          </span>
          <h2 style={{ margin: 0 }}>
            {task.account} · {task.event}
          </h2>
        </div>
        <Button
          icon={showEvidence ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setShowEvidence((value) => !value)}
        >
          Event依据
        </Button>
      </div>

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
          <div className={styles.candidateGrid}>
            {task.copies.map((c, i) => (
              <Card
                key={i}
                className={styles.candidate}
                title={`候选${String.fromCharCode(65 + i)}`}
                actions={[
                  <Button
                    key="copy"
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => toast('内容已复制，请前往X人工发布')}
                  >
                    复制
                  </Button>,
                ]}
              >
                <div className={styles.copy}>{c}</div>
              </Card>
            ))}
          </div>

          <div className={styles.taskTools}>
            <div className={styles.toolBox}>
              <h3>与AI调整</h3>
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
              <h3>发布回填</h3>
              <Input
                placeholder="X发布URL"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
              />
              <Button
                type="primary"
                loading={publishing}
                onClick={handlePublish}
              >
                {publishing ? '提交中…' : '提交回填'}
              </Button>
              <span className="small">用于后续自动跟踪帖子发布效果。</span>
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
