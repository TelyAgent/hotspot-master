import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Collapse, Empty, Form, Input, InputNumber, Select, Spin, Switch, Table, Tag } from 'antd'
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import {
  getTopicWatchConfigs,
  updateActiveTopicMonitoringPlan,
  updateTopicWatchAccounts,
  updateTopicWatchConfig,
  type TopicWatchAccountConfig,
  type TopicMonitoringPlanConfig,
  type TopicWatchConfig,
} from '../../../api/topicWatchConfig'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

const REGION_OPTIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']

const FREQUENCY_OPTIONS = [
  { label: '每 1 小时', value: 60 * 60 * 1000 },
  { label: '每 2 小时', value: 2 * 60 * 60 * 1000 },
  { label: '每 3 小时', value: 3 * 60 * 60 * 1000 },
  { label: '每 4 小时', value: 4 * 60 * 60 * 1000 },
  { label: '每 6 小时', value: 6 * 60 * 60 * 1000 },
]

const SINGLE_TRIGGER_POLICY_OPTIONS = [
  { value: 'S1', label: 'S1 · 第一方权威' },
  { value: 'S2', label: 'S2 · 核心人物/决策者' },
  { value: 'C', label: 'C · 候选聚合' },
]

interface WorkflowUiConfig {
  id: string
  label: string
  loadingText: string
  fallbackSummary: string
}

interface TopicWatchAccountDraft extends TopicWatchAccountConfig {
  rowKey: string
}

const TOPIC_ACCOUNT_COLUMNS = [
  {
    title: '账号',
    dataIndex: 'handle',
    key: 'handle',
    width: 150,
    render: (value: string) => `@${String(value).replace(/^@/, '')}`,
  },
  {
    title: '来源角色',
    dataIndex: 'primaryRole',
    key: 'primaryRole',
    width: 170,
  },
  {
    title: '单点权限',
    dataIndex: 'singleTriggerPolicy',
    key: 'singleTriggerPolicy',
    width: 100,
    render: (value: string) => <Tag color={formatSingleTriggerColor(value)}>{value}</Tag>,
  },
  {
    title: '权威范围',
    dataIndex: 'authorityScope',
    key: 'authorityScope',
  },
]

