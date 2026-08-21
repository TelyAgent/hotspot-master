import { forwardRef, useImperativeHandle, useState } from 'react'
import { Alert, Input } from 'antd'
import { createFutureEvent } from '../../api/futureEvents'
import { useApp } from '../../context/AppContext'

export interface FutureEventModalHandle {
  submit: () => Promise<boolean>
}

const FutureEventModal = forwardRef<FutureEventModalHandle, { onCreated: () => void }>(function FutureEventModal(
  { onCreated },
  ref,
) {
  const { toast, closeModal } = useApp()
  const [title, setTitle] = useState('')
  const [factTime, setFactTime] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [reason, setReason] = useState('')

  const submit = async () => {
    if (!title.trim()) {
      toast('请填写事件名称')
      return false
    }
    if (!sourceUrl.trim()) {
      toast('来源URL 必填')
      return false
    }
    try {
      await createFutureEvent({
        title: title.trim(),
        factTime: factTime.trim() || null,
        sourceUrl: sourceUrl.trim(),
        attentionReason: reason.trim() || undefined,
      })
      toast('已添加未来事件')
      closeModal()
      onCreated()
      return true
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : '添加失败')
      return false
    }
  }

  useImperativeHandle(ref, () => ({ submit }), [submit])

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>事件名称</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="必填"
          />
        </div>
        <div className="field">
          <label>预计时间/范围</label>
          <Input
            value={factTime}
            onChange={(e) => setFactTime(e.target.value)}
            placeholder="ISO 时间或留空"
          />
        </div>
        <div className="field">
          <label>来源URL</label>
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="必填"
          />
        </div>
        <div className="field">
          <label>指定关注原因</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <Alert style={{ marginTop: 10 }} message="人工导入默认「待核验」，不会提高确认等级或表达边界。" showIcon />
    </div>
  )
})

export default FutureEventModal
