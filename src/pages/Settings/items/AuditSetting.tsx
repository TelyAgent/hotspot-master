import { useEffect, useState } from 'react'
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
          <button className="btn">导出审计</button>
        </div>
      </div>

      {loading ? (
        <div className="note">正在加载…</div>
      ) : records.length === 0 ? (
        <div className="note">暂无审计记录</div>
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

      <div className="note">
        <b>这个分区承担什么作用？</b>
        <br />
        {settingHelp.audit}
      </div>
    </section>
  )
}
