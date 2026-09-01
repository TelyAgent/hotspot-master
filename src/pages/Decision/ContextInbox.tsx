import { useMemo, useState } from 'react'
import { Button, Drawer, Empty, Tag, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import styles from './Decision.module.css'
import { inboxItems, type ContextInboxItem } from './decisionData'

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待解析' },
  { key: 'working', label: '研判中' },
  { key: 'missing', label: '需要补充' },
  { key: 'done', label: '研判完成' },
] as const

function statusClass(status: ContextInboxItem['status']) {
  if (status === 'done') return styles.statusOk
  if (status === 'missing') return styles.statusBad
  return styles.statusWarn
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function DecisionContextInbox() {
  const [items, setItems] = useState(inboxItems)
  const [status, setStatus] = useState<(typeof statusFilters)[number]['key']>('all')
  const [active, setActive] = useState<ContextInboxItem | null>(null)
  const [text, setText] = useState('')
  const [source, setSource] = useState('')

  const visible = useMemo(
    () => items.filter((item) => status === 'all' || item.status === status),
    [items, status],
  )

  const submit = () => {
    const content = text.trim()
    if (!content) {
      message.warning('请先粘贴事件上下文')
      return
    }
    const next: ContextInboxItem = {
      id: `ctx-${Date.now()}`,
      title: content.slice(0, 34) + (content.length > 34 ? '...' : ''),
      source: source.trim() || '人工提交',
      quality: '待判断',
      status: 'pending',
      statusText: '待解析',
      conclusion: '待判断',
      receivedAt: '刚刚',
      summary: '已进入上下文收件箱，等待 Agent 抽取主体、动作、时间、结果与热度信号。',
    }
    setItems((prev) => [next, ...prev])
    setText('')
    setSource('')
    message.success('上下文已进入收件箱')
  }

  return (
    <div className={styles.decisionPage}>
      <div className={styles.eyebrow}>CONTEXT INTAKE</div>
      <div className={styles.head}>
        <div>
          <h1>上下文收件箱</h1>
          <p>接收任意来源的非结构化或结构化事件上下文，先理解与补全，再进行准入判断。</p>
        </div>
        <Button className={styles.headButton} type="primary">完整提交</Button>
      </div>

      <section className={styles.metrics}>
        <Metric value={items.length} label="全部上下文" />
        <Metric value={items.filter((item) => item.status === 'pending').length} label="待解析" />
        <Metric value={items.filter((item) => item.status === 'working').length} label="研判中" />
        <Metric value={items.filter((item) => item.status === 'missing').length} label="需要补充" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>处理状态</div>
          <div className={styles.filters}>
          <b>处理状态</b>
          {statusFilters.map((item) => (
            <button
              className={`${styles.chip} ${status === item.key ? styles.chipActive : ''}`}
              key={item.key}
              type="button"
              onClick={() => setStatus(item.key)}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
        <div className={styles.filterRow}>
          <div className={styles.filterLabel}>研判结论</div>
          <div className={styles.filters}>
            {['全部', '已进入推荐', '暂不推荐'].map((item, index) => (
              <button className={`${styles.chip} ${index === 0 ? styles.chipActive : ''}`} key={item} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.inboxGrid}>
        <div className={styles.tablePanel}>
          <div className={styles.tableHead}>
            <span>事件上下文</span>
            <span>来源</span>
            <span>可判断性</span>
            <span>状态</span>
            <span>接收时间</span>
          </div>
          {visible.length ? (
            visible.map((item) => (
              <button className={`${styles.tableRow} ${styles.tableButton}`} key={item.id} type="button" onClick={() => setActive(item)}>
                <span>
                  <b>{item.title}</b>
                  <small>{item.summary}</small>
                </span>
                <span>{item.source}</span>
                <span>{item.quality}</span>
                <span className={statusClass(item.status)}>{item.statusText}</span>
                <span>{item.receivedAt}</span>
              </button>
            ))
          ) : (
            <Empty description="当前筛选下没有上下文" />
          )}
        </div>

        <aside className={`${styles.panel} ${styles.quickPanel}`}>
          <h2>快速导入</h2>
          <p className={styles.muted}>直接粘贴你拥有的内容，格式不需要规范。</p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <textarea
              value={text}
              placeholder="粘贴事件描述、原文、已有判断或相关讨论..."
              onChange={(event) => setText(event.target.value)}
            />
            <input value={source} placeholder="来源链接或来源名称（选填）" onChange={(event) => setSource(event.target.value)} />
            <Button className={styles.headButton} type="primary" htmlType="submit" icon={<SendOutlined />}>
              交给 Agent 判断
            </Button>
          </form>
          <div className={styles.contextResult}>
            <b>进入收件箱后会先做结构化理解</b>
            <br />
            <span>抽取主体、动作、时间、结果与热度信号后，再进入推荐准入判断。</span>
          </div>
        </aside>
      </section>

      <Drawer title="上下文解析状态" open={active != null} width={520} onClose={() => setActive(null)}>
        {active ? (
          <div className={styles.drawerSection}>
            <Tag color={active.status === 'done' ? 'green' : active.status === 'missing' ? 'red' : 'orange'}>
              {active.statusText}
            </Tag>
            <h3>{active.title}</h3>
            <p>{active.summary}</p>
            <div className={styles.angleItem}>来源：{active.source}</div>
            <div className={styles.angleItem}>可判断性：{active.quality}</div>
            <div className={styles.angleItem}>研判结论：{active.conclusion}</div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
