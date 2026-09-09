import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Spin, Switch, Tag, Tooltip } from 'antd'
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HeartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import {
  createAccountProfile,
  deleteAccountProfile,
  listAccountProfiles,
  refreshAccountProfiles,
  updateAccountProfile,
  type AccountProfile,
  type AccountProfileRefreshResult,
} from '../../../api/accountProfiles'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

const DEFAULT_KOL_INTERVAL_MS = 6 * 60 * 60 * 1000
const DEFAULT_KOL_MIN_VIEWS = 10000

type KolAccountFormValues = {
  handle: string
  groupTag?: string
}

export default function KolRadarSetting() {
  const { toast } = useApp()
  const [addForm] = Form.useForm<KolAccountFormValues>()
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kolRadarEnabled, setKolRadarEnabled] = useState(true)
  const [kolRadarMinViews, setKolRadarMinViews] = useState(DEFAULT_KOL_MIN_VIEWS)
  const [kolAccounts, setKolAccounts] = useState<AccountProfile[]>([])
  const [pendingHandle, setPendingHandle] = useState<string | null>(null)
  const [refreshingProfiles, setRefreshingProfiles] = useState(false)

  const intervalLabel = useMemo(
    () => formatIntervalMs(config?.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS),
    [config],
  )
  const enabledAccountCount = useMemo(
    () => kolAccounts.filter((account) => account.monitorEnabled).length,
    [kolAccounts],
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [nextConfig, accounts] = await Promise.all([
          getPlatformCollectionConfig('x'),
          listAccountProfiles({ monitoring: true }),
        ])
        if (!mounted) return
        setConfig(nextConfig)
        setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
        setKolRadarMinViews(nextConfig.variables.kolRadarMinViews ?? DEFAULT_KOL_MIN_VIEWS)
        setKolAccounts(accounts)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : '加载 KOL 雷达配置失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [])

  const persistConfig = async (patch: {
    kolRadarEnabled?: boolean
    kolRadarMinViews?: number
  } = {}) => {
    if (!config) return null

    const nextConfig = await updatePlatformCollectionConfig('x', {
      variables: {
        ...config.variables,
        kolRadarEnabled: patch.kolRadarEnabled ?? kolRadarEnabled,
        kolRadarMinViews: patch.kolRadarMinViews ?? kolRadarMinViews,
        kolRadarCollectionIntervalMs:
          config.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS,
      },
    })

    setConfig(nextConfig)
    setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
    setKolRadarMinViews(nextConfig.variables.kolRadarMinViews ?? DEFAULT_KOL_MIN_VIEWS)
    return nextConfig
  }

  const handleKolRadarSwitch = async (checked: boolean) => {
    const previous = kolRadarEnabled
    setKolRadarEnabled(checked)
    setSavingToggle(true)
    try {
      await persistConfig({ kolRadarEnabled: checked })
      toast(checked ? 'KOL 雷达定时采集已开启' : 'KOL 雷达定时采集已关闭')
    } catch (e) {
      setKolRadarEnabled(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 雷达定时采集开关失败')
    } finally {
      setSavingToggle(false)
    }
  }

  const handleKolAccountSwitch = async (account: AccountProfile, checked: boolean) => {
    const previous = kolAccounts
    setKolAccounts((current) =>
      current.map((item) =>
        item.handle === account.handle ? { ...item, monitorEnabled: checked } : item,
      ),
    )
    setSavingToggle(true)
    setPendingHandle(account.handle)
    try {
      const updated = await updateAccountProfile(account.handle, { monitorEnabled: checked })
      setKolAccounts((current) =>
        current.map((item) => (item.handle === updated.handle ? updated : item)),
      )
      toast(`KOL 账号 ${displayHandle(updated)} 已${checked ? '启用' : '停用'}`)
    } catch (e) {
      setKolAccounts(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 账号状态失败')
    } finally {
      setSavingToggle(false)
      setPendingHandle(null)
    }
  }

  const handleKolMinViewsChange = (value: number | null) => {
    setKolRadarMinViews(value ?? DEFAULT_KOL_MIN_VIEWS)
  }

  const openAddModal = () => {
    addForm.setFieldsValue({ handle: '', groupTag: '' })
    setAddModalOpen(true)
  }

  const handleAddKolAccount = async () => {
    try {
      const values = await addForm.validateFields()
      const handle = values.handle.trim().replace(/^@/, '')
      const groupTag = values.groupTag?.trim()

      if (!handle) {
        return
      }

      if (
        kolAccounts.some(
          (account) => account.handle.toLowerCase() === handle.toLowerCase(),
        )
      ) {
        addForm.setFields([
          {
            name: 'handle',
            errors: ['该账号已存在，请换一个 handle'],
          },
        ])
        return
      }

      setAddingAccount(true)
      try {
        const created = await createAccountProfile({
          handle,
          groupTag: groupTag ? groupTag : null,
          monitorEnabled: true,
        })
        setKolAccounts((current) => [...current, created])
        setAddModalOpen(false)
        addForm.resetFields()
        toast(`已添加 KOL 账号：${displayHandle(created)}`)
      } catch (e) {
        toast(e instanceof Error ? e.message : '添加 KOL 账号失败')
      } finally {
        setAddingAccount(false)
      }
    } catch {
      // form validation already handled by antd
    }
  }

  const handleRemoveKolAccount = async (account: AccountProfile) => {
    const previous = kolAccounts
    setKolAccounts((current) => current.filter((item) => item.handle !== account.handle))
    setSavingToggle(true)
    setPendingHandle(account.handle)
    try {
      await deleteAccountProfile(account.handle)
      toast(`已删除 KOL 账号 ${displayHandle(account)}`)
    } catch (e) {
      setKolAccounts(previous)
      toast(e instanceof Error ? e.message : '删除 KOL 账号失败')
    } finally {
      setSavingToggle(false)
      setPendingHandle(null)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await persistConfig()
      toast('KOL 雷达配置已保存')
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存 KOL 雷达配置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshProfiles = async () => {
    setRefreshingProfiles(true)
    try {
      const result: AccountProfileRefreshResult = await refreshAccountProfiles()
      if (result.missingKey) {
        toast('未配置 TWITTERAPI_IO_KEY，跳过静态资料刷新')
      } else {
        toast(`已刷新 ${result.refreshed}/${result.scanned} 个账号资料`)
      }
      const accounts = await listAccountProfiles({ monitoring: true })
      setKolAccounts(accounts)
    } catch (e) {
      toast(e instanceof Error ? e.message : '刷新账号资料失败')
    } finally {
      setRefreshingProfiles(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.settingPanel}>
        <Spin tip="正在加载 KOL 雷达配置…" />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.settingPanel}>
        <Alert type="error" message={`加载失败：${error}`} showIcon />
      </section>
    )
  }

  return (
    <section className={styles.settingPanel}>
      <div className={styles.settingHero}>
        <div className={styles.settingHeroContent}>
          <div>
            <h2>KOL 人驱动热点雷达</h2>
            <p className="small">仅采集已启用账号最近 6 小时帖子，不按赛道检索，不做市场倒推。</p>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveAll}
            loading={saving}
          >
            {saving ? '保存中…' : '保存配置'}
          </Button>
        </div>
      </div>

      <div className={styles.twitterGrid}>
        <section className={styles.twitterBlock}>
          <div className={styles.blockHeader}>
            <div>
              <h3>KOL 雷达采集</h3>
              <p className="small">只采集已启用账号最近 6 小时帖子，按 handle 做窗口去重。</p>
            </div>
            <div className={styles.blockHeaderMeta}>
              <span className={styles.statusBadge}>{intervalLabel}</span>
              <span className={styles.statusBadge}>最低 {kolRadarMinViews.toLocaleString()} views</span>
            </div>
          </div>

          <div className={styles.settingControls}>
            <div className={styles.switchRow}>
              <div>
                <strong>KOL 雷达</strong>
                <span>只从账号列表取数，按最近 6 小时滚动窗口采集。</span>
              </div>
              <Switch
                checked={kolRadarEnabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                loading={savingToggle}
                onChange={handleKolRadarSwitch}
              />
            </div>
            <div className={styles.switchRow}>
              <div>
                <strong>入榜 views 门槛</strong>
                <span>先过滤再排序，低于门槛的帖子不进入快照。</span>
              </div>
              <InputNumber
                min={0}
                step={1000}
                value={kolRadarMinViews}
                onChange={handleKolMinViewsChange}
                style={{ width: 180 }}
                formatter={(value) =>
                  value === undefined || value === null
                    ? ''
                    : Number(value).toLocaleString()
                }
                parser={(value) => Number(String(value ?? '').replace(/,/g, ''))}
              />
            </div>
          </div>

          <div className={styles.kolAccountHeader}>
            <div>
              <div className={styles.regionHeader}>已选账号（{kolAccounts.length}）</div>
              <div className={styles.kolAccountHint}>启用中的账号会进入采集；停用后保留在列表里。</div>
            </div>
            <div className={styles.kolAccountHeaderActions}>
              <Tag color="blue">{enabledAccountCount} 个已启用</Tag>
              <Button
                icon={<ReloadOutlined spin={refreshingProfiles} />}
                loading={refreshingProfiles}
                onClick={() => void handleRefreshProfiles()}
              >
                刷新账号资料
              </Button>
              <Button icon={<PlusOutlined />} onClick={openAddModal}>
                添加账号
              </Button>
            </div>
          </div>
          <div className={styles.kolAccountList}>
            {kolAccounts.map((account) => (
              <div className={styles.kolAccountRow} key={account.handle}>
                <div className={styles.kolAccountInfo}>
                  <div className={styles.kolAccountTitleRow}>
                    <div className={styles.kolAccountTitle}>{displayHandle(account)}</div>
                    <Tag color={account.monitorEnabled ? 'green' : 'default'}>
                      {account.monitorEnabled ? '启用' : '停用'}
                    </Tag>
                  </div>
                  <div className={styles.kolAccountMetrics}>
                    <Metric icon={<UserOutlined />} label="粉丝" value={formatFollowers(account.followers)} />
                    <Metric icon={<FileTextOutlined />} label="7天发帖" value={account.weeklyPosts > 0 ? String(account.weeklyPosts) : '--'} />
                    <Metric icon={<EyeOutlined />} label="7天均views" value={formatViews(account.avgViews)} />
                    <Metric icon={<HeartOutlined />} label="7天均likes" value={formatViews(account.avgLikes)} />
                    {account.region ? (
                      <Metric icon={<GlobalOutlined />} label="区域" value={account.region} />
                    ) : (
                      <Metric icon={<GlobalOutlined />} label="区域" value="--" />
                    )}
                    <Metric
                      icon={<ClockCircleOutlined />}
                      label="最近活跃"
                      value={account.lastActiveAt ? formatRelativeTime(account.lastActiveAt) : '--'}
                      tooltip={account.lastActiveAt ? formatDateTime(account.lastActiveAt) : undefined}
                    />
                    <Metric
                      icon={<SyncOutlined />}
                      label="资料更新"
                      value={account.lastFetchedAt ? formatRelativeTime(account.lastFetchedAt) : '--'}
                      tooltip={account.lastFetchedAt ? formatDateTime(account.lastFetchedAt) : undefined}
                    />
                  </div>
                  <div className={styles.kolAccountMeta}>
                    {account.groupTag ? <Tag color="blue">{account.groupTag}</Tag> : <Tag>未分组</Tag>}
                    <span>加入 {formatJoinedAt(account.joinedAt)}</span>
                    {account.bio ? (
                      <Tooltip title={account.bio}>
                        <span className={styles.bioHint}>{account.bio.slice(0, 60)}</span>
                      </Tooltip>
                    ) : null}
                  </div>
                </div>
                <div className={styles.kolAccountActions}>
                  <Switch
                    checked={account.monitorEnabled}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                    loading={savingToggle && pendingHandle === account.handle}
                    onChange={(checked) => void handleKolAccountSwitch(account, checked)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={savingToggle && pendingHandle === account.handle}
                    onClick={() => void handleRemoveKolAccount(account)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>

        <Alert
          style={{ marginTop: 12 }}
          type="info"
          showIcon
          message="采集规则"
          description={`只从 KOL list 内账号取数，按最近 6 小时滚动窗口采集，先按 views >= ${kolRadarMinViews.toLocaleString()} 过滤，再按 views 从高到低排序。`}
        />
        </section>
      </div>

      <Modal
        title="添加 KOL 账号"
        open={addModalOpen}
        confirmLoading={addingAccount}
        okText="添加"
        cancelText="取消"
        onCancel={() => {
          setAddModalOpen(false)
          addForm.resetFields()
        }}
        onOk={() => void handleAddKolAccount()}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ handle: '', groupTag: '' }}
        >
          <Form.Item
            label="账号 handle"
            name="handle"
            rules={[
              { required: true, message: '请输入账号 handle' },
              { whitespace: true, message: '账号 handle 不能为空' },
            ]}
          >
            <Input placeholder="例如 OpenAI、Reuters、@handle" />
          </Form.Item>
          <Form.Item
            label="分组标签（可选）"
            name="groupTag"
            rules={[{ max: 20, message: '分组标签最多 20 个字符' }]}
          >
            <Input placeholder="例如 AI / 产品、宏观数据、政治与选举" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}

function displayHandle(account: AccountProfile) {
  return account.displayHandle ?? account.handle
}

function formatIntervalMs(ms: number) {
  if (ms % (60 * 60 * 1000) === 0) {
    return `每 ${ms / (60 * 60 * 1000)} 小时`
  }
  if (ms % (60 * 1000) === 0) {
    return `每 ${ms / (60 * 1000)} 分钟`
  }
  return `${ms}ms`
}

function formatJoinedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function Metric({
  icon,
  label,
  value,
  tooltip,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  tooltip?: string
}) {
  const content = (
    <span className={styles.metricItem}>
      <span className={styles.metricIcon}>{icon}</span>
      <span className={styles.metricValue}>{value}</span>
    </span>
  )

  if (tooltip) {
    return <Tooltip title={`${label} · ${tooltip}`}>{content}</Tooltip>
  }

  return <Tooltip title={label}>{content}</Tooltip>
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatFollowers(value: number | null | undefined): string {
  return formatNumber(value)
}

function formatViews(value: number | null | undefined): string {
  return formatNumber(value)
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}
