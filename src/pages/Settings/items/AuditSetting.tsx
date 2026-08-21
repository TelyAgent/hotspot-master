import { useEffect, useState } from 'react'
import { Alert, Button, Empty, Spin } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { getAudit } from '../../../api/settings'
import type { SettingAudit } from '../../../api/settings'
import { settingHelp } from '../../../data/settings'
import { SettingRow } from '../SettingRow'
import styles from '../Settings.module.css'

export default function AuditSetting() {
  const [records, setRecords] = useState<SettingAudit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAudit()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>审计记录</h2>
            <p className="small">查看谁在什么时间修改了什么对象，以及修改前后版本。</p>
          </div>
          <Button icon={<ExportOutlined />}>导出审计</Button>
        </div>
      </div>

      {loading ? (
        <Spin tip="正在加载…" />
      ) : records.length === 0 ? (
        <Empty description="暂无审计记录" />
      ) : (
        records.map((r) => (
          <SettingRow
            key={r.id}
            name={r.object}
            desc={`${r.operator} · ${r.action}`}
            status={r.version}
            middle="配置对象"
            actionLabel="查看记录"
            onEdit={() => {}}
          />
        ))
      )}

      <Alert style={{ marginTop: 12 }} message="这个分区承担什么作用？" description={settingHelp.audit} showIcon />
    </section>
  )
}
