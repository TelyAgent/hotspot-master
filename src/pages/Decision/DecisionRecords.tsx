import { useMemo, useState } from 'react'
import { Button, Drawer, Empty, Tag, message } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'
import { decisionRecords, type DecisionRecord } from './decisionData'

const resultFilters = [
  { key: 'all', label: '全部' },
  { key: 'adopted', label: '直接采用' },
  { key: 'edited', label: '修改后采用' },
  { key: 'rejected', label: '不采用' },
] as const

function resultColor(result: DecisionRecord['result']) {
  if (result === 'adopted') return 'green'
  if (result === 'edited') return 'orange'
  return 'red'
}

function Metric({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </div>
  )
}

export default function DecisionRecords() {
  const [result, setResult] = useState<(typeof resultFilters)[number]['key']>('all')
  const [active, setActive] = useState<DecisionRecord | null>(null)

  const visible = useMemo(
    () => decisionRecords.filter((item) => result === 'all' || item.result === result),
    [result],
  )
  const adoptedCount = decisionRecords.filter((item) => item.result !== 'rejected').length
  const adoptionRate = Math.round((adoptedCount / decisionRecords.length) * 100)

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>DECISION FEEDBACK</div>
      <div className={styles.head}>
        <div>
          <h1>决策记录</h1>
          <p>回溯运营人员对承接角度的采用结果，查看首轮质量、重新推荐效果与主要问题。</p>
        </div>
        <Button className={styles.exportButton} icon={<ExportOutlined />} onClick={() => message.success('日报已生成')}>
          导出日报
        </Button>
      </div>

      <section className={styles.metrics}>
        <Metric value={decisionRecords.length} label="筛选范围已审核" />
        <Metric value={`${adoptionRate}%`} label="最终采用率" note="至少采用一个角度" />
        <Metric value="51%" label="首轮采用率" note="未重推直接采用" />
        <Metric value="43%" label="重推挽回率" note="重推后最终采用" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>最终结果</div>
          <div className={styles.filters}>
          <b>最终结果</b>
          {resultFilters.map((item) => (
            <button
              className={`${styles.chip} ${result === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setResult(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>统计日期</div>
          <div className={styles.filters}>
            {['今日', '昨日', '最近7天'].map((item, index) => (
              <button className={`${styles.chip} ${index === 0 ? styles.chipActive : ''}`} key={item} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tablePanel}>
        <div className={`${styles.recordGrid} ${styles.recordHead}`}>
          <span>事件与最终角度</span>
          <span>推荐依据</span>
          <span>最终结果</span>
          <span>采用／拒绝信息</span>
          <span>重推次数</span>
          <span>审核</span>
        </div>
        {visible.length ? (
          visible.map((item) => (
            <button
              className={`${styles.recordGrid} ${styles.recordRow} ${styles.tableButton}`}
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
            >
              <span>
                <b>{item.title}</b>
                <small>{item.angle}</small>
              </span>
              <span>{item.basis}</span>
              <span><Tag color={resultColor(item.result)}>{item.resultText}</Tag></span>
              <span>{item.note}</span>
              <span>{item.regen} 次</span>
              <span>
                {item.operator}
                <small>{item.time}</small>
              </span>
            </button>
          ))
        ) : (
          <Empty description="当前筛选下没有记录" />
        )}
      </section>

      <Drawer title={active?.title} open={active != null} width={540} onClose={() => setActive(null)}>
        {active ? (
          <>
            <section className={styles.drawerSection}>
              <div className={styles.tagrow}>
                <Tag color="cyan">{active.basis}</Tag>
                <Tag color={resultColor(active.result)}>{active.resultText}</Tag>
              </div>
              <div className={styles.reason}>
                <b>{active.resultText}：</b>{active.note}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>最终角度</h3>
              <p>{active.angle}</p>
            </section>
            <section className={styles.drawerSection}>
              <h3>处理时间线</h3>
              <div className={styles.angleList}>
                {active.timeline.map((item, index) => (
                  <div className={styles.angleItem} key={item}>
                    <b>0{index + 1}</b>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>统计口径</h3>
              <p className={styles.muted}>计入已审核选题；{active.result === 'rejected' ? '不计入最终采用。' : '计入最终采用。'}</p>
            </section>
          </>
        ) : null}
      </Drawer>
    </div>
  )
}
