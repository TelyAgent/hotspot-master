import { useEffect, useMemo, useState } from 'react'
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

export default function CreationWorkspace() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const recommendationId = params.get('recommendation')
  const [items, setItems] = useState<OperationRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [kitchenOpen, setKitchenOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedGoals, setSelectedGoals] = useState(['把事情讲清楚', '提供有用判断'])
  const [selectedReader, setSelectedReader] = useState('AI 开发者')
  const [format, setFormat] = useState('X Thread')
  const [draft, setDraft] = useState('')

  const active = useMemo(
    () => items.find((item) => item.id === recommendationId) ?? items[0] ?? null,
    [items, recommendationId],
  )
  const selectedAngle = active?.angles[0]
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
    if (active) setDraft(buildInitialDraft(active))
  }, [active])

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goal)) return prev.length === 1 ? prev : prev.filter((item) => item !== goal)
      if (prev.length >= 3) {
        message.warning('最多选择 3 个目标')
        return prev
      }
      return [...prev, goal]
    })
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
                  <Button>重新推荐</Button>
                </div>
                {active.angles.length ? (
                  active.angles.map((item, index) => (
                    <article className={`${styles.angleItem} ${index === 0 ? styles.angleSelected : ''}`} key={item.id}>
                      <h3>0{index + 1} · {item.claim}</h3>
                      <p className={styles.muted}>{item.userValue || item.level || '候选表达方向'}</p>
                      {item.productUrl ? (
                        <a href={item.productUrl} target="_blank" rel="noreferrer">打开承接链接 ↗</a>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <Empty description="暂无推荐角度" />
                )}
                <div className={styles.editActions}>
                  <Button>暂不采用</Button>
                  <Button>修改后采用</Button>
                  <Button type="primary" onClick={() => setKitchenOpen(true)}>直接采用并制作</Button>
                </div>
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
                  <Button type="primary" onClick={() => setKitchenOpen(true)}>打开内容厨房</Button>
                </div>
                <div className={styles.panel}>
                  <h3>本次默认制作输入</h3>
                  <InfoRow label="已继承 Angle" value={selectedAngle?.claim ?? active.reason} />
                  <InfoRow label="事实边界" value={active.riskNotes.join('；') || active.missingData.join('；') || '按事件证据和推荐判断生成，不补造事实。'} />
                  <InfoRow label="推荐制作路径" value={`${priorityText(active.priority)} · ${basisText(active.basis)} · ${format}`} />
                </div>
              </section>
            ),
          },
        ]}
      />

      <Drawer
        title="内容厨房"
        open={kitchenOpen}
        width="100%"
        className={styles.kitchenDrawer}
        onClose={() => setKitchenOpen(false)}
        footer={
          <div className={styles.drawerFooter}>
            <Button onClick={() => setKitchenOpen(false)}>保存并退出</Button>
            <div>
              {step > 1 ? <Button onClick={() => setStep((prev) => prev - 1)}>上一步</Button> : null}
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={() => {
                  if (step < 4) setStep((prev) => prev + 1)
                  else {
                    setKitchenOpen(false)
                    navigate('/decision/publish')
                  }
                }}
              >
                {step === 4 ? '标记采用' : '下一步'}
              </Button>
            </div>
          </div>
        }
      >
        <div className={styles.kitchenLayout}>
          <div>
            <div className={styles.kitchenSteps}>
              {['这条内容要做什么', '给谁看、怎么说', '做成什么内容', '生成并修改'].map((item, index) => (
                <button className={step === index + 1 ? styles.kitchenStepActive : ''} key={item} type="button" onClick={() => setStep(index + 1)}>
                  {index + 1} {item}
                </button>
              ))}
            </div>
            {step === 1 ? (
              <ChoiceGrid title="发这条内容，你最想实现什么？" items={goals} selected={selectedGoals} onClick={toggleGoal} />
            ) : step === 2 ? (
              <ChoiceGrid title="这条内容说给谁听？" items={readers} selected={[selectedReader]} onClick={setSelectedReader} />
            ) : step === 3 ? (
              <ChoiceGrid title="想做成什么内容？" items={formats} selected={[format]} onClick={setFormat} />
            ) : (
              <section className={styles.workspaceSection}>
                <h2>生成并修改内容</h2>
                <Input.TextArea value={draft} autoSize={{ minRows: 10, maxRows: 18 }} onChange={(event) => setDraft(event.target.value)} />
                <div className={styles.aiBox}>
                  <h3>AI 修改内容</h3>
                  <div className={styles.filters}>
                    {['开头更直接', '压缩篇幅', '加强判断', '调整语气', '检查事实边界'].map((item) => (
                      <button className={styles.chip} key={item} type="button">{item}</button>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
          <aside className={styles.summaryPanel}>
            <h3>本次制作</h3>
            <InfoRow label="已继承角度" value={selectedAngle?.claim ?? active.reason} />
            <InfoRow label="主要目标" value={selectedGoals[0]} />
            <InfoRow label="目标读者" value={selectedReader} />
            <InfoRow label="表达人设" value="快讯账号" />
            <InfoRow label="主要成品" value={format} />
          </aside>
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
  title,
  items,
  selected,
  onClick,
}: {
  title: string
  items: string[]
  selected: string[]
  onClick: (item: string) => void
}) {
  return (
    <section className={styles.workspaceSection}>
      <h2>{title}</h2>
      <div className={styles.choiceGrid}>
        {items.map((item) => (
          <button className={`${styles.selectCard} ${selected.includes(item) ? styles.selectCardActive : ''}`} key={item} type="button" onClick={() => onClick(item)}>
            {selected.includes(item) ? <CheckOutlined /> : null}
            <h3>{item}</h3>
            <p>生成后可继续编辑或派生</p>
          </button>
        ))}
      </div>
    </section>
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

function buildInitialDraft(item: OperationRecommendation): string {
  const angle = item.angles[0]?.claim
  return [
    angle ? `选题角度：${angle}` : null,
    `事件摘要：${item.summary}`,
    `推荐原因：${item.reason}`,
    item.productAssociationRationale ? `承接判断：${item.productAssociationRationale}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')
}
