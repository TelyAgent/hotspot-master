import { useMemo, useState } from 'react'
import { Button, Drawer, Empty, Tag } from 'antd'
import { ImportOutlined, RightOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'
import {
  recommendations,
  type DecisionPriority,
  type DecisionRecommendation,
  type RecommendationBasis,
} from './decisionData'

const basisFilters: { key: RecommendationBasis | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'heat', label: '公共热度' },
  { key: 'market', label: '实时市场' },
  { key: 'product', label: '产品价值' },
]

const priorityFilters: { key: DecisionPriority | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'immediate', label: '立即响应' },
  { key: 'today', label: '今日处理' },
]

function priorityText(priority: DecisionPriority) {
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
  const [basis, setBasis] = useState<RecommendationBasis | 'all'>('all')
  const [priority, setPriority] = useState<DecisionPriority | 'all'>('all')
  const [active, setActive] = useState<DecisionRecommendation | null>(null)

  const visible = useMemo(
    () =>
      recommendations.filter(
        (item) =>
          (basis === 'all' || item.basis === basis) &&
          (priority === 'all' || item.priority === priority),
      ),
    [basis, priority],
  )

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>OPPORTUNITY DECISION</div>
      <div className={styles.head}>
        <div>
          <h1>选题推荐</h1>
          <p>只呈现已通过准入判断的事件；点击任一选题查看证据、产品承接与候选角度。</p>
        </div>
        <Button className={styles.headButton} type="primary" icon={<ImportOutlined />} href="/decision/inbox">
          导入事件上下文
        </Button>
      </div>

      <section className={styles.metrics}>
        <Metric value={visible.length} label="今日推荐" />
        <div className={`${styles.metric} ${styles.metricRed}`}>
          <strong>{recommendations.filter((item) => item.basis === 'heat').length}</strong>
          <span>公共热度</span>
        </div>
        <Metric value={recommendations.filter((item) => item.basis === 'market').length} label="实时市场承接" />
        <Metric value={recommendations.filter((item) => item.basis === 'product').length} label="产品价值承接" />
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

      {visible.length ? (
        <section className={styles.cards}>
          {visible.map((item) => (
            <article className={styles.recommendCard} key={item.id} onClick={() => setActive(item)}>
              <div className={styles.cardTop}>
                <div className={styles.tagrow}>
                  {item.labels.map((label) => (
                    <Tag color="cyan" key={label}>{label}</Tag>
                  ))}
                </div>
                <span className={styles.muted}>{item.age}</span>
              </div>
              <h3>{item.title}</h3>
              <p className={styles.summary}>{item.summary}</p>
              <div className={styles.reason}>
                <b>推荐原因：</b>{item.reason}
              </div>
              <div className={styles.bridge}>
                <b>承接判断：</b>{item.productBridge}
              </div>
              <div className={styles.anglePreview}>建议优先探索：{item.angles[0]}</div>
              <div className={styles.cardFoot}>
                <span className={styles.window}>{priorityText(item.priority)}</span>
                <Button className={styles.ghostButton} icon={<RightOutlined />}>查看判断</Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <Empty description="没有符合当前筛选条件的选题" />
      )}

      <Drawer
        title={active?.title}
        open={active != null}
        width={560}
        onClose={() => setActive(null)}
        extra={<span className={styles.muted}>{active?.age}</span>}
      >
        {active ? (
          <>
            <section className={styles.drawerSection}>
              <div className={styles.tagrow}>
                {active.labels.map((label) => (
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
              <div className={styles.bridge}>{active.productBridge}</div>
            </section>
            <section className={styles.drawerSection}>
              <h3>关键证据</h3>
              <div className={styles.angleList}>
                {active.evidence.map((item, index) => (
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
                  <div className={styles.angleItem} key={item}>
                    <b>0{index + 1}</b>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.drawerSection}>
              <h3>风险提示</h3>
              <p className={styles.muted}>{active.risk}</p>
            </section>
          </>
        ) : null}
      </Drawer>
    </div>
  )
}
