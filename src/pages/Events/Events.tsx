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
import { getEventMergeDetail } from '../../api/eventMerge'
import type { EventMergeDetail } from '../../data/types'
import EventIdentityDecisionCard from './EventIdentityDecisionCard'
import HotspotOperationDetail from './HotspotOperationDetail'
import { CorrectModal } from './EventModals'
import styles from './Events.module.css'

type DetailTab = 'overview' | 'facts' | 'timeline' | 'merge'

const SOURCE_HEAT_FILTERS = [
  '全部',
  'X Trend',
  'Topic Circle',
  'Future Event',
  'Top5',
  'Fast Rising',
  'Multi-region',
  '第一方确认',
  'Re-entry',
]

const DOMAIN_FILTERS = [
  'AI',
  'Technology',
  'Politics & Elections',
  'Geopolitics & Conflict',
  'Macro & Financial Markets',
  'Crypto & Web3',
  'Prediction Markets',
  'Official Schedule',
]

const SOURCE_HEAT_FILTER_SET = new Set(SOURCE_HEAT_FILTERS.filter((item) => item !== '全部'))
const DOMAIN_FILTER_SET = new Set(DOMAIN_FILTERS)

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: '完整上下文' },
  { key: 'facts', label: '事实与证据' },
  { key: 'timeline', label: '时间与发展' },
  { key: 'merge', label: '关联与聚合' },
]

interface EventView extends EventItem {
  sources: string[]
  triggers: string[]
  domains: string[]
  displayLabels: string[]
  fact: string
  attention: string
  pack: string
  time: string
  observedTime: string
  sourcePublishedTime: string
  createdTime: string
  updatedTime: string
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
  const sourceHeatFilters = useMemo(() => buildSourceHeatFilters(eventViews), [eventViews])
  const domainFilters = useMemo(() => buildDomainFilters(eventViews), [eventViews])
  const visibleEvents = eventViews
  const detailEvent = detailEventId ? eventViews.find((item) => item.id === detailEventId) ?? null : null
  const metrics = {
    active: eventViews.length,
    multiSource: eventViews.filter((item) => item.sources.length > 1).length,
    candidate: eventViews.filter((item) => item.status === '内容生成中' || item.verify === '存在冲突').length,
    conflict: eventViews.filter((item) => item.verify === '存在冲突').length,
  }

  const openHotspotOperation = (event: EventItem) => {
    openModal('热点运营', <HotspotOperationModal event={event} />, true, 'large')
  }

