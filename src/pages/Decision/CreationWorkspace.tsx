import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Button, Drawer, Empty, Input, Spin, Tabs, Tag, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  listOperationRecommendations,
  type OperationRecommendation,
  type OperationRecommendationEvidence,
} from '../../api'
import styles from './Decision.module.css'

const goals = ['把事情讲清楚', '提供有用判断', '分享观点和分析', '教会一个方法', '引发讨论', '引导采取行动']
const readers = ['AI 开发者', '产品经理 / 创业者', '普通科技用户', '已有社群用户']
const formats = ['X 短帖', 'X Thread', '回复 / 引用帖', '图文事实卡', '短视频脚本', '长文 / Newsletter']
const revisionPrompts = ['开头更直接', '压缩篇幅', '加强判断', '调整语气', '检查事实边界']

export default function CreationWorkspace() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const recommendationId = params.get('recommendation')
  const [items, setItems] = useState<OperationRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [kitchenOpen, setKitchenOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedAngleIds, setSelectedAngleIds] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState(['把事情讲清楚', '提供有用判断'])
  const [selectedReaders, setSelectedReaders] = useState(['AI 开发者'])
  const [selectedFormats, setSelectedFormats] = useState(['X Thread'])
  const [draft, setDraft] = useState('')
  const [revisionPrompt, setRevisionPrompt] = useState('')

  const active = useMemo(
    () => items.find((item) => item.id === recommendationId) ?? items[0] ?? null,
    [items, recommendationId],
  )
  const selectedAngles = active?.angles.filter((item) => selectedAngleIds.includes(item.id)) ?? []
  const selectedAngle = selectedAngles[0] ?? active?.angles[0]
  const evidence = useMemo(() => (active ? buildEvidence(active) : []), [active])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setItems(await listOperationRecommendations({ take: 50 }))
      } catch (error) {
        message.error(error instanceof Error ? error.message : '内容工作台加载失败')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!active) return
    setSelectedAngleIds(active.angles[0] ? [active.angles[0].id] : [])
  }, [active])

  useEffect(() => {
    if (active) setDraft(buildInitialDraft(active, selectedAngles.map((item) => item.claim)))
  }, [active, selectedAngles])

  const toggleSelection = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => {
      if (prev.includes(value)) return prev.length === 1 ? prev : prev.filter((item) => item !== value)
      return [...prev, value]
    })
  }

  const toggleGoal = (goal: string) => toggleSelection(goal, setSelectedGoals)
  const toggleReader = (reader: string) => toggleSelection(reader, setSelectedReaders)
  const toggleFormat = (item: string) => toggleSelection(item, setSelectedFormats)
  const toggleAngle = (id: string) => toggleSelection(id, setSelectedAngleIds)

  const openKitchen = () => {
    setStep(1)
    setKitchenOpen(true)
  }

  const goNextStep = () => {
    if (step === 1 && active.angles.length > 0 && selectedAngleIds.length === 0) return message.warning('请至少选择一个承接角度')
    if (step === 2 && selectedGoals.length === 0) return message.warning('请至少选择一个内容目标')
    if (step === 3 && selectedReaders.length === 0) return message.warning('请至少选择一个目标读者')
    if (step === 4 && selectedFormats.length === 0) return message.warning('请至少选择一种内容形式')
    if (step < 5) {
      setStep((prev) => prev + 1)
      return
    }
    setKitchenOpen(false)
    navigate('/decision/publish')
  }

  if (loading && !active) {
    return <Spin fullscreen tip="加载内容工作台..." />
  }

  if (!active) {
    return (
      <div className={styles.decisionPage}>
        <Button className={styles.ghostButton} icon={<ArrowLeftOutlined />} onClick={() => navigate('/decision/creation')}>
          返回 AI 创作中心
        </Button>
        <Empty description="没有找到可用于创作的选题推荐" />
      </div>
    )
  }

  return (
    <div className={styles.decisionPage}>
      <Button className={styles.ghostButton} icon={<ArrowLeftOutlined />} onClick={() => navigate('/decision/creation')}>
        返回 AI 创作中心
      </Button>
      <section className={styles.workspaceHead}>
        <Button className={styles.workspaceHeadAction} type="primary" onClick={openKitchen}>
          开始创作
        </Button>
        <div className={styles.tagrow}>
          {active.recommendationLabels.map((label) => (
            <Tag color="cyan" key={label}>{label}</Tag>
          ))}
          <Tag color="green">{basisText(active.basis)}</Tag>
          <Tag>Context Pack</Tag>
        </div>
        <h1>{active.title}</h1>
        <p>{active.summary}</p>
        <div className={styles.reason}>
          <b>推荐原因：</b>{active.reason}
        </div>
      </section>

      <Tabs
        className={styles.workspaceTabs}
        items={[
          {
            key: 'product',
            label: '产品承接机会',
            children: (
              <section className={styles.workspaceSection}>
                <h2>产品承接机会</h2>
                <p className={styles.muted}>这里展示选题推荐侧边栏里的 PredX 承接判断和产品价值信息。</p>
                <article className={`${styles.angleItem} ${styles.angleSelected}`}>
                  <h3>PredX 承接判断</h3>
                  <div className={styles.bridge}>
                    <b>{active.productAssociationLevel || active.productAssociationStatus || '待判断'}</b>
                    <p>{active.productAssociationRationale || '暂无承接判断'}</p>
                    {active.recommendedProductUrl ? (
                      <a href={active.recommendedProductUrl} target="_blank" rel="noreferrer">
                        打开推荐链接 ↗
                      </a>
                    ) : null}
                  </div>
                </article>
                {active.predxNewsItem ? (
                  <article className={styles.angleItem}>
                    <h3>匹配的 PredX 信息</h3>
                    <p>{active.predxNewsItem.primaryMarketTitle || active.predxNewsItem.title}</p>
                    <p className={styles.muted}>{active.predxNewsItem.newsTitle || active.predxNewsItem.sourceName || 'PredX 新闻'}</p>
                  </article>
                ) : null}
              </section>
            ),
          },
          {
            key: 'info',
            label: '相关信息',
            children: (
              <section className={styles.infoGrid}>
                <div className={styles.panel}>
                  <h3>事件与推荐信息</h3>
                  <InfoRow label="推荐依据" value={basisText(active.basis)} />
                  <InfoRow label="处理节奏" value={priorityText(active.priority)} />
                  <InfoRow label="置信度" value={active.confidence} />
                  <InfoRow label="更新时间" value={formatDateTime(active.updatedAt)} />
                  <InfoRow label="风险提示" value={active.riskNotes.join('；') || '暂无'} />
                </div>
                <div className={styles.panel}>
                  <h3>证据与来源</h3>
                  {evidence.length ? (
                    evidence.slice(0, 5).map((item, index) => (
                      <EvidenceRow item={item} index={index} key={item.id} />
                    ))
                  ) : (
                    <p className={styles.muted}>暂无可读证据</p>
                  )}
                </div>
              </section>
            ),
          },
          {
            key: 'angle',
            label: '内容创作角度',
            children: (
              <section className={styles.workspaceSection}>
                <div className={styles.sectionTitle}>
                  <h2>内容创作角度</h2>
                </div>
                {active.angles.length ? (
                  active.angles.map((item, index) => (
                    <button
                      className={`${styles.angleItem} ${selectedAngleIds.includes(item.id) ? styles.angleSelected : ''}`}
                      key={item.id}
                      type="button"
                      onClick={() => toggleAngle(item.id)}
                    >
                      <h3>0{index + 1} · {item.claim}</h3>
                      <p className={styles.muted}>{item.userValue || item.level || '候选表达方向'}</p>
                      {item.productUrl ? (
                        <a href={item.productUrl} target="_blank" rel="noreferrer">打开承接链接 ↗</a>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <Empty description="暂无推荐角度" />
                )}
              </section>
            ),
          },
          {
            key: 'kitchen',
            label: '内容厨房',
            children: (
              <section className={styles.workspaceSection}>
                <div className={styles.sectionTitle}>
                  <h2>内容厨房</h2>
                </div>
                <div className={styles.panel}>
                  <h3>本次默认制作输入</h3>
                  <InfoRow label="已继承 Angle" value={selectedAngles.map((item) => item.claim).join('；') || active.reason} />
                  <InfoRow label="事实边界" value={active.riskNotes.join('；') || active.missingData.join('；') || '按事件证据和推荐判断生成，不补造事实。'} />
                  <InfoRow label="推荐制作路径" value={`${priorityText(active.priority)} · ${basisText(active.basis)} · ${selectedFormats.join('、')}`} />
                </div>
              </section>
            ),
          },
        ]}
      />

      <Drawer
        title="内容厨房"
        open={kitchenOpen}
        width={520}
        className={styles.kitchenDrawer}
        onClose={() => setKitchenOpen(false)}
        footer={
          <div className={styles.drawerFooter}>
            <div>
              {step > 1 ? <Button onClick={() => setStep((prev) => prev - 1)}>上一步</Button> : null}
              <Button
                type="primary"
                onClick={goNextStep}
              >
                {step === 5 ? '标记采用' : '下一步'}
              </Button>
            </div>
          </div>
        }
      >
        <div className={styles.kitchenLayout}>
          <div className={styles.kitchenFlow}>
            <FlowStep
              index={1}
              title="选择承接角度"
              active={step === 1}
              done={step > 1}
              summary={selectedAngles.map((item) => item.claim).join('；')}
            >
              <p className={styles.muted}>先确定这条内容要承接的角度，后续内容目标、读者和格式都会基于这个角度生成。</p>
              <div className={styles.angleList}>
                {active.angles.length ? (
                  active.angles.map((item, index) => (
                    <button
                      className={`${styles.angleItem} ${styles.angleSelectable} ${
                        selectedAngleIds.includes(item.id) ? styles.angleSelected : ''
                      }`}
                      key={item.id}
                      type="button"
                      onClick={() => toggleAngle(item.id)}
                    >
                      <b>0{index + 1}</b>
                      <p>{item.claim}</p>
                      {item.userValue ? <small className={styles.muted}>{item.userValue}</small> : null}
                    </button>
                  ))
                ) : (
                  <Empty description="暂无推荐角度" />
                )}
              </div>
            </FlowStep>

            {step >= 2 ? (
              <FlowStep
                index={2}
                title="这条内容要做什么"
                active={step === 2}
                done={step > 2}
                summary={selectedGoals.join('、')}
              >
                <ChoiceGrid items={goals} selected={selectedGoals} onClick={toggleGoal} />
              </FlowStep>
            ) : null}

            {step >= 3 ? (
              <FlowStep
              index={3}
              title="给谁看、怎么说"
              active={step === 3}
              done={step > 3}
              summary={selectedReaders.join('、')}
            >
              <ChoiceGrid
                items={readers}
                selected={selectedReaders}
                onClick={toggleReader}
              />
            </FlowStep>
            ) : null}

            {step >= 4 ? (
              <FlowStep
                index={4}
              title="做成什么内容"
              active={step === 4}
              done={step > 4}
              summary={selectedFormats.join('、')}
            >
              <ChoiceGrid
                items={formats}
                selected={selectedFormats}
                onClick={toggleFormat}
              />
              </FlowStep>
            ) : null}

            {step >= 5 ? (
              <FlowStep
                index={5}
                title="生成并修改"
                active={step === 5}
                done={false}
              >
              <Input.TextArea value={draft} autoSize={{ minRows: 10, maxRows: 18 }} onChange={(event) => setDraft(event.target.value)} />
              <div className={styles.aiBox}>
                <h3>
                  AI 修改内容
                  <span>选中文字段后修改局部；未选择时修改全文。</span>
                </h3>
                <div className={styles.filters}>
                  {revisionPrompts.map((item) => (
                    <button
                      className={`${styles.chip} ${revisionPrompt === item ? styles.chipActive : ''}`}
                      key={item}
                      type="button"
                      onClick={() => setRevisionPrompt(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className={styles.muted}>选择快捷指令或输入要求，发送后会生成可应用或忽略的建议。</p>
                <div className={styles.aiInputRow}>
                  <Input
                    value={revisionPrompt}
                    onChange={(event) => setRevisionPrompt(event.target.value)}
                    placeholder="输入修改要求，例如：改成更适合产品经理阅读"
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      if (!revisionPrompt.trim()) {
                        message.warning('请先选择快捷指令或输入修改要求')
                        return
                      }
                      message.info('AI 修改接口后续接入')
                    }}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </FlowStep>
            ) : null}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <b>{label}</b>
      <span>{value}</span>
    </div>
  )
}

function FlowStep({
  index,
  title,
  active,
  done,
  summary,
  children,
}: {
  index: number
  title: string
  active: boolean
  done: boolean
  summary?: string
  children: ReactNode
}) {
  return (
    <section className={`${styles.flowStep} ${active ? styles.flowStepActive : ''} ${done ? styles.flowStepDone : ''}`}>
      <div className={styles.flowMarker}>{index}</div>
      <div className={styles.flowContent}>
        <div className={styles.flowHead}>
          <h2>{title}</h2>
          {done && summary ? <span>{summary}</span> : null}
        </div>
        {active ? <div className={styles.flowBody}>{children}</div> : null}
      </div>
    </section>
  )
}

function EvidenceRow({ item, index }: { item: DisplayEvidence; index: number }) {
  return (
    <div className={styles.infoRow}>
      <b>Evidence {index + 1}</b>
      <span>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title || item.sourceName || '查看原始链接'} ↗
          </a>
        ) : (
          item.title || item.summary || item.sourceName || '未解析证据'
        )}
        <small className={styles.muted}>{item.summary}</small>
      </span>
    </div>
  )
}

function ChoiceGrid({
  items,
  selected,
  onClick,
}: {
  items: string[]
  selected: string[]
  onClick: (item: string) => void
}) {
  return (
    <div className={styles.choiceGrid}>
      {items.map((item) => (
        <button className={`${styles.selectCard} ${selected.includes(item) ? styles.selectCardActive : ''}`} key={item} type="button" onClick={() => onClick(item)}>
          {selected.includes(item) ? <CheckOutlined /> : null}
          <h3>{item}</h3>
          <p>生成后可继续编辑或派生</p>
        </button>
      ))}
    </div>
  )
}

type DisplayEvidence = OperationRecommendationEvidence & {
  id: string
}

function buildEvidence(item: OperationRecommendation): DisplayEvidence[] {
  const resolved: DisplayEvidence[] = (item.evidenceItems ?? []).map((evidence) => ({
    ...evidence,
    id: evidence.id,
  }))
  const resolvedIds = new Set(resolved.map((evidence) => evidence.id))
  const missingEvidence = item.evidenceRefs
    .filter((id) => !resolvedIds.has(id))
    .map((id): DisplayEvidence => ({
      id,
      sourceType: 'unknown',
      sourceName: '未解析证据',
      title: '未解析证据',
      summary: `证据 ${id} 暂未解析到原文或来源。`,
      observedAt: item.updatedAt,
      confidence: item.confidence,
    }))
  const predxSource = item.predxNewsItem?.sourceUrl
    ? [
        {
          id: `predx-news-${item.predxNewsItem.sourceUrl}`,
          sourceType: 'predx_news',
          sourceName: item.predxNewsItem.sourceName || 'PredX 新闻',
          title: item.predxNewsItem.newsTitle || item.predxNewsItem.title,
          summary: item.predxNewsItem.title,
          url: item.predxNewsItem.sourceUrl,
          publishedAt: item.predxNewsItem.publishedAt,
          observedAt: item.updatedAt,
          confidence: item.confidence,
        } satisfies DisplayEvidence,
      ]
    : []
  const predxMarket = item.predxNewsItem?.primaryMarketUrl
    ? [
        {
          id: `predx-market-${item.predxNewsItem.primaryMarketUrl}`,
          sourceType: 'predx_market',
          sourceName: 'PredX 市场',
          title: item.predxNewsItem.primaryMarketTitle || '匹配的 PredX 市场',
          summary: item.productAssociationRationale,
          url: item.predxNewsItem.primaryMarketUrl,
          observedAt: item.updatedAt,
          confidence: item.confidence,
        } satisfies DisplayEvidence,
      ]
    : []
  return [...resolved, ...missingEvidence, ...predxSource, ...predxMarket]
}

function basisText(basis: OperationRecommendation['basis']) {
  if (basis === 'heat') return '公共热度'
  if (basis === 'market') return '实时市场'
  return '产品价值'
}

function priorityText(priority: OperationRecommendation['priority']) {
  return priority === 'immediate' ? '立即响应' : '今日处理'
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function buildInitialDraft(item: OperationRecommendation, angles: string[]): string {
  return [
    angles.length ? `选题角度：${angles.join('；')}` : null,
    `事件摘要：${item.summary}`,
    `推荐原因：${item.reason}`,
    item.productAssociationRationale ? `承接判断：${item.productAssociationRationale}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')
}
