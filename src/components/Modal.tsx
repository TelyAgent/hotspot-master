import { useState } from 'react'
import { Button, Modal as AntModal } from 'antd'
import { useApp } from '../context/AppContext'

export default function Modal() {
  const { modal, closeModal } = useApp()
  const [submitting, setSubmitting] = useState(false)

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

  const footer = modal.confirm ? (
    <>
      <Button onClick={closeModal}>取消</Button>
      <Button type="primary" loading={submitting} onClick={handleConfirm}>
        {submitting ? '保存中…' : modal.confirm.label}
      </Button>
    </>
  ) : modal.readonly ? (
    <Button type="primary" onClick={closeModal}>
      关闭
    </Button>
  ) : null

  return (
    <AntModal
      open
      title={modal.title}
      width={modal.size === 'large' ? 960 : 760}
      centered
      destroyOnHidden
      onCancel={closeModal}
      footer={footer}
    >
      <div className="modal-body">{modal.body}</div>
    </AntModal>
  )
}
