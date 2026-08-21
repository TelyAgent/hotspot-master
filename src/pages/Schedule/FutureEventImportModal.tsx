import { forwardRef, useImperativeHandle, useState } from 'react'
import { Alert, Button, Input, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { importFutureEvents } from '../../api/futureEvents'
import { useApp } from '../../context/AppContext'

export interface FutureEventImportModalHandle {
  submit: () => Promise<boolean>
}

const FutureEventImportModal = forwardRef<FutureEventImportModalHandle, {
  onImported: () => void
}>(function FutureEventImportModal({ onImported }, ref) {
  const { toast, closeModal } = useApp()
  const [csv, setCsv] = useState('')

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const submit = async () => {
    if (!csv.trim()) {
      toast('请选择 CSV 文件或粘贴内容')
      return false
    }
    try {
      const r = await importFutureEvents({ csv: csv.trim() })
      toast(`导入 ${r.imported} 条${r.skipped ? `，跳过 ${r.skipped} 条` : ''}`)
      closeModal()
      onImported()
      return true
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : '导入失败')
      return false
    }
  }

  useImperativeHandle(ref, () => ({ submit }), [submit])

  return (
    <div>
      <Upload
        accept=".csv,text/csv"
        beforeUpload={(file) => {
          onFile(file)
          return false
        }}
        maxCount={1}
      >
        <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
      </Upload>
      <Input.TextArea
        rows={6}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="或直接粘贴 CSV 内容"
        style={{ width: '100%', marginTop: 8 }}
      />
      <Alert style={{ marginTop: 10 }} message="列：事件名称、主体、事件类型、事实时间(ISO)、来源URL；来源URL 必填。" showIcon />
    </div>
  )
})

export default FutureEventImportModal