export default function TwitterSetting() {
  const { openModal, toast } = useApp()
  const topicWatchFormRef = useRef<TopicWatchEditFormHandle>(null)
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regions, setRegions] = useState<string[]>(REGION_OPTIONS)
  const [frequencyMs, setFrequencyMs] = useState(2 * 60 * 60 * 1000)
  const [trendLimit, setTrendLimit] = useState('30')
  const [trendCollectionEnabled, setTrendCollectionEnabled] = useState(true)
  const [topicWatchSchedulerEnabled, setTopicWatchSchedulerEnabled] = useState(true)
  const [workflowId, setWorkflowId] = useState('x-trend-event-formation')
  const [topicWatches, setTopicWatches] = useState<TopicWatchConfig[]>([])

  const frequencyLabel = useMemo(() => formatIntervalMs(frequencyMs), [frequencyMs])
  const frequencyOptions = useMemo(() => {
    if (FREQUENCY_OPTIONS.some((item) => item.value === frequencyMs)) {
      return FREQUENCY_OPTIONS
    }

    return [
      ...FREQUENCY_OPTIONS,
      {
        label: formatIntervalMs(frequencyMs),
        value: frequencyMs,
      },
    ]
  }, [frequencyMs])
  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [nextConfig, nextTopicWatches] = await Promise.all([
          getPlatformCollectionConfig('x'),
          getTopicWatchConfigs(),
        ])
        if (!mounted) return
        setConfig(nextConfig)
        setRegions(nextConfig.variables.regions?.length ? nextConfig.variables.regions : nextConfig.defaultRegions)
        setFrequencyMs(resolveTrendIntervalMs(nextConfig))
        setTrendLimit(String(nextConfig.variables.defaultTrendLimit ?? 30))
        setTrendCollectionEnabled(nextConfig.variables.trendCollectionEnabled ?? nextConfig.enabled)
        setTopicWatchSchedulerEnabled(nextConfig.variables.topicWatchSchedulerEnabled ?? true)
        setWorkflowId(nextConfig.variables.trendEventWorkflowId ?? 'x-trend-event-formation')
        setTopicWatches(nextTopicWatches)
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
    const nextTrendLimit = normalizeTrendLimit(trendLimit)
    if (!nextTrendLimit) {
      toast('榜单条数请输入 1-30 之间的整数')
      return
    }
    setSaving(true)
    try {
      const nextVariables = {
        ...config.variables,
        regions,
        defaultTrendLimit: nextTrendLimit,
        trendCollectionIntervalMs: frequencyMs,
        trendCollectionEnabled,
        topicWatchSchedulerEnabled,
        trendEventWorkflowId: workflowId,
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

  const reloadTopicWatches = async () => {
    setTopicWatches(await getTopicWatchConfigs())
  }

  const openTopicWatchEditor = (topic: TopicWatchConfig) => {
    openModal(
      `编辑重点主题 · ${topic.name}`,
      <TopicWatchEditForm ref={topicWatchFormRef} topic={topic} />,
      false,
      'large',
      {
        label: '保存',
        onConfirm: async () => {
          const snapshot = topicWatchFormRef.current?.snapshot()
          if (!snapshot) {
            toast('请输入主题名称')
            return
          }
          openModal(`编辑重点主题 · ${topic.name}`, <div className="note">正在保存重点主题配置…</div>, true, 'large')
          try {
            await updateTopicWatchConfig(topic.id, snapshot.topic)
            await updateTopicWatchAccounts(topic.id, { accounts: snapshot.accounts })
            await updateActiveTopicMonitoringPlan(topic.id, snapshot.plan)
            await reloadTopicWatches()
            toast('重点主题配置已保存')
          } catch (e) {
            openModal(
              `编辑重点主题 · ${topic.name}`,
              <div className="note warning">{e instanceof Error ? e.message : '保存重点主题配置失败'}</div>,
              true,
              'large',
            )
          }
        },
      },
    )
  }

  if (loading) {
    return <section className={styles.settingPanel}><Spin tip="正在加载 Twitter 配置…" /></section>
  }

  if (error) {
    return <section className={styles.settingPanel}><Alert type="error" message={`加载失败：${error}`} showIcon /></section>
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingSection}>
        <div className="setting-title">
          <div>
            <h2>Twitter 配置</h2>
            <p className="small">X 热搜榜采集、榜单形成 Event 工作流、重点主题追踪。</p>
          </div>
          <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={regions.length === 0}>
            {saving ? '保存中…' : '保存配置'}
          </Button>
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
          <div className={styles.settingControls}>
            <div className={styles.switchRow}>
              <span>定时采集</span>
              <Switch
                checked={trendCollectionEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                onChange={setTrendCollectionEnabled}
              />
            </div>
            <div className="field">
              <label>采集频率</label>
              <Select
                showSearch
                value={frequencyMs}
                options={frequencyOptions}
                placeholder="选择或输入小时数"
                onChange={(value) => setFrequencyMs(Number(value))}
                onSearch={(value) => {
                  const nextMs = parseIntervalInput(value)
                  if (nextMs) setFrequencyMs(nextMs)
                }}
              />
            </div>
            <div className="field">
              <label>榜单条数</label>
              <InputNumber
                min={1}
                max={30}
                value={Number(trendLimit)}
                onChange={(value) => setTrendLimit(String(value ?? ''))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div className={styles.regionList}>
            {REGION_OPTIONS.map((region) => (
              <Checkbox
                key={region}
                className={styles.checkItem}
                checked={regions.includes(region)}
                onChange={() => toggleRegion(region)}
              >
                {region}
              </Checkbox>
            ))}
          </div>
        </section>
        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>主题圈配置</h3>
              <p className="small">保存后由服务端同步到主题圈采集任务。</p>
            </div>
            <span className="pill green">按主题计划</span>
          </div>
          <div className={styles.settingControls}>
            <div className={styles.switchRow}>
              <span>定时采集</span>
              <Switch
                checked={topicWatchSchedulerEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                onChange={setTopicWatchSchedulerEnabled}
              />
            </div>
          </div>
          {topicWatches.length === 0 ? (
            <Empty description="暂无重点主题配置" />
          ) : (
            <Collapse
              className={styles.topicWatchCollapse}
              items={topicWatches.map((topic) => ({
                key: topic.id,
                label: <TopicWatchLabel topic={topic} />,
                extra: (
                  <div className={styles.inlineActions} onClick={(event) => event.stopPropagation()}>
                    <Button size="small" onClick={() => openTopicWatchEditor(topic)}>
                      编辑
                    </Button>
                  </div>
                ),
                children: <TopicWatchDetail topic={topic} />,
              }))}
            />
          )}
        </section>
      </div>
    </section>
  )
}

function TopicWatchLabel({ topic }: { topic: TopicWatchConfig }) {
  const plan = topic.monitoringPlans?.[0]
  const accountCount = getTopicAccounts(topic).length
  const refreshText = formatRefreshPolicy(plan?.refreshPolicy)

  return (
    <div className={styles.topicWatchLabel}>
      <div>
        <strong>{topic.name}</strong>
        <span>{topic.description || topic.watchIntent}</span>
      </div>
      <div className={styles.topicWatchMeta}>
        <Tag color={topic.status === 'active' ? 'success' : 'default'}>
          {topic.status === 'active' ? '启用' : topic.status}
        </Tag>
        <span>{accountCount} 个账号</span>
        <span>{refreshText}</span>
      </div>
    </div>
  )
}

function TopicWatchDetail({ topic }: { topic: TopicWatchConfig }) {
  const plan = topic.monitoringPlans?.[0]
  const accounts = getTopicAccounts(topic)
  const triggerRules = plan?.triggerRules ?? []
  const evidenceRequirements = plan?.evidenceRequirements ?? []

  return (
    <div className={styles.topicWatchDetail}>
      <div className={styles.topicWatchInfoGrid}>
        <div>
          <span className="small">监控意图</span>
          <p>{topic.watchIntent || '—'}</p>
        </div>
        <div>
          <span className="small">采集策略</span>
          <p>{topic.collectionPolicy || '—'}</p>
        </div>
        <div>
          <span className="small">触发策略</span>
          <p>{topic.triggerPolicy || '—'}</p>
        </div>
        <div>
          <span className="small">排除规则</span>
          <p>{topic.exclusionPolicy || '—'}</p>
        </div>
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>监控账号</h4>
        <Table
          size="small"
          rowKey={(account) => account.handle}
          columns={TOPIC_ACCOUNT_COLUMNS}
          dataSource={accounts}
          pagination={false}
        />
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>触发规则</h4>
        {triggerRules.length === 0 ? (
          <p className="small">暂无触发规则</p>
        ) : (
          triggerRules.map((rule, index) => (
            <div key={rule.ruleId ?? index} className={styles.topicRuleItem}>
              <strong>{rule.ruleId ?? `rule-${index + 1}`}</strong>
              <span>{rule.description ?? '—'}</span>
              {rule.positiveExamples?.length ? (
                <small>正例：{rule.positiveExamples.join('；')}</small>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className={styles.topicWatchSubsection}>
        <h4>证据要求</h4>
        {evidenceRequirements.length === 0 ? (
          <p className="small">暂无证据要求</p>
        ) : (
          evidenceRequirements.map((item, index) => (
            <div key={`${item.sourceType ?? 'source'}-${index}`} className={styles.topicRuleItem}>
              <strong>{item.sourceType ?? '未知来源'}</strong>
              <span>{item.requiredFields?.length ? item.requiredFields.join('、') : '未限定字段'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getTopicAccounts(topic: TopicWatchConfig) {
  if (topic.accounts?.length) {
    return topic.accounts
      .filter((account) => account.status !== 'archived')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(normalizeTopicAccount)
  }

  const sources = topic.monitoringPlans?.[0]?.sources ?? []
  return sources
    .filter((source) => source.platform === 'x' && source.sourceType === 'account' && source.handle)
    .map((source, index) => normalizeTopicAccount({
      handle: String(source.handle).replace(/^@/, ''),
      primaryRole: source.primaryRole ?? '专业媒体、快速雷达、数据、分析、预测和观点账号',
      singleTriggerPolicy: source.singleTriggerPolicy ?? 'C',
      authorityScope: source.authorityScope ?? '按账号公开信息与帖子内容判断',
      status: 'active',
      sortOrder: index + 1,
    }))
}

function normalizeTopicAccount(account: TopicWatchAccountConfig): TopicWatchAccountConfig {
  return {
    ...account,
    handle: String(account.handle).replace(/^@/, ''),
    primaryRole: account.primaryRole || '专业媒体、快速雷达、数据、分析、预测和观点账号',
    singleTriggerPolicy: normalizeSingleTriggerPolicy(account.singleTriggerPolicy),
    authorityScope: account.authorityScope || '按账号公开信息与帖子内容判断',
    status: account.status ?? 'active',
  }
}

function normalizeSingleTriggerPolicy(value: unknown): 'S1' | 'S2' | 'C' {
  return value === 'S1' || value === 'S2' || value === 'C' ? value : 'C'
}

function formatSingleTriggerColor(value: string) {
  if (value === 'S1') return 'green'
  if (value === 'S2') return 'blue'
  return 'default'
}

function formatRefreshPolicy(policy: TopicMonitoringPlanConfig['refreshPolicy']) {
  if (!policy) return '未配置频率'
  const interval = typeof policy.intervalMinutes === 'number' ? policy.intervalMinutes : undefined
  const lookback = typeof policy.lookbackMinutes === 'number' ? policy.lookbackMinutes : undefined
  if (interval && lookback) return `每 ${formatMinutes(interval)} / 回看 ${formatMinutes(lookback)}`
  if (interval) return `每 ${formatMinutes(interval)}`
  if (lookback) return `回看 ${formatMinutes(lookback)}`
  return '已配置刷新策略'
}

function formatMinutes(value: number) {
  if (value % 60 === 0) return `${value / 60} 小时`
  return `${value} 分钟`
}

function resolveTrendIntervalMs(config: PlatformCollectionConfig) {
  if (typeof config.variables.trendCollectionIntervalMs === 'number' && config.variables.trendCollectionIntervalMs > 0) {
    return config.variables.trendCollectionIntervalMs
  }
  const cron = config.variables.trendCollectionCron
  const legacyCron = FREQUENCY_OPTIONS.find((item) => cron === `0 */${item.value / 3600000} * * *`)
  return legacyCron?.value ?? 2 * 60 * 60 * 1000
}

function normalizeTrendLimit(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) return undefined
  return parsed
}

function formatWorkflowSource(source: string) {
  const labels: Record<string, string> = {
    system: '系统默认',
    ai_custom: 'AI 自定义',
    manual_import: '人工导入',
    rollback: '历史回滚',
  }
  return labels[source] ?? source
}

function formatWorkflowTestStatus(status: string) {
  const labels: Record<string, string> = {
    running: '测试中',
    passed: '通过',
    failed: '失败',
  }
  return labels[status] ?? status
}

function formatWorkflowAction(action: string) {
  const labels: Record<string, string> = {
    create_ai_draft: 'AI 生成草稿',
    repair_ai_draft: 'AI 修复草稿',
    run_short_test: '短流程测试',
    activate_version: '启用版本',
    reset_to_system_default: '重置默认',
  }
  return labels[action] ?? action
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

interface WorkflowDraftFormHandle {
  snapshot: () => string | null
}

interface TopicWatchEditFormHandle {
  snapshot: () => null | {
    topic: Parameters<typeof updateTopicWatchConfig>[1]
    accounts: Parameters<typeof updateTopicWatchAccounts>[1]['accounts']
    plan: Parameters<typeof updateActiveTopicMonitoringPlan>[1]
  }
}

const WorkflowDraftForm = forwardRef<WorkflowDraftFormHandle>((_, ref) => {
  const [instruction, setInstruction] = useState('')

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const trimmed = instruction.trim()
      return trimmed ? trimmed : null
    },
  }))

  return (
    <div className={styles.topicForm}>
      <div className="field full">
        <label>修改要求</label>
        <Input.TextArea
          rows={6}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="例如：泛娱乐话题更严格一点；监管、产品发布、重大资金流动更积极形成事件；重复事件优先合并。"
        />
      </div>
      <Alert message="生成结果会保存为草稿版本，不会覆盖系统默认工作流，也不会自动启用。" showIcon />
    </div>
  )
})

WorkflowDraftForm.displayName = 'WorkflowDraftForm'

const TopicWatchEditForm = forwardRef<
  TopicWatchEditFormHandle,
  { topic: TopicWatchConfig }
>(({ topic }, ref) => {
  const plan = topic.monitoringPlans?.[0]
  const [name, setName] = useState(topic.name)
  const [description, setDescription] = useState(topic.description)
  const [status, setStatus] = useState(topic.status)
  const [watchIntent, setWatchIntent] = useState(topic.watchIntent)
  const [collectionPolicy, setCollectionPolicy] = useState(topic.collectionPolicy)
  const [triggerPolicy, setTriggerPolicy] = useState(topic.triggerPolicy)
  const [evidencePolicy, setEvidencePolicy] = useState(topic.evidencePolicy)
  const [exclusionPolicy, setExclusionPolicy] = useState(topic.exclusionPolicy ?? '')
  const [domains, setDomains] = useState(topic.domains.join('\n'))
  const [accounts, setAccounts] = useState<TopicWatchAccountDraft[]>(() =>
    getTopicAccounts(topic).map((account, index) => ({
      ...account,
      rowKey: account.id ?? `${account.handle}-${index}`,
    })),
  )
  const [triggerRules, setTriggerRules] = useState(formatTriggerRules(plan?.triggerRules ?? []))
  const [evidenceRequirements, setEvidenceRequirements] = useState(formatEvidenceRequirements(plan?.evidenceRequirements ?? []))

  const updateAccount = (
    rowKey: string,
    patch: Partial<Pick<TopicWatchAccountDraft, 'handle' | 'primaryRole' | 'singleTriggerPolicy' | 'authorityScope'>>,
  ) => {
    setAccounts((prev) =>
      prev.map((account) => (account.rowKey === rowKey ? { ...account, ...patch } : account)),
    )
  }

  const removeAccount = (rowKey: string) => {
    setAccounts((prev) => prev.filter((account) => account.rowKey !== rowKey))
  }

  const addAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        rowKey: `new-${Date.now()}`,
        handle: '',
        primaryRole: '专业媒体、快速雷达、数据、分析、预测和观点账号',
        singleTriggerPolicy: 'C',
        authorityScope: '按账号公开信息与帖子内容判断',
        status: 'active',
        sortOrder: prev.length + 1,
      },
    ])
  }

  const accountColumns = [
    {
      title: '账号',
      dataIndex: 'handle',
      key: 'handle',
      width: 160,
      render: (_: unknown, record: TopicWatchAccountDraft) => (
        <Input
          addonBefore="@"
          value={record.handle.replace(/^@/, '')}
          onChange={(e) => updateAccount(record.rowKey, { handle: e.target.value.replace(/^@/, '') })}
          placeholder="OpenAI"
        />
      ),
    },
    {
      title: '来源角色',
      dataIndex: 'primaryRole',
      key: 'primaryRole',
      width: 210,
      render: (_: unknown, record: TopicWatchAccountDraft) => (
        <Input
          value={record.primaryRole}
          onChange={(e) => updateAccount(record.rowKey, { primaryRole: e.target.value })}
          placeholder="第一方权威账号"
        />
      ),
    },
    {
      title: '单点权限',
      dataIndex: 'singleTriggerPolicy',
      key: 'singleTriggerPolicy',
      width: 180,
      render: (_: unknown, record: TopicWatchAccountDraft) => (
        <Select
          value={normalizeSingleTriggerPolicy(record.singleTriggerPolicy)}
          options={SINGLE_TRIGGER_POLICY_OPTIONS}
          onChange={(value) => updateAccount(record.rowKey, { singleTriggerPolicy: value })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '权威范围',
      dataIndex: 'authorityScope',
      key: 'authorityScope',
      render: (_: unknown, record: TopicWatchAccountDraft) => (
        <Input.TextArea
          value={record.authorityScope}
          autoSize={{ minRows: 1, maxRows: 4 }}
          onChange={(e) => updateAccount(record.rowKey, { authorityScope: e.target.value })}
          placeholder="这个账号在哪些事实范围内可作为权威来源"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 70,
      render: (_: unknown, record: TopicWatchAccountDraft) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          aria-label="删除账号"
          onClick={() => removeAccount(record.rowKey)}
        />
      ),
    },
  ]

  useImperativeHandle(ref, () => ({
    snapshot: () => {
      const trimmedName = name.trim()
      if (!trimmedName) return null
      const parsedAccounts = accounts
        .map((account, index) => normalizeTopicAccount({
          ...account,
          handle: account.handle.replace(/^@/, '').trim(),
          sortOrder: index + 1,
        }))
        .filter((account) => account.handle)

      return {
        topic: {
          name: trimmedName,
          description: description.trim(),
          domains: textLines(domains),
          watchIntent: watchIntent.trim(),
          collectionPolicy: collectionPolicy.trim(),
          triggerPolicy: triggerPolicy.trim(),
          evidencePolicy: evidencePolicy.trim(),
          exclusionPolicy: exclusionPolicy.trim() || null,
          status,
        },
        accounts: parsedAccounts,
        plan: {
          sources: parsedAccounts.map((account) => ({
            platform: 'x',
            sourceType: 'account',
            handle: account.handle.replace(/^@/, ''),
            primaryRole: account.primaryRole,
            singleTriggerPolicy: account.singleTriggerPolicy,
            authorityScope: account.authorityScope,
            includeReplies: true,
            includeQuotes: true,
            includeReposts: false,
            maxPages: 5,
          })),
          refreshPolicy: plan?.refreshPolicy ?? {},
          triggerRules: parseTriggerRules(triggerRules),
          evidenceRequirements: parseEvidenceRequirements(evidenceRequirements),
          reason: '运营人员在 Twitter 配置页手动修改重点主题配置。',
        },
      }
    },
  }), [
    accounts,
    collectionPolicy,
    description,
    domains,
    evidencePolicy,
    evidenceRequirements,
    exclusionPolicy,
    name,
    plan?.refreshPolicy,
    status,
    triggerPolicy,
    triggerRules,
    watchIntent,
  ])

  return (
    <div className={styles.topicForm}>
      <Form layout="vertical">
        <Form.Item label="主题名称" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            value={status}
            options={[
              { value: 'active', label: '启用' },
              { value: 'paused', label: '停用' },
            ]}
            onChange={setStatus}
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form.Item>
        <Form.Item label="领域/关键词">
          <Input.TextArea rows={3} value={domains} onChange={(e) => setDomains(e.target.value)} />
        </Form.Item>
        <Form.Item label="监控意图">
          <Input.TextArea rows={3} value={watchIntent} onChange={(e) => setWatchIntent(e.target.value)} />
        </Form.Item>
        <Form.Item label="采集策略">
          <Input.TextArea rows={3} value={collectionPolicy} onChange={(e) => setCollectionPolicy(e.target.value)} />
        </Form.Item>
        <Form.Item label="触发策略">
          <Input.TextArea rows={3} value={triggerPolicy} onChange={(e) => setTriggerPolicy(e.target.value)} />
        </Form.Item>
        <Form.Item label="证据策略">
          <Input.TextArea rows={3} value={evidencePolicy} onChange={(e) => setEvidencePolicy(e.target.value)} />
        </Form.Item>
        <Form.Item label="排除规则">
          <Input.TextArea rows={3} value={exclusionPolicy} onChange={(e) => setExclusionPolicy(e.target.value)} />
        </Form.Item>
        <Form.Item label="监控账号">
          <Table
            size="small"
            rowKey="rowKey"
            columns={accountColumns}
            dataSource={accounts}
            pagination={false}
            scroll={{ x: 920 }}
          />
          <Button className={styles.addTopicAccountButton} icon={<PlusOutlined />} onClick={addAccount}>
            添加账号
          </Button>
        </Form.Item>
        <Form.Item label="触发规则">
          <Input.TextArea rows={5} value={triggerRules} onChange={(e) => setTriggerRules(e.target.value)} />
        </Form.Item>
        <Form.Item label="证据要求">
          <Input.TextArea rows={5} value={evidenceRequirements} onChange={(e) => setEvidenceRequirements(e.target.value)} />
        </Form.Item>
      </Form>
      <Alert message="保存后会更新当前 active 监控计划；不会创建新版本。" showIcon />
    </div>
  )
})

TopicWatchEditForm.displayName = 'TopicWatchEditForm'

function textLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function formatIntervalMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '未配置'
  if (ms % (60 * 60 * 1000) === 0) return `每 ${ms / (60 * 60 * 1000)} 小时`
  if (ms % (60 * 1000) === 0) return `每 ${ms / (60 * 1000)} 分钟`
  return `每 ${Math.round(ms / 60000)} 分钟`
}

function parseIntervalInput(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!numberMatch) return null

  const amount = Number(numberMatch[1])
  if (!Number.isFinite(amount) || amount <= 0) return null

  if (/分钟|min/i.test(normalized)) {
    return Math.round(amount * 60 * 1000)
  }

  return Math.round(amount * 60 * 60 * 1000)
}

function formatTriggerRules(rules: NonNullable<TopicMonitoringPlanConfig['triggerRules']>) {
  return rules
    .map((rule) => {
      const examples = rule.positiveExamples?.length ? ` | 正例：${rule.positiveExamples.join('；')}` : ''
      return `${rule.ruleId ?? 'rule'} | ${rule.description ?? ''}${examples}`
    })
    .join('\n')
}

function parseTriggerRules(value: string) {
  return textLines(value).map((line, index) => {
    const [ruleId, description = '', examples = ''] = line.split('|').map((item) => item.trim())
    return {
      ruleId: ruleId || `rule-${index + 1}`,
      description,
      positiveExamples: examples.replace(/^正例：/, '').split('；').map((item) => item.trim()).filter(Boolean),
    }
  })
}

function formatEvidenceRequirements(requirements: NonNullable<TopicMonitoringPlanConfig['evidenceRequirements']>) {
  return requirements
    .map((item) => `${item.sourceType ?? 'x_account_post'} | ${(item.requiredFields ?? []).join('、')}`)
    .join('\n')
}

function parseEvidenceRequirements(value: string) {
  return textLines(value).map((line) => {
    const [sourceType, fields = ''] = line.split('|').map((item) => item.trim())
    return {
      sourceType: sourceType || 'x_account_post',
      requiredFields: fields.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
    }
  })
}