  const copyContext = async (event: EventView) => {
    const text = createPackText(event)
    try {
      await copyTextToClipboard(text)
      toast('完整 Context Pack 已复制')
    } catch {
      toast('复制失败，请检查浏览器剪切板权限')
    }
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
        <KpiBox value={metrics.conflict} label="冲突/待核实" />
      </div>

      <div className={styles.eventFilterPanel}>
        <div className={styles.filterRow}>
          <b>来源与热度</b>
          <div className={styles.eventFilters}>
            {sourceHeatFilters.map((item) => (
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
          <Button
            className={styles.resetFilter}
            type="link"
            onClick={() => {
              setFilter('全部')
              setPage(1)
            }}
          >
            重置筛选
          </Button>
        </div>
        <div className={styles.filterRow}>
          <b>事件领域</b>
          <div className={styles.eventFilters}>
            {domainFilters.map((item) => (
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
        </div>
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
            {event.sources.map((source) => (
              <Pill key={source} label={source} />
            ))}
            {event.triggers.slice(0, 4).map((trigger) => (
              <Pill key={trigger} label={trigger} />
            ))}
            {event.domains.slice(0, 3).map((domain) => (
              <Pill key={domain} label={domain} />
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
              {event.displayLabels.map((label) => (
                <Pill key={label} label={label} />
              ))}
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
      {tab === 'merge' ? <MergeTab event={event} /> : null}

      {tab === 'overview' ? (
        <section className={styles.detailPanel}>
          <div className={styles.between}>
            <div>
              <b>下游读取规则</b>
              <span className={styles.meta}>复制内容包含 Fact、Evidence、表达边界、来源上下文与响应规则；AI 不得直接读取 Event Card。</span>
            </div>
            <Button type="primary" onClick={onCopy}>复制完整上下文</Button>
          </div>
        </section>
      ) : null}
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
          <strong>{event.updatedTime} · 新 Evidence 更新 Context Pack</strong>
          <span>核心事实不变，表达边界与下一观察点已更新。</span>
        </div>
        <span className={styles.meta}>{event.pack} · 受影响：evidence_records / event_development</span>
      </section>

      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <h2>事件核心</h2>
          <Pill label="已通过结构校验" />
        </div>
        <KeyValue label="事实摘要" value={event.summary} />
        <KeyValue label="事实发生时间" value={event.time} />
        <KeyValue label="事件领域" value={event.domains.join('、') || '未标注'} />
        <TagValue label="触发标签" values={event.displayLabels} />
      </section>

      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <h2>时间字段</h2>
          <Button type="link">展开时间与发展</Button>
        </div>
        <p className={styles.meta}>区分系统观测时间、事实发生时间和事件有效窗口。</p>
        <div className={styles.timeStrip}>
          <ContractCell label="热点抓取时间" value={event.observedTime} />
          <ContractCell label="首次事实来源发布时间" value={event.sourcePublishedTime} />
          <ContractCell label="时区" value="Asia/Shanghai" />
        </div>
      </section>

      <FactsTab event={event} />
      <TimelineTab event={event} />
      <MergeTab event={event} />
    </>
  )
}

function FactsTab({ event }: { event: EventView }) {
  const evidence = event.evidence ?? []
  return (
    <section className={styles.evidencePanel}>
      <div className={styles.sectionEyebrow}>EVIDENCE</div>
      <h2>绑定的 Evidence</h2>
      {evidence.length ? (
        <div className={styles.evidenceCardList}>
          {evidence.map((item, index) => (
            <article className={styles.evidenceCard} key={`${item.url ?? item.claim}-${index}`}>
              <div className={styles.evidenceCardHead}>
                <div>
                  <b>{evidenceSourceTitle(item)}</b>
                  {evidenceAuthorHandle(item) ? <span>@{evidenceAuthorHandle(item)}</span> : null}
                </div>
                <Pill label={event.fact === '高' ? '已核验' : '待核验'} />
              </div>
              <p>{item.claim}</p>
              <div className={styles.evidenceCardFoot}>
                <span>{evidenceMetaText(item)}</span>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    查看原始链接 ↗
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty description="暂无可解析 Evidence" />
      )}
    </section>
  )
}

function evidenceSourceTitle(item: NonNullable<EventView['evidence']>[number]) {
  const sourceLabel = evidenceAccountName(item) ?? sourceTypeName(item.sourceType)
  const role = evidenceRoleName(item.sourceType)
  return `${sourceLabel}${role ? ` · ${role}` : ''}`
}

function evidenceAccountName(item: NonNullable<EventView['evidence']>[number]) {
  const metadata = asRecord(item.metadata)
  return getString(metadata?.authorName) ?? getString(metadata?.channelTitle) ?? getString(item.author)
}

function evidenceAuthorHandle(item: NonNullable<EventView['evidence']>[number]) {
  const metadata = asRecord(item.metadata)
  const handle = getString(item.author) ?? getString(metadata?.authorHandle)
  const accountName = evidenceAccountName(item)
  return handle && handle !== accountName ? handle.replace(/^@/, '') : null
}

function evidenceMetaText(item: NonNullable<EventView['evidence']>[number]) {
  return [
    item.publishedAt ? `发布 ${formatDateTime(item.publishedAt)}` : null,
    item.observedAt ? `采集 ${formatDateTime(item.observedAt)}` : null,
    evidenceMetricText(item.metrics),
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ') || '暂无时间与公开指标'
}

function sourceTypeName(sourceType: string) {
  const names: Record<string, string> = {
    x_account_post: 'X 帖子',
    x_post: 'X 帖子',
    x_trend: 'X 热搜榜',
    x_trend_related_post: 'X 相关帖子',
    youtube_video: 'YouTube 视频',
    youtube_transcript_analysis: 'YouTube 字幕拆解',
    future_event_source_item: '官方日程',
    evidence_ref: 'Evidence',
  }
  return names[sourceType] ?? sourceType
}

function evidenceRoleName(sourceType: string) {
  const roles: Record<string, string> = {
    x_account_post: '监控账号',
    x_post: '帖子来源',
    x_trend: '热榜来源',
    x_trend_related_post: '相关讨论',
    youtube_video: '视频来源',
    youtube_transcript_analysis: '内容拆解',
    future_event_source_item: '官方来源',
  }
  return roles[sourceType] ?? ''
}

function evidenceMetricText(metrics: unknown) {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) return null
  const data = metrics as Record<string, unknown>
  const views = getMetricNumber(data, ['views', 'viewCount'])
  const likes = getMetricNumber(data, ['likes', 'likeCount'])
  const replies = getMetricNumber(data, ['replies', 'replyCount', 'comments', 'commentCount'])
  const reposts = getMetricNumber(data, ['reposts', 'retweets', 'retweetCount'])
  const parts = [
    views != null ? `${formatCompactNumber(views)}浏览` : null,
    likes != null ? `${formatCompactNumber(likes)}赞` : null,
    replies != null ? `${formatCompactNumber(replies)}回复` : null,
    reposts != null ? `${formatCompactNumber(reposts)}转发` : null,
  ].filter((part): part is string => Boolean(part))
  return parts.length ? parts.join(' · ') : null
}

function getMetricNumber(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function formatCompactNumber(value: number) {
  if (value >= 10000) return `${Number((value / 10000).toFixed(value >= 100000 ? 0 : 1))}万`
  return String(value)
}

function TimelineTab({ event }: { event: EventView }) {
  const [detail, setDetail] = useState<EventMergeDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setError(null)
    getEventMergeDetail(event.id)
      .then((response) => {
        if (alive) setDetail(response)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : '加载聚合更新时间失败')
      })

    return () => {
      alive = false
    }
  }, [event.id])

  const timeline = buildTimelineEntries(event, detail)

  return (
    <section className={styles.detailPanel}>
      <h2>时间与发展</h2>
      <KeyValue label="当前状态" value={event.state} />
      <KeyValue label="依据数量" value={`${event.evidence?.length ?? 0} 条 Evidence`} />
      <KeyValue label="下一观察点" value="出现新的第一方确认、官方更正、事实反转或热度快照变化" />
      {error ? <Alert type="warning" message={`聚合记录加载失败：${error}`} showIcon /> : null}
      <div className={styles.timelineList}>
        {timeline.map((item) => (
          <div key={`${item.time}-${item.title}`}>
            <b>{formatDateTime(item.time)} · {item.title}</b>
            <small>{item.description}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

interface TimelineEntry {
  time: string
  title: string
  description: string
  priority: number
}

function buildTimelineEntries(event: EventView, detail: EventMergeDetail | null): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  ;(event.evidence ?? []).forEach((item, index) => {
    const label = `EV-${String(index + 1).padStart(3, '0')}`
    if (item.publishedAt) {
      entries.push({
        time: item.publishedAt,
        title: `${label} 原证据发布`,
        description: `${item.sourceType} · ${item.url || item.claim}`,
        priority: 10,
      })
    }
    if (item.observedAt) {
      entries.push({
        time: item.observedAt,
        title: `${label} 被系统采集为证据`,
        description: 'snapshot_at / observed_at 记录，表示系统读取公开数据的时间。',
        priority: 20,
      })
    }
  })

  addTimelineEntry(entries, event.createdAt, '核心事实进入 Event', '热点挖掘 Agent 创建 Event，并写入当前核心事实。', 30)

  ;(detail?.sourceContexts ?? []).forEach((context) => {
    addTimelineEntry(
      entries,
      context.triggeredAt,
      `${sourceName(context.sourceType)} 来源触发`,
      `${context.triggerType}${context.triggerRuleCode ? ` · ${context.triggerRuleCode}` : ''} · ${context.summary || context.title}`,
      40,
    )
    addTimelineEntry(
      entries,
      context.updatedAt ?? context.createdAt,
      `${sourceName(context.sourceType)} 来源上下文更新`,
      `Context v${context.contextVersion} · ${context.evidenceRefs.length} 条 Evidence，${context.signalRefs.length} 条 Signal。`,
      50,
    )
  })

  addTimelineEntry(
    entries,
    detail?.latestIdentityDecision?.decidedAt ?? detail?.latestIdentityDecision?.createdAt,
    '事件聚合判断更新',
    detail?.latestIdentityDecision
      ? `${detail.latestIdentityDecision.systemAction} · 合并置信度 ${detail.latestIdentityDecision.mergeConfidence}`
      : '',
    60,
  )

  ;(detail?.relations ?? []).forEach((relation) => {
    addTimelineEntry(
      entries,
      relation.createdAt,
      `关联事件记录：${relationTypeName(relation.relationType)}`,
      relation.reason,
      70,
    )
  })

  addTimelineEntry(entries, event.updatedAt, 'Context Pack 版本更新', 'Event 绑定的数据或表达边界发生变化，更新时间来自 Event.updated_at。', 90)

  return dedupeTimelineEntries(entries).sort((left, right) => {
    const delta = new Date(left.time).getTime() - new Date(right.time).getTime()
    return delta === 0 ? left.priority - right.priority : delta
  })
}

function addTimelineEntry(
  entries: TimelineEntry[],
  time: string | null | undefined,
  title: string,
  description: string,
  priority: number,
) {
  if (!time || Number.isNaN(new Date(time).getTime())) return
  entries.push({ time, title, description, priority })
}

function dedupeTimelineEntries(entries: TimelineEntry[]) {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    const key = `${new Date(entry.time).toISOString()}|${entry.title}|${entry.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function MergeTab({ event }: { event: EventView }) {
  const [detail, setDetail] = useState<EventMergeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    getEventMergeDetail(event.id)
      .then((response) => {
        if (alive) setDetail(response)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : '加载事件聚合详情失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [event.id])

  if (loading) {
    return <div className="note">正在加载事件聚合详情…</div>
  }

  if (error) {
    return <Alert type="error" message={`加载失败：${error}`} showIcon />
  }

  return (
    <div className={styles.mergeStack}>
      <EventIdentityDecisionCard decision={detail?.latestIdentityDecision} />
      <section className={styles.detailPanel}>
        <div className={styles.between}>
          <div>
            <h2>关联事件</h2>
            <p className={styles.meta}>不是同一事件但存在后续、修正、反转等关系时，会保留为独立关联 Event。</p>
          </div>
          <Pill label={`${detail?.relations.length ?? 0} 条`} />
        </div>
        {detail?.relations.length ? (
          <div className={styles.mergeRelationList}>
            {detail.relations.map((relation) => (
              <article key={relation.id}>
                <div className={styles.between}>
                  <b>{relationTypeName(relation.relationType)}</b>
                  <span className={styles.meta}>{formatDateTime(relation.createdAt)}</span>
                </div>
                <p>{relation.reason}</p>
                <div className={styles.mergeMetaStrip}>
                  <span>{relation.fromEventId === event.id ? '当前 Event → 关联 Event' : '关联 Event → 当前 Event'}</span>
                  <span>{relation.evidenceRefs.length} 条 Evidence</span>
                  <span>{relation.createdBy === 'agent' ? 'Agent 判断' : relation.createdBy}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="暂无关联事件" />
        )}
      </section>
    </div>
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

function TagValue({ label, values }: { label: string; values: string[] }) {
  return (
    <div className={styles.kvRow}>
      <span>{label}</span>
      <div className={styles.tagrow}>
        {values.length ? values.map((value) => <Pill key={value} label={value} />) : <b>未标注</b>}
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function relationTypeName(value: string) {
  const names: Record<string, string> = {
    follow_up: '后续进展',
    official_result: '正式结果',
    change: '状态变化',
    correction: '事实更正',
    reversal: '事实反转',
    parent_child: '父子事件',
  }
  return names[value] ?? value
}

function sourceName(value: string) {
  const names: Record<string, string> = {
    x_trend: 'X Trend',
    topic_circle: 'Topic Circle',
    topic_watch: 'Topic Circle',
    future_event: 'Future Event',
    official_schedule: 'Future Event',
  }
  return names[value] ?? normalizeSourceHeatLabel(value) ?? value
}

function Pill({ label }: { label: string }) {
  return <Tag className={`${styles.pill} ${styles[pillTone(label)]}`}>{label}</Tag>
}

function SourceMarks({ sources }: { sources: string[] }) {
  const labels: Record<string, string> = {
    'X Trend': 'XT',
    'Topic Circle': 'TC',
    'Future Event': 'FE',
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
  const domains = inferDomains(event)
  const evidenceCount = event.evidence?.length ?? event.urls.length
  const observedAt = firstDate(event.evidence?.map((item) => item.observedAt))
  const publishedAt = firstDate(event.evidence?.map((item) => item.publishedAt))
  const factAt = event.occurredAt ?? publishedAt ?? event.createdAt ?? event.updatedAt
  const createdAt = event.createdAt ?? observedAt ?? factAt
  const updatedAt = event.updatedAt ?? createdAt

  return {
    ...event,
    sources,
    triggers,
    domains,
    displayLabels: buildEventDisplayLabels({ sources, triggers, domains }),
    fact: event.verify === '存在冲突' ? '待核实' : '高',
    attention: sources.length > 1 ? `+${sources.length} 来源` : evidenceCount ? `${evidenceCount} 条 Evidence` : '待补充',
    pack: `Context Pack v${Math.max(1, Math.min(index + 1, 9))}`,
    time: formatNullableDateTime(factAt),
    observedTime: formatNullableDateTime(observedAt),
    sourcePublishedTime: formatNullableDateTime(publishedAt),
    createdTime: formatNullableDateTime(createdAt),
    updatedTime: formatNullableDateTime(updatedAt),
    entryMode: sources.includes('X Trend') ? 'trend' : sources.includes('Topic Circle') ? 'topic_watch' : sources.includes('Future Event') ? 'future_event' : 'unknown',
    state: event.verify === '存在冲突' ? 'needs_attention' : 'validated_active',
  }
}

function buildEventDisplayLabels(input: {
  sources: string[]
  triggers: string[]
  domains: string[]
}) {
  return Array.from(new Set([...input.sources, ...input.triggers, ...input.domains]))
}

function inferSources(event: EventItem) {
  const labelSources = (event.labels ?? [])
    .filter((label) => label.category === 'source')
    .map((label) => normalizeSourceHeatLabel(label.name || label.code))
    .filter((label): label is string => Boolean(label))
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
  if (normalized === 'x_trend' || normalized.startsWith('x_trend_')) return 'X Trend'
  if (
    normalized === 'topic_watch' ||
    normalized === 'topic_circle' ||
    normalized === 'x_account_post' ||
    normalized === 'x_post'
  ) {
    return 'Topic Circle'
  }
  if (
    normalized === 'future_event_candidate' ||
    normalized === 'future_event_source_item' ||
    normalized === 'future_event_monitoring' ||
    ['bea', 'bls', 'fomc', 'opm'].includes(normalized)
  ) {
    return 'Future Event'
  }
  return null
}

function inferTriggers(event: EventItem) {
  return Array.from(
    new Set(
      (event.labels ?? [])
        .filter((label) => label.category === 'trigger' || label.category === 'aggregation')
        .map((label) => normalizeSourceHeatLabel(label.name || label.code))
        .filter((label): label is string => Boolean(label)),
    ),
  )
}

function inferDomains(event: EventItem) {
  return Array.from(
    new Set(
      (event.labels ?? [])
        .filter((label) => label.category === 'domain')
        .map((label) => label.name || label.code)
        .filter((label) => DOMAIN_FILTER_SET.has(label)),
    ),
  )
}

function buildSourceHeatFilters(_events: EventView[]) {
  return SOURCE_HEAT_FILTERS
}

function buildDomainFilters(_events: EventView[]) {
  return DOMAIN_FILTERS
}

function eventFilterToQuery(filter: string): { status?: string; label?: string } {
  if (filter === '全部') return {}
  return { label: filter }
}

function normalizeSourceHeatLabel(label: string) {
  const aliases: Record<string, string> = {
    'X 热搜': 'X Trend',
    x_trend: 'X Trend',
    'Top 5': 'Top5',
    x_trend_top_5: 'Top5',
    x_trend_fast_rising: 'Fast Rising',
    x_trend_multi_region: 'Multi-region',
    多地区上榜: 'Multi-region',
    关注圈层: 'Topic Circle',
    topic_circle: 'Topic Circle',
    first_party_confirmed: '第一方确认',
    'First-party': '第一方确认',
  }
  const normalized = aliases[label] ?? label
  return SOURCE_HEAT_FILTER_SET.has(normalized) ? normalized : null
}

function createPackObject(event: EventView) {
  return {
    event_id: event.id,
    schema_version: '1.0',
    intake_id: `IN-${event.id.slice(0, 8).toUpperCase()}`,
    entry_mode: event.entryMode,
    state: event.state,
    updated_at: event.updatedTime,
    title: event.title,
    summary: event.summary,
    sources: event.sources,
    triggers: event.triggers,
    domains: event.domains,
    labels: event.labels ?? [],
    evidence_records: event.evidence ?? [],
  }
}

function createPackText(event: EventView) {
  const pack = createPackObject(event)
  const evidence = event.evidence ?? []
  const labels = event.labels ?? []

  return [
    '# 热点事件完整上下文',
    '',
    '## 事件基础信息',
    `- Event ID：${pack.event_id}`,
    `- Schema Version：${pack.schema_version}`,
    `- Intake ID：${pack.intake_id}`,
    `- 入口类型：${pack.entry_mode}`,
    `- 当前状态：${pack.state}`,
    `- 更新时间：${pack.updated_at}`,
    `- 标题：${event.title}`,
    `- 摘要：${event.summary}`,
    '',
    '## 事件核心',
    `- 事实摘要：${event.summary}`,
    `- 主体：${inferSubject(event.title)}`,
    `- 核心动作：${inferAction(event)}`,
    `- 具体对象：${event.title}`,
    `- 事件类型：${event.trigger}`,
    `- 事实发生时间：${event.time}`,
    `- 事实可信度：${event.fact}`,
    '',
    '## 来源与触发',
    listOrNone('来源', event.sources),
    listOrNone('触发标签', event.triggers),
    listOrNone('领域标签', event.domains),
    '',
    '## 标签',
    labels.length
      ? labels
        .map((label) =>
          `- ${label.name || label.code}：${label.reason || '无说明'}（分类：${label.category || 'unknown'}，置信度：${label.confidence || 'unknown'}）`,
        )
        .join('\n')
      : '- 暂无标签',
    '',
    '## Evidence',
    evidence.length
      ? evidence
        .map((item, index) =>
          [
            `### EV-${String(index + 1).padStart(3, '0')}`,
            `- 来源类型：${item.sourceType}`,
            `- 证据陈述：${item.claim}`,
            `- 原始链接：${item.url || '暂无'}`,
          ].join('\n'),
        )
        .join('\n\n')
      : '- 暂无可解析 Evidence',
    '',
    '## 时间与发展',
    `- source_published_at：${event.sourcePublishedTime}`,
    `- snapshot_at / observed_at：${event.observedTime}`,
    `- event_created_at：${event.createdTime}`,
    `- event_updated_at：${event.updatedTime}`,
    '- timezone：Asia/Shanghai',
    '- event_window：当前观察窗口',
    `- development.state：${event.state}`,
    '- 下一观察点：是否出现新的第一方确认、官方更正或事实反转',
    '',
    '## 表达边界',
    '- 可以引用已列出的事实摘要与 Evidence。',
    '- 不要把热度、榜单排名、Signal 或讨论量直接表述为现实事实。',
    '- 数据缺失、证据不足或存在冲突时，需要在内容中如实表达不确定性。',
  ].join('\n')
}

function listOrNone(label: string, values: string[]) {
  return values.length
    ? values.map((value) => `- ${label}：${value}`).join('\n')
    : `- ${label}：暂无`
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fallback for browsers that expose Clipboard API but block it by permission.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    const copied = document.execCommand('copy')
    if (!copied) {
      throw new Error('copy command failed')
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

function pillTone(label: string) {
  if (/Top5|Fast|Spike|急升|高置信度/.test(label)) return 'hot'
  if (/Future|Upcoming|Schedule|Action|未来/.test(label)) return 'amber'
  if (/Circle|圈|Topic|Cross|关注/.test(label)) return 'purple'
  if (/确认|First-party|Event|validated|已纳入|已通过/.test(label)) return 'green'
  if (/Candidate|待|冲突/.test(label)) return 'amber'
  return 'cyan'
}

function firstDate(values?: Array<string | null | undefined>) {
  const dates = (values ?? [])
    .map((value) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    })
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())

  return dates[0]?.toISOString()
}

function formatNullableDateTime(value?: string | null) {
  if (!value) return '暂无记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
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
