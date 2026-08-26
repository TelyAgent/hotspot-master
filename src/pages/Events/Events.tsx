import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Pagination, Tag, Typography } from 'antd'
import { CopyOutlined, ProfileOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { EventItem, TaskItem } from '../../data/types'
import { useEvents } from '../../hooks/useEvents'
import {
  generateHotspotPosts,
  getHotspotDrafts,
  publishHotspotPost,
  type HotspotDraft,
} from '../../api/hotspotOperation'
import HotspotOperationDetail from './HotspotOperationDetail'
import { CorrectModal } from './EventModals'
import styles from './Events.module.css'

type DetailTab = 'overview' | 'facts' | 'timeline' | 'sources' | 'merge'

const STANDARD_FILTERS = [
  '全部',
  'X 热搜',
  '关注圈层',
  'Future Event',
  'YouTube',
  'Top 5',
  'Fast Rising',
  '第一方确认',
  '核心人物确认',
  '官方日程确认',
  'Action Score 80+',
  'Candidate',
]

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: '完整上下文' },
  { key: 'facts', label: '事实与证据' },
  { key: 'timeline', label: '时间与发展' },
  { key: 'sources', label: '来源子包' },
  { key: 'merge', label: '关联与聚合' },
]

interface EventView extends EventItem {
  sources: string[]
  triggers: string[]
  fact: string
  attention: string
  pack: string
  time: string
  entryMode: string
  state: string
}

