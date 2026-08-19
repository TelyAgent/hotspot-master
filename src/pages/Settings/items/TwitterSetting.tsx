import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
  type TopicTrackingConfig,
} from '../../../api/collectionConfig'
import { useApp } from '../../../context/AppContext'
import { SettingRow } from '../SettingRow'
import styles from '../Settings.module.css'

const REGION_OPTIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']

const FREQUENCY_OPTIONS = [
  { label: '每 1 小时', value: '0 */1 * * *' },
  { label: '每 2 小时', value: '0 */2 * * *' },
  { label: '每 4 小时', value: '0 */4 * * *' },
  { label: '每 6 小时', value: '0 */6 * * *' },
]

export default function TwitterSetting() {
  const { openModal, closeModal, toast } = useApp()
  const formRef = useRef<TopicConfigFormHandle>(null)
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequency, setFrequency] = useState('0 */2 * * *')
  const [workflowId, setWorkflowId] = useState('x-trend-event-formation')
  const [topics, setTopics] = useState<TopicTrackingConfig[]>([])

  const frequencyLabel = useMemo(
    () => FREQUENCY_OPTIONS.find((item) => item.value === frequency)?.label ?? frequency,
    [frequency],
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const nextConfig = await getPlatformCollectionConfig('x')
        if (!mounted) return
        setConfig(nextConfig)
        setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
        setFrequency(nextConfig.variables.trendCollectionCron ?? '0 */2 * * *')
        setWorkflowId(nextConfig.variables.trendEventWorkflowId ?? 'x-trend-event-formation')
        setTopics(normalizeTopicConfigs(nextConfig))
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : '加载 Twitter 配置失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [])

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((item) => item !== region) : [...prev, region],
    )
  }

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      const flattened = flattenTopicConfigs(topics)
      const nextVariables = {
        ...config.variables,
        regions,
        trendCollectionCron: frequency,
        trendEventWorkflowId: workflowId,
        topicConfigs: topics,
        topicKeywords: flattened.topicKeywords,
        topicNegativeKeywords: flattened.topicNegativeKeywords,
        monitoredAccounts: flattened.monitoredAccounts,
      }
      const nextConfig = await updatePlatformCollectionConfig('x', {
        defaultRegions: regions,
        variables: nextVariables,
      })
      setConfig(nextConfig)
      toast('Twitter 配置已保存')
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存 Twitter 配置失败')
    } finally {
      setSaving(false)
    }
  }

  const openTopicConfig = (topic?: TopicTrackingConfig, index?: number) => {
    openModal(
      `${topic ? '配置' : '新增'} · 重点主题`,
      <TopicConfigForm
        ref={formRef}
        topic={topic}
        defaultPostLimit={config?.variables.defaultPostLimit ?? 30}
      />,
      false,
      'large',
      {
        label: '保存',
        onConfirm: () => {
          const next = formRef.current?.snapshot()
          if (!next) {
            toast('请输入主题名称')
            return
          }
          setTopics((prev) => {
            if (typeof index === 'number') {
              return prev.map((item, i) => (i === index ? next : item))
            }
            return [...prev, next]
          })
          closeModal()
        },
      },
    )
  }

  if (loading) {
    return <section className={styles.settingPanel}><div className="note">正在加载 Twitter 配置…</div></section>
  }

  if (error) {
    return <section className={styles.settingPanel}><div className="note warning">加载失败：{error}</div></section>
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>Twitter 配置</h2>
            <p className="small">X 热搜榜采集、榜单形成 Event 工作流、重点主题追踪。</p>
          </div>
          <button className="btn primary" onClick={save} disabled={saving || regions.length === 0}>
            {saving ? '保存中…' : '保存配置'}
          </button>
        </div>
      </div>

      <div className={styles.twitterGrid}>
        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>获取榜单的时间频率</h3>
              <p className="small">保存后由服务端同步到 X 榜单采集任务。</p>
            </div>
            <span className="pill green">{frequencyLabel}</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>采集频率</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {FREQUENCY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>榜单条数</label>
              <input value={config?.variables.defaultTrendLimit ?? 30} readOnly />
            </div>
          </div>
          <div className={styles.regionList}>
            {REGION_OPTIONS.map((region) => (
              <label key={region} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={regions.includes(region)}
                  onChange={() => toggleRegion(region)}
                />
                <span>{region}</span>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>榜单形成事件的工作流</h3>
              <p className="small">采集成功形成快照后自动触发。</p>
            </div>
            <span className="pill green">启用</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>工作流</label>
              <input value={workflowId} onChange={(e) => setWorkflowId(e.target.value)} />
            </div>
          </div>
        </section>

        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>重点主题追踪配置</h3>
              <p className="small">点击主题行配置语义、正反例、账号和主题圈工作流。</p>
            </div>
            <button type="button" className="btn" onClick={() => openTopicConfig()}>
              +新增主题
            </button>
          </div>
          {topics.length === 0 ? (
            <div className="note">暂无重点主题配置</div>
          ) : (
            topics.map((topic, index) => (
              <SettingRow
                key={topic.id}
                name={topic.name}
                desc={`${topic.keywords.length} 个关键词 / ${topic.accounts.length} 个关注账号`}
                status={topic.enabled ? '启用' : '停用'}
                middle={topic.workflowId}
                actionLabel="配置/修改"
                onEdit={() => openTopicConfig(topic, index)}
              />
            ))
          )}
        </section>
      </div>
    </section>
  )
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeTopicConfigs(config: PlatformCollectionConfig): TopicTrackingConfig[] {
  const configured = config.variables.topicConfigs
  if (configured?.length) {
    return configured.map((topic) => ({
      ...topic,
      keywords: topic.keywords ?? [],
      positiveExamples: topic.positiveExamples ?? [],
      negativeExamples: topic.negativeExamples ?? [],
      accounts: topic.accounts ?? [],
      action: topic.action || '立即自动响应',
      collectionFrequency: topic.collectionFrequency || '每 3 小时',
      workflowId: topic.workflowId || 'x-topic-circle-event-formation',
      defaultPostLimit: topic.defaultPostLimit ?? config.variables.defaultPostLimit ?? 30,
    }))
  }

  const hasLegacyTopic =
    (config.variables.topicKeywords?.length ?? 0) > 0 ||
    (config.variables.topicNegativeKeywords?.length ?? 0) > 0 ||
    (config.variables.monitoredAccounts?.length ?? 0) > 0

  if (!hasLegacyTopic) return []

  return [
    {
      id: 'topic-default',
      name: '默认重点主题',
      enabled: true,
      keywords: config.variables.topicKeywords ?? [],
      positiveExamples: [],
      negativeExamples: config.variables.topicNegativeKeywords ?? [],
      action: '立即自动响应',
      accounts: config.variables.monitoredAccounts ?? [],
      collectionFrequency: '每 3 小时',
      workflowId: 'x-topic-circle-event-formation',
      defaultPostLimit: config.variables.defaultPostLimit ?? 30,
    },
  ]
}

function flattenTopicConfigs(topics: TopicTrackingConfig[]) {
  const enabledTopics = topics.filter((topic) => topic.enabled)

  return {
    topicKeywords: unique(enabledTopics.flatMap((topic) => topic.keywords)),
    topicNegativeKeywords: unique(enabledTopics.flatMap((topic) => topic.negativeExamples)),
    monitoredAccounts: unique(enabledTopics.flatMap((topic) => topic.accounts)),
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

function createTopicId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')

  return `topic-${slug || 'custom'}-${Date.now()}`
}

interface TopicConfigFormHandle {
  snapshot: () => TopicTrackingConfig | null
}

const TopicConfigForm = forwardRef<
  TopicConfigFormHandle,
  {
    topic?: TopicTrackingConfig
    defaultPostLimit: number
  }
>(({ topic, defaultPostLimit }, ref) => {
  const [name, setName] = useState(topic?.name ?? '')
  const [enabled, setEnabled] = useState(topic?.enabled ?? true)
  const [keywords, setKeywords] = useState((topic?.keywords ?? []).join('\n'))
  const [positiveExamples, setPositiveExamples] = useState((topic?.positiveExamples ?? []).join('\n'))
  const [negativeExamples, setNegativeExamples] = useState((topic?.negativeExamples ?? []).join('\n'))
  const [accounts, setAccounts] = useState<string[]>(topic?.accounts?.length ? topic.accounts : [''])
  const [postLimit, setPostLimit] = useState(String(topic?.defaultPostLimit ?? defaultPostLimit))

  useImperativeHandle(
    ref,
    () => ({
      snapshot: () => {
        const trimmedName = name.trim()
        if (!trimmedName) return null

        return {
          id: topic?.id ?? createTopicId(trimmedName),
          name: trimmedName,
          enabled,
          keywords: lines(keywords),
          positiveExamples: lines(positiveExamples),
          negativeExamples: lines(negativeExamples),
          action: topic?.action ?? '立即自动响应',
          accounts: accounts.map((account) => account.trim()).filter(Boolean),
          collectionFrequency: topic?.collectionFrequency ?? '每 3 小时',
          workflowId: topic?.workflowId ?? 'x-topic-circle-event-formation',
          defaultPostLimit: Number(postLimit) || defaultPostLimit,
        }
      },
    }),
    [
      accounts,
      defaultPostLimit,
      enabled,
      keywords,
      name,
      negativeExamples,
      positiveExamples,
      postLimit,
      topic,
    ],
  )

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>主题名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>启用状态</label>
          <select value={enabled ? '启用' : '停用'} onChange={(e) => setEnabled(e.target.value === '启用')}>
            <option>启用</option>
            <option>停用</option>
          </select>
        </div>
        <div className="field">
          <label>语义关键词</label>
          <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>
        <div className="field">
          <label>正例 Event</label>
          <textarea value={positiveExamples} onChange={(e) => setPositiveExamples(e.target.value)} />
        </div>
        <div className="field">
          <label>反例 Event</label>
          <textarea value={negativeExamples} onChange={(e) => setNegativeExamples(e.target.value)} />
        </div>
        <div className="field">
          <label>单次帖子上限</label>
          <input value={postLimit} onChange={(e) => setPostLimit(e.target.value)} />
        </div>
        <AccountListInput value={accounts} onChange={setAccounts} />
      </div>
      <div className="note">
        <b>保存影响</b>
        <br />
        保存后会更新 Twitter 平台变量；榜单语义命中和主题圈账号追踪会读取这些字段。
      </div>
    </div>
  )
})

function AccountListInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const update = (index: number, account: string) => {
    onChange(value.map((item, i) => (i === index ? account : item)))
  }

  const add = () => onChange([...value, ''])

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next.length ? next : [''])
  }

  return (
    <div className="field">
      <label>关注账号</label>
      <div>
        {value.map((account, index) => (
          <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              value={account}
              onChange={(e) => update(index, e.target.value)}
              placeholder="@handle"
              style={{ flex: 1 }}
            />
            <button type="button" className="btn" onClick={() => remove(index)}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={add}>
          + 添加账号
        </button>
      </div>
    </div>
  )
}
