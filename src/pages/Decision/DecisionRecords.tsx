import { useEffect, useMemo, useState } from 'react'
import { Button, Drawer, Empty, Spin, Tag, message } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'
import {
  listOperationDecisionRecords,
  type OperationDecisionRecord,
  type OperationDecisionResult,
} from '../../api'

const resultFilters = [
  { key: 'all', label: '全部' },
  { key: 'adopted', label: '直接采用' },
  { key: 'edited', label: '修改后采用' },
  { key: 'rejected', label: '不采用' },
] as const

function resultColor(result: OperationDecisionResult) {
  if (result === 'adopted') return 'green'
  if (result === 'edited') return 'orange'
  return 'red'
}

function resultText(result: OperationDecisionResult) {
  if (result === 'adopted') return '直接采用'
  if (result === 'edited') return '修改后采用'
  return '不采用'
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
  const [items, setItems] = useState<OperationDecisionRecord[]>([])
  const [active, setActive] = useState<OperationDecisionRecord | null>(null)
  const [loading, setLoading] = useState(false)

  const visible = useMemo(
    () => items.filter((item) => result === 'all' || item.result === result),
    [items, result],
  )
  const adoptedCount = items.filter((item) => item.result !== 'rejected').length
  const directAdoptedCount = items.filter((item) => item.result === 'adopted').length
  const editedCount = items.filter((item) => item.result === 'edited').length
  const adoptionRate = items.length ? Math.round((adoptedCount / items.length) * 100) : 0
  const firstRoundRate = items.length ? Math.round((directAdoptedCount / items.length) * 100) : 0
  const editedRate = items.length ? Math.round((editedCount / items.length) * 100) : 0

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listOperationDecisionRecords())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '决策记录加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

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
        <Metric value={items.length} label="筛选范围已审核" />
        <Metric value={`${adoptionRate}%`} label="最终采用率" note="至少采用一个角度" />
        <Metric value={`${firstRoundRate}%`} label="首轮采用率" note="未修改直接采用" />
        <Metric value={`${editedRate}%`} label="修改后采用率" note="人工修订后采用" />
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
        <Spin spinning={loading}>
        {visible.length ? (
          visible.map((item) => (
            <button
              className={`${styles.recordGrid} ${styles.recordRow} ${styles.tableButton}`}
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
            >
              <span>
                <b>{item.recommendation.title}</b>
                <small>{item.finalAngle ?? '本次全部不采用'}</small>
              </span>
              <span>{basisText(item.recommendation.basis)}</span>
              <span><Tag color={resultColor(item.result)}>{resultText(item.result)}</Tag></span>
              <span>{item.note || '无补充说明'}</span>
              <span>{item.regenCount} 次</span>
              <span>
                {item.operator || '未记录'}
                <small>{formatDateTime(item.createdAt)}</small>
              </span>
            </button>
          ))
        ) : (
          <Empty description="当前筛选下没有记录" />
        )}
        </Spin>
      </section>

      <Drawer title={active?.recommendation.title} open={active != null} width={560} onClose={() => setActive(null)}>
        {active ? (
          <>
            <section className={styles.drawerSection}>
              <div className={styles.tagrow}>
                <Tag color="cyan">{basisText(active.recommendation.basis)}</Tag>
                <Tag color={resultColor(active.result)}>{resultText(active.result)}</Tag>
              </div>
              <div className={styles.reason}>
                <b>{resultText(active.result)}：</b>{active.note || '无补充说明'}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>最终角度</h3>
              <p>{active.finalAngle ?? '本次全部不采用'}</p>
            </section>
            <section className={styles.drawerSection}>
              <h3>事件上下文摘要</h3>
              <p>{active.recommendation.summary}</p>
            </section>
            <section className={styles.drawerSection}>
              <h3>完整事件时间线</h3>
              <div className={styles.angleList}>
                {buildTimeline(active).map((item, index) => (
                  <div className={styles.angleItem} key={`${item.label}-${item.time}`}>
                    <b>0{index + 1}</b>
                    <p>{item.label}</p>
                    <small className={styles.muted}>{item.time}</small>
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

function basisText(basis: string) {
  if (basis === 'heat') return '公共热度'
  if (basis === 'market') return '实时市场'
  return '产品价值'
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildTimeline(record: OperationDecisionRecord) {
  const timeline = []
  const news = record.recommendation.predxNewsItem
  if (news?.publishedAt) {
    timeline.push({
      label: `PredX 新闻发布：${news.title}`,
      time: formatDateTime(news.publishedAt),
    })
  }
  timeline.push({
    label: `生成选题推荐：${record.recommendation.reason}`,
    time: formatDateTime(record.recommendation.createdAt),
  })
  timeline.push({
    label: `运营决策：${resultText(record.result)}`,
    time: formatDateTime(record.createdAt),
  })
  return timeline
}
