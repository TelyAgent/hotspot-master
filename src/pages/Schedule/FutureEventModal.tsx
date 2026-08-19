import { useState } from 'react'
import { createFutureEvent } from '../../api/futureEvents'
import { useApp } from '../../context/AppContext'

export default function FutureEventModal({ onCreated }: { onCreated: () => void }) {
  const { toast, closeModal } = useApp()
  const [title, setTitle] = useState('')
  const [factTime, setFactTime] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = () => {
    if (!title.trim()) {
      toast('请填写事件名称')
      return
    }
    if (!sourceUrl.trim()) {
      toast('来源URL 必填')
      return
    }
    setSubmitting(true)
    createFutureEvent({
      title: title.trim(),
      factTime: factTime.trim() || null,
      sourceUrl: sourceUrl.trim(),
      attentionReason: reason.trim() || undefined,
    })
      .then(() => {
        toast('已添加未来事件')
        closeModal()
        onCreated()
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : '添加失败'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>事件名称</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="必填"
          />
        </div>
        <div className="field">
          <label>预计时间/范围</label>
          <input
            value={factTime}
            onChange={(e) => setFactTime(e.target.value)}
            placeholder="ISO 时间或留空"
          />
        </div>
        <div className="field">
          <label>来源URL</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="必填"
          />
        </div>
        <div className="field">
          <label>指定关注原因</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <div className="note">人工导入默认「待核验」，不会提高确认等级或表达边界。</div>
      <button
        className="btn primary"
        style={{ width: '100%', marginTop: 10 }}
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? '提交中…' : '提交'}
      </button>
    </div>
  )
}
