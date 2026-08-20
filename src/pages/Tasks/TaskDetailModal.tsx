import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { TaskItem } from '../../data/types'
import styles from './Tasks.module.css'

export default function TaskDetailModal({
  task,
  onOpenEvent,
  onRegenerate,
  onPublish,
}: {
  task: TaskItem
  onOpenEvent: () => void
  onRegenerate: (instruction?: string) => Promise<void>
  onPublish: (url: string, candidateId: string) => Promise<void>
}) {
  const { toast } = useApp()
  const [instruction, setInstruction] = useState('')
  const [regenerating, setRegenerating] = useState(false)
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
        <button className="btn" onClick={onOpenEvent}>
          Event依据 →
        </button>
      </div>

      {task.copies.length ? (
        <>
          <div className={styles.candidateGrid}>
            {task.copies.map((c, i) => (
              <article
                key={i}
                className={styles.candidate}
              >
                <b>候选{String.fromCharCode(65 + i)}</b>
                <div className={styles.copy}>{c}</div>
                <div className={styles.candidateActions}>
                  <button
                    className="btn"
                    onClick={() => toast('内容已复制，请前往X人工发布')}
                  >
                    复制
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.taskTools}>
            <div className={styles.toolBox}>
              <h3>与AI调整</h3>
              <textarea
                placeholder="补充本轮生成要求"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              ></textarea>
              <button
                className="btn primary"
                disabled={regenerating}
                onClick={() => handleRegenerate(true)}
              >
                {regenerating ? '生成中…' : '重新生成3条'}
              </button>
            </div>
            <div className={styles.toolBox}>
              <h3>发布回填</h3>
              <input
                placeholder="X发布URL"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
              />
              <button
                className="btn primary"
                disabled={publishing}
                onClick={handlePublish}
              >
                {publishing ? '提交中…' : '提交回填'}
              </button>
              <span className="small">用于后续自动跟踪帖子发布效果。</span>
            </div>
          </div>
        </>
      ) : (
        <div className={`note ${task.status === '异常' ? 'warning' : ''}`}>
          <b>{task.status === '异常' ? '重试3次后生成失败' : '正在生成3条候选'}</b>
          <br />
          <button
            className="btn primary"
            style={{ marginTop: 8 }}
            disabled={regenerating}
            onClick={() => handleRegenerate(false)}
          >
            {regenerating ? '生成中…' : '重新运行'}
          </button>
        </div>
      )}
    </div>
  )
}
