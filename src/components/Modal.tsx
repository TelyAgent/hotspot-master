import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Modal() {
  const { modal, closeModal, toast } = useApp()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, closeModal])

  if (!modal) return null

  const handleConfirm = async () => {
    if (!modal.confirm) return
    setSubmitting(true)
    try {
      await modal.confirm.onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-wrap"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div className={`modal ${modal.size === 'large' ? 'large' : ''}`}>
        <div className="modal-head">
          <b>{modal.title}</b>
          <button className="btn link" onClick={closeModal}>
            关闭
          </button>
        </div>
        <div className="modal-body">{modal.body}</div>
        <div className="modal-foot">
          {modal.confirm ? (
            <>
              <button className="btn" onClick={closeModal}>
                取消
              </button>
              <button className="btn primary" disabled={submitting} onClick={handleConfirm}>
                {submitting ? '保存中…' : modal.confirm.label}
              </button>
            </>
          ) : modal.readonly ? (
            <button className="btn primary" onClick={closeModal}>
              关闭
            </button>
          ) : (
            <>
              <button className="btn" onClick={closeModal}>
                取消
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  closeModal()
                  toast('已保存为草稿并写入版本记录')
                }}
              >
                保存为草稿
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
