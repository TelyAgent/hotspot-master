import { useRef, useState } from 'react'
import { Alert, Button, Select, Space, Statistic } from 'antd'
import { ImportOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import { useFutureEvents } from '../../hooks/useFutureEvents'
import { respondFutureEvent } from '../../api/futureEvents'
import type {
  ConfirmationLevel,
  FutureEvent,
  FutureSourceType,
} from '../../api/futureEvents'
import {
  CONFIRMATION_LABEL,
  SOURCE_LABEL,
  scoreBand,
} from '../../data/futureEventLabels'
import { Head } from '../../components/ui'
import CampaignModal from '../../components/CampaignModal'
import FutureEventModal, { type FutureEventModalHandle } from './FutureEventModal'
import FutureEventImportModal, { type FutureEventImportModalHandle } from './FutureEventImportModal'
import SourceStatusPanel from './SourceStatusPanel'
import UnassignedEventsPanel from './UnassignedEventsPanel'
import HeatPanel from './HeatPanel'
import FutureDetail from './FutureDetail'
import styles from './Schedule.module.css'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const BAND_LABEL: Record<string, string> = {
  observe: '观察',
  reserve: '储备',
  planning: '计划',
  worth_response: '值得响应',
  auto_response: '自动响应',
}

function buildDays(year: number, month: number) {
  const mondayStart = (new Date(year, month, 1).getDay() + 6) % 7
  const total = new Date(year, month + 1, 0).getDate()
  const prevTotal = new Date(year, month, 0).getDate()
  return Array.from({ length: 42 }, (_, i) => {
    const n = i - mondayStart + 1
    if (n < 1) return { n: n + prevTotal, out: true }
    if (n > total) return { n: n - total, out: true }
    return { n, out: false }
  })
}

function dayOf(f: FutureEvent): number | null {
  if (!f.factTime) return null
  const d = new Date(f.factTime)
  return Number.isNaN(d.getTime()) ? null : d.getDate()
}

function sourcesOf(f: FutureEvent): FutureSourceType[] {
  return [...new Set(f.evidence.map((e) => e.sourceType))]
}

export default function Schedule() {
  const { openModal, closeModal, toast, go } = useApp()
  const futureEventFormRef = useRef<FutureEventModalHandle>(null)
  const futureImportFormRef = useRef<FutureEventImportModalHandle>(null)

  const [view, setView] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 7,
  })
  const monthParam = `${view.year}-${String(view.month + 1).padStart(2, '0')}`
  const { events, loading, error, reload } = useFutureEvents(monthParam)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [conf, setConf] = useState<'全部' | ConfirmationLevel>('全部')
  const [src, setSrc] = useState<'全部' | FutureSourceType>('全部')
  const [band, setBand] = useState<string>('全部')

  const days = buildDays(view.year, view.month)
  const monthTitle = `${view.year}年${view.month + 1}月`

  const list = events.filter(
    (f) =>
      (conf === '全部' || f.confirmationLevel === conf) &&
      (src === '全部' || sourcesOf(f).includes(src)) &&
      (band === '全部' || scoreBand(f.actionScore.total).key === band),
  )
  const selected = list.find((x) => x.id === selectedId) || list[0] || null

  const confValues = [...new Set(events.map((e) => e.confirmationLevel))]
  const srcValues = [...new Set(events.flatMap((e) => sourcesOf(e)))]
  const bandValues = [...new Set(events.map((e) => scoreBand(e.actionScore.total).key))]

  const countConf = (v: ConfirmationLevel) =>
    events.filter((e) => e.confirmationLevel === v).length
  const countSrc = (v: FutureSourceType) =>
    events.filter((e) => sourcesOf(e).includes(v)).length
  const countBand = (v: string) =>
    events.filter((e) => scoreBand(e.actionScore.total).key === v).length

  const confirmedCount = events.filter(
    (e) => e.confirmationLevel === 'confirmed' || e.confirmationLevel === 'fixed',
  ).length
  const worthCount = events.filter((e) => e.actionScore.total >= 75).length
  const unconfirmedTime = events.filter(
    (e) =>
      e.schedulePrecision === 'unknown' ||
      e.confirmationLevel === 'needs_verification' ||
      e.confirmationLevel === 'expected',
  ).length

  const prevMonth = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    )
  const nextMonth = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    )

  const generateFor = (e: FutureEvent) => {
    respondFutureEvent(e.id, 'content')
      .then((r) => {
        toast(`已创建排期人工响应 Event ${r.eventId}`)
        closeModal()
        go('events')
      })
      .catch((err: unknown) => toast(err instanceof Error ? err.message : '创建响应失败'))
  }

  const campaignFor = (e: FutureEvent) => {
    respondFutureEvent(e.id, 'campaign')
      .then(() => {
        toast('已创建排期人工响应 Event')
        closeModal()
        openModal(`营销活动候选 · ${e.title}`, <CampaignModal />)
      })
      .catch((err: unknown) => toast(err instanceof Error ? err.message : '创建响应失败'))
  }

  const openUnassigned = (e: FutureEvent) => {
    openModal(
      e.title,
      <FutureDetail
        event={e}
        onGenerate={() => generateFor(e)}
        onCampaign={() => campaignFor(e)}
      />,
      true,
      'large',
    )
  }

  const addFuture = () => {
    openModal(
      '添加未来事件',
      <FutureEventModal ref={futureEventFormRef} onCreated={reload} />,
      false,
      'default',
      {
        label: '提交',
        onConfirm: async () => {
          await futureEventFormRef.current?.submit()
        },
      },
    )
  }

  const importFuture = () => {
    openModal(
      '批量导入未来事件',
      <FutureEventImportModal ref={futureImportFormRef} onImported={reload} />,
      false,
      'default',
      {
        label: '导入',
        onConfirm: async () => {
          await futureImportFormRef.current?.submit()
        },
      },
    )
  }

  return (
    <>
      <Head
        title="运营排期"
        desc="通过日历安排未来事件的监测、预热内容与营销准备。"
        actions={
          <>
            <Space.Compact>
              <Button icon={<LeftOutlined />} onClick={prevMonth} />
              <Button>{monthTitle}</Button>
              <Button icon={<RightOutlined />} onClick={nextMonth} />
            </Space.Compact>
            <Button icon={<ImportOutlined />} onClick={importFuture}>
              批量导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={addFuture}>
              添加事件
            </Button>
          </>
        }
      />

      <section className={styles.futureKpis}>
        <div className={styles.futureKpi}>
          <Statistic title="本月事件" value={events.filter((x) => dayOf(x) != null).length} />
          <span className="small">来自5类事件源</span>
        </div>
        <div className={styles.futureKpi}>
          <Statistic title="官方已确认" value={confirmedCount} />
          <span className="small">可以使用确定日期表达</span>
        </div>
        <div className={styles.futureKpi}>
          <Statistic title="进入预热" value={worthCount} />
          <span className="small">Action Score ≥ 75</span>
        </div>
        <div className={styles.futureKpi}>
          <Statistic title="时间待确认" value={unconfirmedTime} />
          <span className="small">持续监测官方更新</span>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 14 }}>
        <div className={styles.futureControls}>
          <label>
            确认状态
            <Select
              style={{ minWidth: 190 }}
              value={conf}
              options={[
                { value: '全部', label: `全部状态（${events.length}）` },
                ...confValues.map((v) => ({ value: v, label: `${CONFIRMATION_LABEL[v]}（${countConf(v)}）` })),
              ]}
              onChange={(value) => setConf(value)}
            />
          </label>
          <label>
            事件来源
            <Select
              style={{ minWidth: 190 }}
              value={src}
              options={[
                { value: '全部', label: `全部来源（${events.length}）` },
                ...srcValues.map((v) => ({ value: v, label: `${SOURCE_LABEL[v]}（${countSrc(v)}）` })),
              ]}
              onChange={(value) => setSrc(value)}
            />
          </label>
          <label>
            准备状态
            <Select
              style={{ minWidth: 170 }}
              value={band}
              options={[
                { value: '全部', label: `全部事件（${events.length}）` },
                ...bandValues.map((v) => ({ value: v, label: `${BAND_LABEL[v]}（${countBand(v)}）` })),
              ]}
              onChange={setBand}
            />
          </label>
          <span className="small">筛选后 {list.length} 个</span>
        </div>
      </section>

      {loading ? (
        <div className="note">正在加载排期…</div>
      ) : error ? (
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      ) : (
        <div className={styles.futureCalendarShell}>
          <section className="card">
            <div className={styles.monthHead}>
              <div>
                <span className={styles.monthTitle}>{monthTitle}事件日历</span>
                <br />
                <span className="small">点击日期中的事件，在右侧查看依据、窗口和准备动作</span>
              </div>
            </div>
            <div className={styles.monthGrid}>
              {WEEKDAYS.map((w) => (
                <div className={styles.monthDow} key={w}>
                  {w}
                </div>
              ))}
              {days.map((d, i) => {
                const es = d.out
                  ? []
                  : list.filter((x) => dayOf(x) === d.n)
                return (
                  <div
                    className={`${styles.monthDay} ${d.out ? styles.outside : ''}`}
                    key={i}
                  >
                    <div className={styles.monthDate}>{d.n}</div>
                    {es.map((x) => (
                      <button
                        key={x.id}
                        className={`${styles.futureEventChip} ${x.id === selected?.id ? styles.active : ''} ${scoreBand(x.actionScore.total).key === 'observe' ? styles.observe : ''}`}
                        onClick={() => setSelectedId(x.id)}
                      >
                        {x.title}
                        <span className={styles.chipMeta}>
                          {CONFIRMATION_LABEL[x.confirmationLevel]} · {x.actionScore.total}分
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
            <div className={styles.legend}>
              <span>
                <i></i>值得响应
              </span>
              <span>
                <i className={styles.prepare}></i>继续观察
              </span>
              <span>确认状态使用中文业务名称，不展示内部字母等级</span>
            </div>
            {list.length === 0 && (
              <Alert type="warning" message="当前筛选没有匹配事件，请调整上方条件。" showIcon />
            )}
            {selected && <HeatPanel event={selected} />}
          </section>

          {selected ? (
            <FutureDetail
              event={selected}
              onGenerate={() => generateFor(selected)}
              onCampaign={() => campaignFor(selected)}
            />
          ) : (
            <aside className={styles.eventDetail}>请选择其他状态。</aside>
          )}
        </div>
      )}

      <UnassignedEventsPanel onOpen={openUnassigned} />
      <SourceStatusPanel />
    </>
  )
}
