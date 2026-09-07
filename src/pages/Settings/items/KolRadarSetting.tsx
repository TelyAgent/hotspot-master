import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Input, Spin, Switch, Tag } from 'antd'
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import {
  getPlatformCollectionConfig,
  updatePlatformCollectionConfig,
  type KolRadarAccount,
  type PlatformCollectionConfig,
} from '../../../api/collectionConfig'
import { useApp } from '../../../context/AppContext'
import styles from '../Settings.module.css'

const DEFAULT_KOL_INTERVAL_MS = 6 * 60 * 60 * 1000

export default function KolRadarSetting() {
  const { toast } = useApp()
  const [config, setConfig] = useState<PlatformCollectionConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kolRadarEnabled, setKolRadarEnabled] = useState(true)
  const [kolAccounts, setKolAccounts] = useState<KolRadarAccount[]>([])

  const intervalLabel = useMemo(
    () => formatIntervalMs(config?.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS),
    [config],
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
        setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
        setKolAccounts(nextConfig.variables.kolAccounts ?? [])
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

  const persist = async (patch: {
    kolRadarEnabled?: boolean
    kolAccounts?: KolRadarAccount[]
  } = {}) => {
    if (!config) return null

    const nextKolAccounts = patch.kolAccounts ?? kolAccounts
    const nextConfig = await updatePlatformCollectionConfig('x', {
      variables: {
        ...config.variables,
        kolRadarEnabled: patch.kolRadarEnabled ?? kolRadarEnabled,
        kolRadarCollectionIntervalMs:
          config.variables.kolRadarCollectionIntervalMs ?? DEFAULT_KOL_INTERVAL_MS,
        kolAccounts: nextKolAccounts,
      },
    })

    setConfig(nextConfig)
    setKolRadarEnabled(nextConfig.variables.kolRadarEnabled ?? true)
    setKolAccounts(nextConfig.variables.kolAccounts ?? [])
    return nextConfig
  }

  const handleKolRadarSwitch = async (checked: boolean) => {
    const previous = kolRadarEnabled
    setKolRadarEnabled(checked)
    setSavingToggle(true)
    try {
      await persist({ kolRadarEnabled: checked })
      toast(checked ? 'KOL 雷达定时采集已开启' : 'KOL 雷达定时采集已关闭')
    } catch (e) {
      setKolRadarEnabled(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 雷达定时采集开关失败')
    } finally {
      setSavingToggle(false)
    }
  }

  const handleKolAccountSwitch = async (index: number, checked: boolean) => {
    const previous = kolAccounts
    const nextAccounts = kolAccounts.map((item, currentIndex) =>
      currentIndex === index ? { ...item, enabled: checked } : item,
    )
    setKolAccounts(nextAccounts)
    setSavingToggle(true)
    try {
      await persist({ kolAccounts: nextAccounts })
      toast(`KOL 账号 ${nextAccounts[index]?.handle ?? ''} 已${checked ? '启用' : '停用'}`)
    } catch (e) {
      setKolAccounts(previous)
      toast(e instanceof Error ? e.message : '保存 KOL 账号状态失败')
    } finally {
      setSavingToggle(false)
    }
  }

  const handleKolAccountUpdate = (index: number, patch: Partial<KolRadarAccount>) => {
    setKolAccounts((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    )
  }

  const handleAddKolAccount = () => {
    setKolAccounts((prev) => [
      ...prev,
      {
        handle: '',
        groupTag: null,
        joinedAt: new Date().toISOString(),
        enabled: true,
      },
    ])
  }

  const handleRemoveKolAccount = (index: number) => {
    setKolAccounts((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await persist()
      toast('KOL 雷达配置已保存')
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存 KOL 雷达配置失败')
    } finally {
      setSaving(false)
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
              <h3>定时采集</h3>
              <p className="small">关闭后只保留手动采集入口。</p>
            </div>
            <span className={styles.statusBadge}>{intervalLabel}</span>
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
          </div>

          <div className={styles.regionHeader}>已选账号（{kolAccounts.length}）</div>
          <div className={styles.inlineActions}>
            <Button icon={<PlusOutlined />} onClick={handleAddKolAccount}>
              添加账号
            </Button>
          </div>
          <div className={styles.kolAccountList}>
            {kolAccounts.map((account, index) => (
              <div className={styles.kolAccountRow} key={`${account.joinedAt}-${index}`}>
                <div className={styles.kolAccountInfo}>
                  <div className={styles.kolAccountEditors}>
                    <Input
                      className={styles.kolAccountField}
                      placeholder="输入 handle"
                      value={account.handle}
                      onChange={(event) =>
                        handleKolAccountUpdate(index, { handle: event.target.value })
                      }
                    />
                    <Input
                      className={styles.kolAccountField}
                      placeholder="分组标签（可选）"
                      value={account.groupTag ?? ''}
                      onChange={(event) =>
                        handleKolAccountUpdate(index, {
                          groupTag: event.target.value ? event.target.value : null,
                        })
                      }
                    />
                  </div>
                  <div className={styles.kolAccountMeta}>
                    {account.groupTag ? <Tag color="blue">{account.groupTag}</Tag> : <Tag>未分组</Tag>}
                    <span>加入 {formatJoinedAt(account.joinedAt)}</span>
                  </div>
                </div>
                <div className={styles.kolAccountActions}>
                  <Switch
                    checked={account.enabled}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                    loading={savingToggle}
                    onChange={(checked) => void handleKolAccountSwitch(index, checked)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveKolAccount(index)}
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
            description="只从 KOL list 内账号取数，按最近 6 小时滚动窗口采集，默认按 views 从高到低排序。"
          />
        </section>
      </div>
    </section>
  )
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
