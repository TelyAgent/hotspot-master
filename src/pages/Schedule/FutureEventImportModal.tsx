import { useRef, useState } from 'react'
import { importFutureEvents } from '../../api/futureEvents'
import { useApp } from '../../context/AppContext'

export default function FutureEventImportModal({
  onImported,
}: {
  onImported: () => void
}) {
  const { toast, closeModal } = useApp()
  const [csv, setCsv] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const submit = () => {
    if (!csv.trim()) {
      toast('请选择 CSV 文件或粘贴内容')
      return
    }
    setSubmitting(true)
    importFutureEvents({ csv: csv.trim() })
      .then((r) => {
        toast(`导入 ${r.imported} 条${r.skipped ? `，跳过 ${r.skipped} 条` : ''}`)
        closeModal()
        onImported()
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : '导入失败'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
        style={{ marginBottom: 8 }}
      />
      <textarea
        rows={6}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="或直接粘贴 CSV 内容"
        style={{ width: '100%' }}
      />
      <div className="note">
        列：事件名称、主体、事件类型、事实时间(ISO)、来源URL；来源URL 必填。
      </div>
      <button
        className="btn primary"
        style={{ width: '100%', marginTop: 10 }}
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? '导入中…' : '导入'}
      </button>
    </div>
  )
}
