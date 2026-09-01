import { useEffect, useMemo, useState } from 'react'
import { Button, Drawer, Empty, Input, Spin, Tag, message } from 'antd'
import { ImportOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons'
import {
  adoptEditedOperationRecommendation,
  adoptOperationRecommendation,
  listOperationRecommendations,
  rejectOperationRecommendation,
  runOperationRecommendations,
  type OperationRecommendation,
  type OperationRecommendationBasis,
  type OperationRecommendationPriority,
} from '../../api'
import styles from './Decision.module.css'

const basisFilters: { key: OperationRecommendationBasis | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'heat', label: '公共热度' },
  { key: 'market', label: '实时市场' },
  { key: 'product', label: '产品价值' },
]

const priorityFilters: { key: OperationRecommendationPriority | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'immediate', label: '立即响应' },
  { key: 'today', label: '今日处理' },
]

function priorityText(priority: OperationRecommendationPriority) {
  return priority === 'immediate' ? '立即响应' : '今日处理'
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function DecisionRecommendations() {
  const [basis, setBasis] = useState<OperationRecommendationBasis | 'all'>('all')
  const [priority, setPriority] = useState<OperationRecommendationPriority | 'all'>('all')
  const [items, setItems] = useState<OperationRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [actioning, setActioning] = useState(false)
  const [active, setActive] = useState<OperationRecommendation | null>(null)
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null)
  const [editingAdopt, setEditingAdopt] = useState(false)
  const [editedAngle, setEditedAngle] = useState('')

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (basis === 'all' || item.basis === basis) &&
          (priority === 'all' || item.priority === priority),
      ),
    [basis, items, priority],
  )

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listOperationRecommendations({ take: 50 }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '选题推荐加载失败')
    } finally {
      setLoading(false)
    }
  }

  const run = async () => {
    setRunning(true)
    try {
      const result = await runOperationRecommendations()
      message.success(`已生成 ${result.generatedCount} 条选题推荐`)
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '生成选题推荐失败')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const firstAngle = active?.angles[0]
    setSelectedAngleId(firstAngle?.id ?? null)
    setEditedAngle(firstAngle?.claim ?? '')
    setEditingAdopt(false)
  }, [active])

  const selectedAngle = active?.angles.find((item) => item.id === selectedAngleId)

  const adoptSelected = async () => {
    if (!active || !selectedAngleId) {
      message.warning('请先选择一个承接角度')
      return
    }
    setActioning(true)
    try {
      await adoptOperationRecommendation(active.id, { angleId: selectedAngleId })
      message.success('已采用，并流转到决策记录')
      setActive(null)
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '采用失败')
    } finally {
      setActioning(false)
    }
  }

  const adoptEdited = async () => {
    if (!active) return
    if (!editedAngle.trim()) {
      message.warning('请填写修改后的承接角度')
      return
    }
    setActioning(true)
    try {
      await adoptEditedOperationRecommendation(active.id, {
        angleId: selectedAngleId ?? undefined,
        finalAngle: editedAngle,
      })
      message.success('已保存修改，并流转到决策记录')
      setActive(null)
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存采用失败')
    } finally {
      setActioning(false)
    }
  }

  const rejectAll = async () => {
    if (!active) return
    setActioning(true)
    try {
      await rejectOperationRecommendation(active.id, { note: '运营判断本次不采用。' })
      message.success('已记录为不采用')
      setActive(null)
      await load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '拒绝失败')
    } finally {
      setActioning(false)
    }
  }

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>OPPORTUNITY DECISION</div>
      <div className={styles.head}>
        <div>
          <h1>选题推荐</h1>
          <p>只呈现已通过准入判断的事件；点击任一选题查看证据、产品承接与候选角度。</p>
        </div>
        <div className={styles.headActions}>
          <Button className={styles.exportButton} icon={<ReloadOutlined />} loading={running} onClick={run}>
            生成推荐
          </Button>
          <Button className={styles.headButton} type="primary" icon={<ImportOutlined />} href="/decision/inbox">
            导入事件上下文
          </Button>
        </div>
      </div>

      <section className={styles.metrics}>
        <Metric value={visible.length} label="今日推荐" />
        <div className={`${styles.metric} ${styles.metricRed}`}>
          <strong>{items.filter((item) => item.basis === 'heat').length}</strong>
          <span>公共热度</span>
        </div>
        <Metric value={items.filter((item) => item.basis === 'market').length} label="实时市场承接" />
        <Metric value={items.filter((item) => item.basis === 'product').length} label="产品价值承接" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>推荐依据</div>
          <div className={styles.filters}>
          <b>推荐依据</b>
          {basisFilters.map((item) => (
            <button
              className={`${styles.chip} ${basis === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setBasis(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>处理节奏</div>
          <div className={styles.filters}>
          <b>处理节奏</b>
          {priorityFilters.map((item) => (
            <button
              className={`${styles.chip} ${priority === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setPriority(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
      </section>

      <div className={styles.sectionTitle}>
        <h2>优先处理</h2>
        <span>卡片直接呈现推荐依据与承接对象</span>
      </div>

      <Spin spinning={loading}>
      {visible.length ? (
        <section className={styles.cards}>
          {visible.map((item) => (
            <article className={styles.recommendCard} key={item.id} onClick={() => setActive(item)}>
              <div className={styles.cardTop}>
                <div className={styles.tagrow}>
                  {item.recommendationLabels.map((label) => (
                    <Tag color="cyan" key={label}>{label}</Tag>
                  ))}
                </div>
                <span className={styles.muted}>{formatAge(item.createdAt)}</span>
              </div>
              <h3>{item.title}</h3>
              <p className={styles.summary}>{item.summary}</p>
              <div className={styles.reason}>
                <b>推荐原因：</b>{item.reason}
              </div>
              <div className={styles.bridge}>
                <b>承接判断：</b>{item.productAssociationRationale}
              </div>
              <div className={styles.anglePreview}>建议优先探索：{item.angles[0]?.claim ?? '等待补充候选角度'}</div>
              <div className={styles.cardFoot}>
                <span className={styles.window}>{priorityText(item.priority)}</span>
                <Button className={styles.ghostButton} icon={<RightOutlined />}>查看判断</Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <Empty description="暂无选题推荐，点击生成推荐从最近热点和 PredX 新闻中提取" />
      )}
      </Spin>

      <Drawer
        title={active?.title}
        open={active != null}
        width={560}
        onClose={() => setActive(null)}
        extra={<span className={styles.muted}>{active ? formatAge(active.createdAt) : ''}</span>}
        footer={
          active ? (
            <div className={styles.drawerFooter}>
              <div>
                <Button type="primary" loading={actioning} onClick={adoptSelected}>
                  直接采用
                </Button>
                <Button loading={actioning} onClick={() => setEditingAdopt(true)}>
                  修改后采用
                </Button>
              </div>
              <div>
                <Button onClick={() => message.info('重新推荐能力后续接入 Agent 重跑')}>
                  重新推荐
                </Button>
                <Button danger loading={actioning} onClick={rejectAll}>
                  全部不采用
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {active ? (
          <>
            <section className={styles.drawerSection}>
              <div className={styles.tagrow}>
                {active.recommendationLabels.map((label) => (
                  <Tag color="cyan" key={label}>{label}</Tag>
                ))}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>事件上下文摘要</h3>
              <p>{active.summary}</p>
            </section>
            <section className={styles.drawerSection}>
              <h3>为什么进入选题推荐</h3>
              <div className={styles.reason}>{active.reason}</div>
              <span className={styles.muted}>处理节奏：{priorityText(active.priority)}</span>
            </section>
            <section className={styles.drawerSection}>
              <h3>PredX 承接判断</h3>
              <div className={styles.bridge}>
                <b>{active.productAssociationLevel}</b>
                <p>{active.productAssociationRationale}</p>
                {active.recommendedProductUrl ? (
                  <a href={active.recommendedProductUrl} target="_blank" rel="noreferrer">
                    打开推荐链接
                  </a>
                ) : null}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>关键证据</h3>
              <div className={styles.angleList}>
                {buildEvidence(active).map((item, index) => (
                  <div className={styles.angleItem} key={item}>
                    <b>Evidence {index + 1}</b>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>可承接角度</h3>
              <div className={styles.angleList}>
                {active.angles.map((item, index) => (
                  <button
                    className={`${styles.angleItem} ${styles.angleSelectable} ${
                      selectedAngleId === item.id ? styles.angleSelected : ''
                    }`}
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedAngleId(item.id)
                      setEditedAngle(item.claim)
                    }}
                  >
                    <b>0{index + 1}</b>
                    <p>{item.claim}</p>
                    {item.userValue ? <small className={styles.muted}>{item.userValue}</small> : null}
                  </button>
                ))}
              </div>
            </section>
            {editingAdopt ? (
              <section className={`${styles.drawerSection} ${styles.editAdoptPanel}`}>
                <div className={styles.between}>
                  <h3>修改后采用</h3>
                  <Button type="text" onClick={() => setEditingAdopt(false)}>关闭</Button>
                </div>
                <p className={styles.muted}>修改最终角度后保存，系统将计入“修改后采用”。</p>
                <label className={styles.fieldLabel}>修改后的最终角度</label>
                <Input.TextArea
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  value={editedAngle}
                  onChange={(event) => setEditedAngle(event.target.value)}
                  placeholder={selectedAngle?.claim ?? '填写最终采用的承接角度'}
                />
                <div className={styles.editActions}>
                  <Button onClick={() => setEditingAdopt(false)}>取消</Button>
                  <Button type="primary" loading={actioning} onClick={adoptEdited}>
                    保存并采用
                  </Button>
                </div>
              </section>
            ) : null}
            <section className={styles.drawerSection}>
              <h3>风险提示</h3>
              <p className={styles.muted}>{active.riskNotes.join('；') || '暂无风险提示'}</p>
            </section>
          </>
        ) : null}
      </Drawer>
    </div>
  )
}

function formatAge(iso: string): string {
  const time = new Date(iso).getTime()
  const diff = Date.now() - time
  if (!Number.isFinite(time) || diff < 0) return '刚刚'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function buildEvidence(item: OperationRecommendation): string[] {
  const evidence = [...item.evidenceRefs]
  if (item.predxNewsItem?.sourceUrl) evidence.push(item.predxNewsItem.sourceUrl)
  if (item.predxNewsItem?.primaryMarketUrl) evidence.push(item.predxNewsItem.primaryMarketUrl)
  return evidence
}