export default function Events() {
  const { openModal, toast } = useApp()
  const [filter, setFilter] = useState('全部')
  const [page, setPage] = useState(1)
  const [detailEventId, setDetailEventId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('overview')

  const query = useMemo(() => eventFilterToQuery(filter), [filter])
  const { events, total, pageSize, loading, error } = useEvents({
    page,
    pageSize: 20,
    status: query.status,
    label: query.label,
  })
  const eventViews = useMemo(() => events.map((item, index) => toEventView(item, index)), [events])
  const filters = useMemo(() => buildFilters(eventViews), [eventViews])
  const visibleEvents = eventViews
  const detailEvent = detailEventId ? eventViews.find((item) => item.id === detailEventId) ?? null : null
  const metrics = {
    active: eventViews.length,
    multiSource: eventViews.filter((item) => item.sources.length > 1).length,
    candidate: eventViews.filter((item) => item.status === '内容生成中' || item.verify === '存在冲突').length,
    review: eventViews.filter((item) => item.verify === '存在冲突').length,
  }

  const openHotspotOperation = (event: EventItem) => {
    openModal('热点运营', <HotspotOperationModal event={event} />, true, 'large')
  }

  const copyContext = (event: EventView) => {
    const text = JSON.stringify(createPackObject(event), null, 2)
    void navigator.clipboard?.writeText(text)
    toast('完整 Context Pack 已复制')
  }

  if (detailEvent) {
    return (
      <EventDetailPage
        event={detailEvent}
        tab={detailTab}
        onTabChange={setDetailTab}
        onBack={() => setDetailEventId(null)}
        onCopy={() => copyContext(detailEvent)}
        onCorrect={() => openModal('反馈 / 纠错', <CorrectModal e={detailEvent} />)}
        onHotspotOperation={() => openHotspotOperation(detailEvent)}
      />
    )
  }

  return (
    <div className={styles.events}>
      <section className={styles.eventHero}>
        <div>
          <div className={styles.eventEyebrow}>EVENT LAYER</div>
          <Typography.Title level={1}>Hot Event</Typography.Title>
          <Typography.Text>任一来源路径命中即可创建或匹配 Event，多来源只更新同一 Event。</Typography.Text>
        </div>
      </section>

      <div className={styles.eventRuleStrip}>
        <div>
          <b>X 热搜榜</b>
          <span>重点类直接调查；普通热搜检查排名跃升、空降前五和多地区上榜</span>
        </div>
        <div>
          <b>关注圈层</b>
          <span>第一方单点触发，或命中流量异常、圈内共振和跨圈扩散</span>
        </div>
        <div>
          <b>未来事件</b>
          <span>Action Score 达到 80 进入匹配，不改变事实确认状态</span>
        </div>
      </div>

      <div className={styles.eventStats}>
        <KpiBox value={metrics.active} label="活跃 Event" />
        <KpiBox value={metrics.multiSource} label="多来源 Event" />
        <KpiBox value={metrics.candidate} label="Candidate" />
        <KpiBox value={metrics.review} label="待人工复核" />
      </div>

      <div className={styles.eventToolbar}>
        <div className={styles.eventFilters}>
          {filters.map((item) => (
            <Button
              key={item}
              type={filter === item ? 'primary' : 'default'}
              onClick={() => {
                setFilter(item)
                setPage(1)
              }}
            >
              {item}
            </Button>
          ))}
        </div>
        <span>来源 · 客观触发 · 主题与事实状态</span>
      </div>

      {loading ? <div className="note">正在加载 Event…</div> : null}
      {error ? <Alert type="error" message={`加载失败：${error}`} showIcon /> : null}
      {!loading && !error && visibleEvents.length === 0 ? <Empty description="没有匹配的 Event" /> : null}
      {!loading && !error && visibleEvents.length ? (
        <>
          <div className={styles.eventGrid}>
            {visibleEvents.map((item, index) => (
              <EventCard
                key={item.id}
                event={item}
                featured={index === 0}
                onOpen={() => {
                  setDetailEventId(item.id)
                  setDetailTab('overview')
                }}
              />
            ))}
          </div>
          <Pagination
            className={styles.eventPagination}
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={setPage}
          />
        </>
      ) : null}
    </div>
  )
}

function KpiBox({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function EventCard({ event, featured, onOpen }: { event: EventView; featured: boolean; onOpen: () => void }) {
  return (
    <article className={`${styles.intelCard} ${featured ? styles.featured : ''}`}>
      <div>
        <div className={styles.between}>
          <div className={styles.tagrow}>
            <Pill label={event.status === '内容生成中' ? 'Candidate' : '已确认'} />
            {event.sources.map((source) => (
              <Pill key={source} label={source} />
            ))}
            {event.triggers.slice(0, 4).map((trigger) => (
              <Pill key={trigger} label={trigger} />
            ))}
          </div>
          <span className={styles.meta}>{event.pack}</span>
        </div>
        <h2>{event.title}</h2>
        <p>{event.summary}</p>
        <div className={styles.between}>
          <span className={styles.meta}>
            事实状态 <b>{event.fact}</b> · {event.time}
          </span>
          <span className={styles.meta}>{event.sources.length} 个来源</span>
        </div>
      </div>
      <div className={styles.triggerBox}>
        <div className={styles.between}>
          <div>
            <span className={styles.meta}>为什么现在值得关注</span>
            <strong>{event.attention}</strong>
          </div>
          <SourceMarks sources={event.sources} />
        </div>
        {event.triggers.length ? (
          <div className={styles.tagrow}>
            {event.triggers.slice(0, 3).map((trigger) => (
              <Pill key={trigger} label={trigger} />
            ))}
          </div>
        ) : null}
        <p className={styles.meta}>关注权重不等于事实可信度</p>
      </div>
      <div className={styles.cardFoot}>
        <span className={styles.meta}>唯一 Event 已更新</span>
        <Button type="primary" onClick={onOpen}>
          查看证据链
        </Button>
      </div>
    </article>
  )
}

function EventDetailPage({
  event,
  tab,
  onTabChange,
  onBack,
  onCopy,
  onCorrect,
  onHotspotOperation,
}: {
  event: EventView
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
  onBack: () => void
  onCopy: () => void
  onCorrect: () => void
  onHotspotOperation: () => void
}) {
  const pack = createPackObject(event)

  return (
    <div className={styles.eventDetailPage}>
      <button className={styles.backLink} type="button" onClick={onBack}>
        ← 返回 Hot Event
      </button>
      <section className={styles.detailHero}>
        <div className={styles.between}>
          <div>
            <div className={styles.tagrow}>
              <Pill label="Event" />
              <Pill label={event.status === '内容生成中' ? 'Candidate' : '已确认'} />
              <Pill label={event.pack} />
            </div>
            <Typography.Title level={1}>{event.title}</Typography.Title>
            <Typography.Text>{event.summary}</Typography.Text>
          </div>
          <div className={styles.packActions}>
            <Button onClick={onCorrect}>反馈 / 纠错</Button>
            <Button onClick={onHotspotOperation} icon={<ProfileOutlined />}>
              热点运营
            </Button>
            <Button type="primary" icon={<CopyOutlined />} onClick={onCopy}>
              复制完整上下文
            </Button>
          </div>
        </div>
        <div className={styles.changeNote}>
          <b>最新变化：{event.attention}</b>
          <span>新来源追加到现有 Event，Context Pack 已更新。</span>
        </div>
      </section>

      <div className={styles.contractStrip}>
        <ContractCell label="event_id" value={pack.event_id} />
        <ContractCell label="schema_version" value={pack.schema_version} />
        <ContractCell label="intake_id" value={pack.intake_id} />
        <ContractCell label="entry_mode" value={pack.entry_mode} />
        <ContractCell label="state" value={pack.state} emphasis />
        <ContractCell label="updated_at" value={pack.updated_at} />
      </div>

      <div className={styles.detailTabs}>
        {DETAIL_TABS.map((item) => (
          <button key={item.key} className={tab === item.key ? styles.activeTab : ''} type="button" onClick={() => onTabChange(item.key)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? <OverviewTab event={event} /> : null}
      {tab === 'facts' ? <FactsTab event={event} /> : null}
      {tab === 'timeline' ? <TimelineTab event={event} /> : null}
      {tab === 'sources' ? <SourcesTab event={event} /> : null}
      {tab === 'merge' ? <MergeTab event={event} /> : null}

      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <div>
            <b>下游读取规则</b>
            <span className={styles.meta}>复制内容包含 Fact、Evidence、表达边界、来源上下文与响应规则；AI 不得直接读取 Event Card。</span>
          </div>
          <Button type="primary" onClick={onCopy}>复制完整上下文</Button>
        </div>
      </section>
    </div>
  )
}

function ContractCell({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <span>{label}</span>
      <b className={emphasis ? styles.contractEmphasis : ''}>{value}</b>
    </div>
  )
}

function OverviewTab({ event }: { event: EventView }) {
  return (
    <>
      <section className={styles.changeCard}>
        <div>
          <b>本版本最新变化</b>
          <strong>{event.time} · 新 Evidence 更新 Context Pack</strong>
          <span>核心事实不变，表达边界与下一观察点已更新。</span>
        </div>
        <span className={styles.meta}>{event.pack} · 受影响：evidence_records / event_development</span>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.detailPanel}>
          <div className={styles.between}>
            <h2>事件核心</h2>
            <Pill label="已通过结构校验" />
          </div>
          <KeyValue label="事实摘要" value={event.summary} />
          <KeyValue label="主体" value={inferSubject(event.title)} />
          <KeyValue label="核心动作" value={inferAction(event)} />
          <KeyValue label="具体对象" value={event.title} />
          <KeyValue label="事件类型" value={event.trigger} />
          <KeyValue label="事实发生时间" value={event.time} />
        </section>
        <section className={styles.detailPanel}>
          <h2>事件发展</h2>
          <KeyValue label="当前状态" value={event.state} />
          <KeyValue label="判断依据" value={(event.evidence ?? []).length ? `EV-${String(event.evidence?.length).padStart(3, '0')}` : '待补充'} />
          <div className={styles.nextBox}>
            <b>下一观察点</b>
            <ol>
              <li>是否出现新的第一方确认</li>
              <li>是否有补充证据改变事实边界</li>
            </ol>
          </div>
        </section>
      </div>

      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <h2>时间字段</h2>
          <Button type="link">展开时间与发展</Button>
        </div>
        <p className={styles.meta}>区分系统观测时间、事实发生时间和事件有效窗口。</p>
        <div className={styles.timeStrip}>
          <ContractCell label="observed_at" value={event.time} />
          <ContractCell label="fact_time" value={event.time} />
          <ContractCell label="timezone" value="Asia/Shanghai" />
          <ContractCell label="event_window" value="当前观察窗口" />
          <ContractCell label="development.state" value={event.state} />
        </div>
      </section>
    </>
  )
}

function FactsTab({ event }: { event: EventView }) {
  const evidence = event.evidence ?? []
  return (
    <div className={styles.detailGrid}>
      <section className={styles.detailPanel}>
        <h2>Fact 列表</h2>
        <p className={styles.meta}>每条 Fact 都是可独立核验的陈述。</p>
        <button className={`${styles.factRowButton} ${styles.activeFact}`} type="button">
          <div className={styles.between}>
            <b>F-1 · core_fact</b>
            <Pill label={event.fact === '高' ? '已确认' : '待确认'} />
          </div>
          <p>{event.summary}</p>
          <span>{evidence.length} 条 Evidence · 更新 {event.time}</span>
        </button>
      </section>
      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <div>
            <h2>F-1 · core_fact</h2>
            <p>{event.summary}</p>
          </div>
          <Pill label={event.fact === '高' ? '已确认' : '待确认'} />
        </div>
        <h3>绑定的 Evidence</h3>
        {evidence.length ? (
          evidence.map((item, index) => (
            <article className={styles.evidenceDetail} key={`${item.url ?? item.claim}-${index}`}>
              <div className={styles.between}>
                <b>EV-{String(index + 1).padStart(3, '0')} · {item.sourceType}</b>
                <Pill label="supports" />
              </div>
              <p>{item.claim}</p>
              <div className={styles.between}>
                <span className={styles.meta}>来源子包 · {event.sources.join(' / ')}</span>
                {item.url ? <a href={item.url} target="_blank" rel="noreferrer">查看原始链接 ↗</a> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="note">暂无可解析 Evidence。</div>
        )}
      </section>
    </div>
  )
}

function TimelineTab({ event }: { event: EventView }) {
  return (
    <section className={styles.detailPanel}>
      <h2>Event Development</h2>
      <KeyValue label="State" value={event.state} />
      <KeyValue label="Basis Evidence IDs" value={(event.evidence ?? []).map((_, index) => `EV-${index + 1}`).join(', ') || '待补充'} />
      <KeyValue label="Next Observable" value="出现新的第一方确认、官方更正或事实反转" />
      <div className={styles.timelineList}>
        <div><b>{event.time} · Signal 首次被系统观测</b><small>observed_at 记录，尚未改变事实状态</small></div>
        <div><b>{event.time} · 核心事实进入 Event</b><small>来自热点挖掘 Agent 的事件判断</small></div>
        <div><b>{event.time} · Context Pack 版本更新</b><small>Evidence 改变了可表达边界</small></div>
      </div>
    </section>
  )
}

function SourcesTab({ event }: { event: EventView }) {
  return (
    <section className={styles.detailPanel}>
      <div className={styles.between}>
        <div>
          <h2>来源子包与原始 Signal</h2>
          <p className={styles.meta}>每个子包是同一来源路径的结构化集合；展开后可直接进入原帖、榜单或官方排期页面。</p>
        </div>
        <SourceMarks sources={event.sources} />
      </div>
      {event.sources.map((source, index) => (
        <details className={styles.signalPackage} key={source} open={index === 0}>
          <summary>
            <div>
              <b>{source} Source Package</b>
              <span>SP-{source.replace(/\s/g, '-').toUpperCase()}-{event.id.slice(0, 6)} · {event.triggers.length} 个触发条件</span>
            </div>
            <Pill label="已纳入" />
          </summary>
          <div className={styles.signalList}>
            <p>命中 {event.triggers[index] || '来源触发规则'}，原始数据、榜单或帖子快照已保存。</p>
            <div className={styles.tagrow}>{event.triggers.slice(0, 4).map((item) => <Pill key={item} label={item} />)}</div>
          </div>
        </details>
      ))}
    </section>
  )
}

function MergeTab({ event }: { event: EventView }) {
  return (
    <section className={styles.detailPanel}>
      <h2>Event Identity Decision</h2>
      <p className={styles.meta}>标题、关键词、语言、榜单地区、热度和同一人物不能单独作为合并依据。</p>
      <div className={styles.mergeMatrix}>
        {['主体', '核心动作', '具体对象', '时间与地点', '事件状态', '核心事实'].map((item) => (
          <div key={item}>
            <span>{item}</span>
            <b>兼容</b>
          </div>
        ))}
      </div>
      <div className={styles.warning}>系统处理：自动合并或创建关联 Event 时，只追加来源上下文，不覆盖旧 Event。</div>
    </section>
  )
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.kvRow}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return <Tag className={`${styles.pill} ${styles[pillTone(label)]}`}>{label}</Tag>
}

function SourceMarks({ sources }: { sources: string[] }) {
  const labels: Record<string, string> = {
    'X Trend': 'XT',
    'X 热搜': 'XT',
    'Topic Circle': 'TC',
    '关注圈层': 'TC',
    'Future Event': 'FE',
    'YouTube': 'YT',
  }
  if (!sources.length) return <span className={styles.noSourceMark}>—</span>

  return (
    <div className={styles.sourceMarks}>
      {sources.map((source) => (
        <span className={styles.on} key={source}>{labels[source] ?? source.slice(0, 2).toUpperCase()}</span>
      ))}
    </div>
  )
}

function toEventView(event: EventItem, index: number): EventView {
  const sources = inferSources(event)
  const triggers = inferTriggers(event)
  const evidenceCount = event.evidence?.length ?? event.urls.length

  return {
    ...event,
    sources,
    triggers,
    fact: event.verify === '存在冲突' ? '待核实' : '高',
    attention: sources.length > 1 ? `+${sources.length} 来源` : evidenceCount ? `${evidenceCount} 条 Evidence` : '待补充',
    pack: `Context Pack v${Math.max(1, Math.min(index + 1, 9))}`,
    time: formatEventTime(event.trigger),
    entryMode: sources.includes('X 热搜') ? 'trend' : sources.includes('关注圈层') ? 'topic_watch' : sources.includes('Future Event') ? 'future_event' : 'unknown',
    state: event.verify === '存在冲突' ? 'needs_review' : 'validated_active',
  }
}

function inferSources(event: EventItem) {
  const labelSources = (event.labels ?? [])
    .filter((label) => label.category === 'source')
    .map((label) => label.name)
    .filter(Boolean)
  if (labelSources.length > 0) return Array.from(new Set(labelSources))

  const sourceSet = new Set<string>()
  const evidence = event.evidence ?? []
  evidence.forEach((item) => {
    const source = sourceTypeToEventSource(item.sourceType)
    if (source) sourceSet.add(source)
  })
  return Array.from(sourceSet)
}

function sourceTypeToEventSource(sourceType: string) {
  const normalized = sourceType.trim().toLowerCase()
  if (normalized === 'x_trend' || normalized.startsWith('x_trend_')) return 'X 热搜'
  if (
    normalized === 'topic_watch' ||
    normalized === 'topic_circle' ||
    normalized === 'x_account_post' ||
    normalized === 'x_post'
  ) {
    return '关注圈层'
  }
  if (
    normalized === 'future_event_candidate' ||
    normalized === 'future_event_source_item' ||
    normalized === 'future_event_monitoring' ||
    ['bea', 'bls', 'fomc', 'opm'].includes(normalized)
  ) {
    return 'Future Event'
  }
  if (normalized === 'youtube_video') return 'YouTube'
  return null
}

function inferTriggers(event: EventItem) {
  return Array.from(
    new Set(
      (event.labels ?? [])
        .filter((label) => label.category === 'trigger' || label.category === 'aggregation')
        .map((label) => label.name)
        .filter(Boolean),
    ),
  )
}

function buildFilters(events: EventView[]) {
  const values = new Set<string>(STANDARD_FILTERS)
  events.forEach((event) => {
    event.sources.forEach((source) => values.add(source))
    event.triggers.forEach((trigger) => values.add(trigger))
  })
  return Array.from(values)
}

function eventFilterToQuery(filter: string): { status?: string; label?: string } {
  if (filter === '全部') return {}
  if (filter === 'Candidate') return { status: 'suggested' }
  return { label: filter }
}

function createPackObject(event: EventView) {
  return {
    event_id: event.id,
    schema_version: '1.0',
    intake_id: `IN-${event.id.slice(0, 8).toUpperCase()}`,
    entry_mode: event.entryMode,
    state: event.state,
    updated_at: event.time,
    title: event.title,
    summary: event.summary,
    sources: event.sources,
    triggers: event.triggers,
    labels: event.labels ?? [],
    evidence_records: event.evidence ?? [],
  }
}

function pillTone(label: string) {
  if (/Top 5|Fast|Spike|急升|高置信度/.test(label)) return 'hot'
  if (/Future|Upcoming|Schedule|Action|未来/.test(label)) return 'amber'
  if (/Circle|圈|Topic|Cross|关注/.test(label)) return 'purple'
  if (/确认|First-party|Event|validated|已纳入|已通过/.test(label)) return 'green'
  if (/Candidate|待|冲突|review/.test(label)) return 'amber'
  return 'cyan'
}

function formatEventTime(trigger: string) {
  const maybeDate = trigger.match(/\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2}/)?.[0]
  if (maybeDate) {
    const date = new Date(maybeDate)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }
  }
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function inferSubject(title: string) {
  return title.split(/[：:·|-]/)[0]?.trim() || title
}

function inferAction(event: EventView) {
  if (/发布|上线|release|launch/i.test(event.title)) return '正式发布'
  if (/收购|acquisition|buy/i.test(event.title)) return '收购 / 交易'
  if (/预测|forecast|probability/i.test(event.title)) return '预测变化'
  return event.triggers[0] || '事件触发'
}

function HotspotOperationModal({ event }: { event: EventItem }) {
  const { toast, closeModal } = useApp()
  const [task, setTask] = useState<TaskItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    getHotspotDrafts(event.id)
      .then((response) => {
        if (!alive) return
        setTask(mapHotspotDraftsToTask(event, response.contentTaskId, response.drafts))
      })
      .catch((e: unknown) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : '加载热点运营任务失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [event.id, event.title])

  const regenerateAndReload = async (instruction?: string) => {
    try {
      const response = await generateHotspotPosts(event.id, instruction)
      setTask(mapHotspotDraftsToTask(event, response.contentTaskId, response.drafts))
      toast('已重新生成 3 条候选')
    } catch {
      toast('重新生成失败，请稍后重试')
    }
  }

  const publishAndReload = async (url: string, candidateId: string, accountName?: string) => {
    try {
      await publishHotspotPost(event.id, candidateId, url, accountName ?? '')
      toast('发布已记录，开始追踪')
      closeModal()
    } catch (e) {
      toast(e instanceof Error ? e.message : '回填失败')
    }
  }

  if (loading) {
    return <div className="note">正在加载热点运营内容…</div>
  }

  if (error) {
    return <Alert type="error" message={`加载失败：${error}`} showIcon />
  }

  if (!task) {
    return <Empty description="当前热点还没有可运营内容" />
  }

  return (
    <HotspotOperationDetail
      task={task}
      onRegenerate={(instruction) => regenerateAndReload(instruction)}
      onPublish={(url, candidateId, accountName) => publishAndReload(url, candidateId, accountName)}
    />
  )
}

function mapHotspotDraftsToTask(
  event: EventItem,
  contentTaskId: string,
  drafts: HotspotDraft[],
): TaskItem {
  const sortedDrafts = [...drafts].sort((a, b) => a.version - b.version).slice(-3)

  return {
    id: contentTaskId,
    eventId: event.id,
    code: 'HOTSPOT',
    event: event.title,
    eventSummary: event.summary,
    eventEvidence: event.evidence ?? event.urls.map((url) => ({ sourceType: 'x_post', claim: url, url })),
    account: '热点运营',
    role: '事件帖子候选',
    status: sortedDrafts.length ? '待发布' : '待生成',
    risk: event.verify === '存在冲突' ? '中' : '普通',
    time: '当前事件',
    copies: sortedDrafts.map((draft) => draft.body),
    candidateIds: sortedDrafts.map((draft) => draft.id),
  }
}
