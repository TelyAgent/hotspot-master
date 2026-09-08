import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Popover,
  Select,
  Table,
  Tag,
} from 'antd'
import {
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import styles from './CustomMonitoringGroups.module.css'

const STORAGE_KEY = 'hotspot-monitor.custom-monitoring-groups.v1'

export type AccountType = 'official' | 'kol' | 'media' | 'project' | 'institution'

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'official', label: '官方账号' },
  { value: 'kol', label: 'KOL' },
  { value: 'media', label: '媒体' },
  { value: 'project', label: '项目方' },
  { value: 'institution', label: '机构' },
]

export interface MonitoringAccount {
  id: string
  handle: string
  name: string
  followers: number
  weeklyPosts: number
  avgComments: number
  avgReposts: number
  avgViews: number
  avgLikes: number
  region: string
  lastActiveAt: string
  accountType: AccountType
}

export interface CustomGroupFilters {
  followerMin: number | null
  followerMax: number | null
  minWeeklyPosts: number | null
  minAvgComments: number | null
  minAvgReposts: number | null
  minAvgViews: number | null
  minAvgLikes: number | null
  regions: string[]
  manualIncludes: string[]
  manualExcludes: string[]
}

export interface CustomMonitoringGroup {
  id: string
  name: string
  purpose: string
  enabled: boolean
  intervalHours: number
  filters: CustomGroupFilters
  createdAt: string
  updatedAt: string
  lastCollectedAt?: string
}

interface MockMonitoringPost {
  id: string
  account: MonitoringAccount
  summary: string
  body: string
  publishedAt: string
  views: number
  deltaViews: number
  previousRank: number | null
  status: 'hot_event_candidate' | 'watching'
}

const ACCOUNT_POOL: MonitoringAccount[] = [
  { id: 'polymarket', handle: 'Polymarket', name: 'Polymarket', followers: 1_400_000, weeklyPosts: 96, avgComments: 420, avgReposts: 1_600, avgViews: 780_000, avgLikes: 12_000, region: '美国', lastActiveAt: '2026-09-04T05:32:00Z', accountType: 'project' },
  { id: 'kalshi', handle: 'Kalshi', name: 'Kalshi', followers: 540_000, weeklyPosts: 82, avgComments: 260, avgReposts: 880, avgViews: 430_000, avgLikes: 7_800, region: '美国', lastActiveAt: '2026-09-04T05:18:00Z', accountType: 'project' },
  { id: 'watcherguru', handle: 'WatcherGuru', name: 'Watcher.Guru', followers: 2_900_000, weeklyPosts: 124, avgComments: 680, avgReposts: 2_800, avgViews: 1_800_000, avgLikes: 24_000, region: '美国', lastActiveAt: '2026-09-04T05:06:00Z', accountType: 'kol' },
  { id: 'coindesk', handle: 'CoinDesk', name: 'CoinDesk', followers: 3_200_000, weeklyPosts: 118, avgComments: 350, avgReposts: 1_300, avgViews: 620_000, avgLikes: 9_600, region: '美国', lastActiveAt: '2026-09-04T04:52:00Z', accountType: 'media' },
  { id: 'reuters', handle: 'Reuters', name: 'Reuters', followers: 26_000_000, weeklyPosts: 210, avgComments: 520, avgReposts: 2_100, avgViews: 2_400_000, avgLikes: 32_000, region: '英国', lastActiveAt: '2026-09-04T05:40:00Z', accountType: 'media' },
  { id: 'business', handle: 'business', name: 'Bloomberg', followers: 11_600_000, weeklyPosts: 184, avgComments: 410, avgReposts: 1_500, avgViews: 1_650_000, avgLikes: 22_000, region: '美国', lastActiveAt: '2026-09-04T05:35:00Z', accountType: 'media' },
  { id: 'openai', handle: 'OpenAI', name: 'OpenAI', followers: 4_800_000, weeklyPosts: 22, avgComments: 1_600, avgReposts: 6_800, avgViews: 5_800_000, avgLikes: 105_000, region: '美国', lastActiveAt: '2026-09-03T22:20:00Z', accountType: 'official' },
  { id: 'anthropicai', handle: 'AnthropicAI', name: 'Anthropic', followers: 1_100_000, weeklyPosts: 18, avgComments: 1_200, avgReposts: 4_700, avgViews: 3_600_000, avgLikes: 78_000, region: '美国', lastActiveAt: '2026-09-03T19:10:00Z', accountType: 'official' },
  { id: 'techcrunch', handle: 'TechCrunch', name: 'TechCrunch', followers: 10_400_000, weeklyPosts: 136, avgComments: 260, avgReposts: 980, avgViews: 510_000, avgLikes: 8_500, region: '美国', lastActiveAt: '2026-09-04T05:27:00Z', accountType: 'media' },
  { id: 'a16z', handle: 'a16z', name: 'Andreessen Horowitz', followers: 810_000, weeklyPosts: 31, avgComments: 340, avgReposts: 1_200, avgViews: 390_000, avgLikes: 9_200, region: '美国', lastActiveAt: '2026-09-03T23:42:00Z', accountType: 'institution' },
  { id: 'nikkeiasia', handle: 'NikkeiAsia', name: 'Nikkei Asia', followers: 470_000, weeklyPosts: 88, avgComments: 140, avgReposts: 420, avgViews: 180_000, avgLikes: 3_300, region: '日本', lastActiveAt: '2026-09-04T04:31:00Z', accountType: 'media' },
  { id: 'cointelegraph', handle: 'Cointelegraph', name: 'Cointelegraph', followers: 2_400_000, weeklyPosts: 105, avgComments: 390, avgReposts: 1_600, avgViews: 760_000, avgLikes: 12_800, region: '未知', lastActiveAt: '2026-09-04T05:11:00Z', accountType: 'media' },
]

const REGION_OPTIONS = ['美国', '英国', '日本', '韩国', '新加坡', '未知'].map((value) => ({ value, label: value }))
const INTERVAL_OPTIONS = [
  { value: 1, label: '每 1 小时' },
  { value: 3, label: '每 3 小时' },
  { value: 6, label: '每 6 小时' },
  { value: 12, label: '每 12 小时' },
  { value: 24, label: '每天' },
]

export function inferAccountType(handle: string): AccountType {
  const normalized = handle.replace(/^@/, '').toLowerCase()
  if (['openai', 'anthropicai', 'googledeepmind', 'metaai', 'xai', 'microsoft'].includes(normalized)) {
    return 'official'
  }
  if (['reuters', 'ap', 'bbcworld', 'business', 'bloomberg', 'techcrunch', 'coindesk', 'cointelegraph', 'nikkeiasia'].includes(normalized)) {
    return 'media'
  }
  if (['polymarket', 'kalshi'].includes(normalized)) return 'project'
  if (['a16z', 'ycombinator'].includes(normalized)) return 'institution'
  return 'kol'
}

export function SourceAccountFilter({
  value,
  onChange,
}: {
  value: AccountType[]
  onChange: (value: AccountType[]) => void
}) {
  const active = value.length > 0
  const content = (
    <div className={styles.sourceAccountFilterPanel} onClick={(event) => event.stopPropagation()}>
      <div className={styles.sourceAccountFilterHead}>
        <b>账号类型</b>
        <Button type="link" size="small" disabled={!active} onClick={() => onChange([])}>清除</Button>
      </div>
      <Checkbox.Group
        className={styles.sourceAccountFilterOptions}
        options={ACCOUNT_TYPE_OPTIONS}
        value={value}
        onChange={(next) => onChange(next as AccountType[])}
      />
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomLeft">
      <button
        type="button"
        className={`${styles.sourceAccountFilterTrigger} ${active ? styles.sourceAccountFilterActive : ''}`}
        aria-label={active ? `来源账号，已筛选 ${value.length} 类` : '筛选来源账号'}
        onClick={(event) => event.stopPropagation()}
      >
        来源账号
        <FilterOutlined />
        {active ? <i>{value.length}</i> : null}
      </button>
    </Popover>
  )
}

const EMPTY_FILTERS: CustomGroupFilters = {
  followerMin: 100_000,
  followerMax: null,
  minWeeklyPosts: 5,
  minAvgComments: null,
  minAvgReposts: null,
  minAvgViews: null,
  minAvgLikes: null,
  regions: [],
  manualIncludes: [],
  manualExcludes: [],
}

export function useCustomMonitoringGroups() {
  const [groups, setGroups] = useState<CustomMonitoringGroup[]>(loadGroups)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  const saveGroup = (draft: CustomMonitoringGroup) => {
    setGroups((current) => {
      const exists = current.some((group) => group.id === draft.id)
      return exists
        ? current.map((group) => (group.id === draft.id ? draft : group))
        : [...current, draft]
    })
  }

  const deleteGroup = (id: string) => {
    setGroups((current) => current.filter((group) => group.id !== id))
  }

  const toggleGroup = (id: string) => {
    setGroups((current) => current.map((group) => (
      group.id === id
        ? { ...group, enabled: !group.enabled, updatedAt: new Date().toISOString() }
        : group
    )))
  }

  const markCollected = (id: string) => {
    setGroups((current) => current.map((group) => (
      group.id === id
        ? { ...group, lastCollectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : group
    )))
  }

  return { groups, saveGroup, deleteGroup, toggleGroup, markCollected }
}

export function getMatchedAccounts(group: CustomMonitoringGroup) {
  const includeSet = new Set(group.filters.manualIncludes)
  const excludeSet = new Set(group.filters.manualExcludes)

  return ACCOUNT_POOL.filter((account) => {
    if (excludeSet.has(account.id)) return false
    if (includeSet.has(account.id)) return true
    if (group.filters.followerMin != null && account.followers < group.filters.followerMin) return false
    if (group.filters.followerMax != null && account.followers > group.filters.followerMax) return false
    if (group.filters.minWeeklyPosts != null && account.weeklyPosts < group.filters.minWeeklyPosts) return false
    if (group.filters.minAvgComments != null && account.avgComments < group.filters.minAvgComments) return false
    if (group.filters.minAvgReposts != null && account.avgReposts < group.filters.minAvgReposts) return false
    if (group.filters.minAvgViews != null && account.avgViews < group.filters.minAvgViews) return false
    if (group.filters.minAvgLikes != null && account.avgLikes < group.filters.minAvgLikes) return false
    if (group.filters.regions.length && !group.filters.regions.includes(account.region)) return false
    return true
  })
}

export function CustomGroupEditorDrawer({
  open,
  group,
  onClose,
  onSave,
}: {
  open: boolean
  group: CustomMonitoringGroup | null
  onClose: () => void
  onSave: (group: CustomMonitoringGroup) => void
}) {
  const [draft, setDraft] = useState<CustomMonitoringGroup>(() => createDraft(group))
  const [refreshingPool, setRefreshingPool] = useState(false)
  const [previewUpdatedAt, setPreviewUpdatedAt] = useState(() => new Date().toISOString())

  useEffect(() => {
    if (open) {
      setDraft(createDraft(group))
      setPreviewUpdatedAt(new Date().toISOString())
    }
  }, [group, open])

  const matchedAccounts = useMemo(() => getMatchedAccounts(draft), [draft])
  const canEnable = matchedAccounts.length > 0
  const rangeInvalid = draft.filters.followerMin != null
    && draft.filters.followerMax != null
    && draft.filters.followerMin > draft.filters.followerMax

  const patchFilters = (patch: Partial<CustomGroupFilters>) => {
    setDraft((current) => ({
      ...current,
      filters: { ...current.filters, ...patch },
    }))
  }

  const save = () => {
    if (!draft.name.trim() || rangeInvalid) return
    const now = new Date().toISOString()
    onSave({
      ...draft,
      name: draft.name.trim(),
      purpose: draft.purpose.trim(),
      enabled: canEnable ? draft.enabled : false,
      updatedAt: now,
    })
  }

  const refreshAccountPool = async () => {
    setRefreshingPool(true)
    await new Promise((resolve) => window.setTimeout(resolve, 600))
    setPreviewUpdatedAt(new Date().toISOString())
    setRefreshingPool(false)
  }

  return (
    <Drawer
      title={group ? '编辑监控群组' : '新建监控群组'}
      size={720}
      open={open}
      onClose={onClose}
      className={styles.groupDrawer}
      footer={(
        <div className={styles.drawerFooter}>
          <span>{matchedAccounts.length} 个账号符合当前条件</span>
          <div>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" disabled={!draft.name.trim() || rangeInvalid} onClick={save}>
              {canEnable && draft.enabled ? '保存并开启' : '保存草稿'}
            </Button>
          </div>
        </div>
      )}
    >
      <div className={styles.drawerBody}>
        <section className={styles.formSection}>
          <div className={styles.sectionHead}>
            <div>
              <h3>基本信息</h3>
              <p>用于识别群组，并说明这组账号的监控目的。</p>
            </div>
            <Tag color="blue">Twitter / X</Tag>
          </div>
          <Form layout="vertical">
            <Form.Item label="群组名称" required>
              <Input
                value={draft.name}
                maxLength={24}
                showCount
                placeholder="例如：AI 创业者观察"
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </Form.Item>
            <Form.Item label="监控目的">
              <Input.TextArea
                rows={2}
                value={draft.purpose}
                placeholder="说明希望从这组账号中发现什么信号"
                onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))}
              />
            </Form.Item>
          </Form>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionHead}>
            <div>
              <h3>账号筛选条件</h3>
              <p>不同条件之间为“且”，同一区域内多选为“或”。</p>
            </div>
            <Tag>{matchedAccounts.length} 个匹配</Tag>
          </div>
          <div className={styles.filterGrid}>
            <div className={styles.fieldBlock}>
              <label>粉丝量范围</label>
              <div className={styles.rangeFields}>
                <InputNumber
                  min={0}
                  step={10_000}
                  value={draft.filters.followerMin}
                  placeholder="最低"
                  onChange={(value) => patchFilters({ followerMin: value == null ? null : Number(value) })}
                />
                <span>至</span>
                <InputNumber
                  min={0}
                  step={10_000}
                  value={draft.filters.followerMax}
                  placeholder="不限"
                  status={rangeInvalid ? 'error' : undefined}
                  onChange={(value) => patchFilters({ followerMax: value == null ? null : Number(value) })}
                />
              </div>
              {rangeInvalid ? <small className={styles.errorText}>最高粉丝量不能低于最低粉丝量</small> : null}
            </div>
            <div className={styles.fieldBlock}>
              <label>近 7 天最少发文</label>
              <InputNumber
                min={0}
                max={500}
                value={draft.filters.minWeeklyPosts}
                onChange={(value) => patchFilters({ minWeeklyPosts: value == null ? null : Number(value) })}
              />
            </div>
            <div className={`${styles.fieldBlock} ${styles.fullField}`}>
              <div className={styles.metricFilterHead}>
                <label>近 7 天单帖平均互动</label>
                <small>输入最低值；留空表示不限</small>
              </div>
              <div className={styles.engagementGrid}>
                <div>
                  <span>评论数</span>
                  <InputNumber
                    min={0}
                    step={100}
                    value={draft.filters.minAvgComments}
                    placeholder="不限"
                    onChange={(value) => patchFilters({ minAvgComments: value == null ? null : Number(value) })}
                  />
                </div>
                <div>
                  <span>转发数</span>
                  <InputNumber
                    min={0}
                    step={100}
                    value={draft.filters.minAvgReposts}
                    placeholder="不限"
                    onChange={(value) => patchFilters({ minAvgReposts: value == null ? null : Number(value) })}
                  />
                </div>
                <div>
                  <span>浏览量（View）</span>
                  <InputNumber
                    min={0}
                    step={1_000}
                    value={draft.filters.minAvgViews}
                    placeholder="不限"
                    onChange={(value) => patchFilters({ minAvgViews: value == null ? null : Number(value) })}
                  />
                </div>
                <div>
                  <span>点赞数（Like）</span>
                  <InputNumber
                    min={0}
                    step={100}
                    value={draft.filters.minAvgLikes}
                    placeholder="不限"
                    onChange={(value) => patchFilters({ minAvgLikes: value == null ? null : Number(value) })}
                  />
                </div>
              </div>
            </div>
            <div className={`${styles.fieldBlock} ${styles.fullField}`}>
              <label>账号区域</label>
              <Select
                mode="multiple"
                allowClear
                value={draft.filters.regions}
                options={REGION_OPTIONS}
                placeholder="全部区域"
                onChange={(regions) => patchFilters({ regions })}
              />
              <small>区域来自账号公开资料，无法识别的账号会归入“未知”。</small>
            </div>
            <div className={`${styles.fieldBlock} ${styles.fullField}`}>
              <label>手动纳入</label>
              <Select
                mode="multiple"
                allowClear
                value={draft.filters.manualIncludes}
                options={accountOptions(draft.filters.manualExcludes)}
                placeholder="可选；手动纳入会覆盖筛选条件"
                onChange={(manualIncludes) => patchFilters({ manualIncludes })}
              />
            </div>
            <div className={`${styles.fieldBlock} ${styles.fullField}`}>
              <label>手动排除</label>
              <Select
                mode="multiple"
                allowClear
                value={draft.filters.manualExcludes}
                options={accountOptions(draft.filters.manualIncludes)}
                placeholder="可选；排除优先级最高"
                onChange={(manualExcludes) => patchFilters({ manualExcludes })}
              />
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionHead}>
            <div>
              <h3>匹配账号预览</h3>
              <p>账号池数据更新时间：{formatTime(previewUpdatedAt)}</p>
            </div>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={refreshingPool}
              onClick={() => void refreshAccountPool()}
            >
              刷新账号池
            </Button>
          </div>
          {matchedAccounts.length ? (
            <Table
              size="small"
              rowKey="id"
              columns={ACCOUNT_COLUMNS}
              dataSource={matchedAccounts}
              pagination={{ pageSize: 5, size: 'small', showSizeChanger: false }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的账号，请放宽筛选条件" />
          )}
        </section>

        {!canEnable && draft.name.trim() ? (
          <Alert type="warning" showIcon title="当前没有匹配账号，群组会保存为草稿且不会启动采集。" />
        ) : null}
      </div>
    </Drawer>
  )
}

export function CustomGroupManagerDrawer({
  open,
  groups,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: {
  open: boolean
  groups: CustomMonitoringGroup[]
  onClose: () => void
  onEdit: (group: CustomMonitoringGroup) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Drawer title="管理监控群组" size={620} open={open} onClose={onClose} className={styles.groupDrawer}>
      <div className={styles.managerBody}>
        <Alert title="自定义群组按筛选规则每天更新账号成员；手动纳入和排除始终优先。" showIcon />
        {groups.length ? groups.map((group) => {
          const accounts = getMatchedAccounts(group)
          return (
            <section className={styles.managerItem} key={group.id}>
              <div className={styles.managerItemHead}>
                <div>
                  <div className={styles.managerTitleLine}>
                    <h3>{group.name}</h3>
                    <Tag color={group.enabled ? 'processing' : 'default'}>{group.enabled ? '监控中' : '已暂停'}</Tag>
                  </div>
                  <p>{group.purpose || '未填写监控目的'}</p>
                </div>
                <div className={styles.managerActions}>
                  <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(group)}>编辑</Button>
                  <Button
                    size="small"
                    icon={group.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    disabled={!group.enabled && accounts.length === 0}
                    onClick={() => onToggle(group.id)}
                  >
                    {group.enabled ? '暂停' : '开启'}
                  </Button>
                  <Popconfirm
                    title="删除这个监控群组？"
                    description="删除后不会影响历史榜单数据。"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(group.id)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </div>
              </div>
              <div className={styles.managerMeta}>
                <span><TeamOutlined /> {accounts.length} 个账号</span>
                <span>每 {group.intervalHours} 小时采集</span>
                <span>{formatFilterSummary(group.filters)}</span>
              </div>
            </section>
          )
        }) : (
          <Empty description="还没有自定义监控群组" />
        )}
      </div>
    </Drawer>
  )
}

export function CustomGroupAccountsDrawer({
  group,
  onClose,
}: {
  group: CustomMonitoringGroup | null
  onClose: () => void
}) {
  const accounts = group ? getMatchedAccounts(group) : []
  return (
    <Drawer
      title={group ? `${group.name} · 监控账号` : '监控账号'}
      size={620}
      open={Boolean(group)}
      onClose={onClose}
      className={styles.groupDrawer}
    >
      <div className={styles.managerBody}>
        <Alert title={`当前账号快照共 ${accounts.length} 个，系统每天按筛选规则重新计算。`} showIcon />
        <Table rowKey="id" size="small" columns={ACCOUNT_COLUMNS} dataSource={accounts} pagination={false} />
      </div>
    </Drawer>
  )
}

export function CustomGroupDetail({
  group,
  onEdit,
  onViewAccounts,
}: {
  group: CustomMonitoringGroup
  onEdit: () => void
  onViewAccounts: () => void
}) {
  const accounts = getMatchedAccounts(group)
  const mockPosts = useMemo(() => buildMockPosts(group, accounts), [accounts, group])
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType[]>([])
  const visibleMockPosts = useMemo(() => (
    mockPosts
      .map((post, index) => ({ post, rank: index + 1 }))
      .filter(({ post }) => !accountTypeFilter.length || accountTypeFilter.includes(post.account.accountType))
  ), [accountTypeFilter, mockPosts])
  const hotCandidates = mockPosts.filter((post) => post.status === 'hot_event_candidate').length
  const calculatedAt = group.lastCollectedAt ?? group.updatedAt

  return (
    <>
      <section className={styles.customSummary}>
        <div>
          <span>当前群组 · 自定义</span>
          <h1>{group.name}帖子榜</h1>
          <p>{group.enabled ? '监控中' : '已暂停'} · 每 {group.intervalHours} 小时采集 · {group.purpose || '未填写监控目的'}</p>
        </div>
        <div>
          <span>圈内上榜</span>
          <strong>{mockPosts.length}</strong>
          <p>条帖子</p>
        </div>
        <div>
          <span>Hot Event 候选</span>
          <strong>{hotCandidates}</strong>
          <p>待事件判断</p>
        </div>
        <div>
          <span>榜单计算时间</span>
          <strong className={styles.timeValue}>{formatTime(calculatedAt)}</strong>
          <p>Mock 排名已更新</p>
        </div>
        <div>
          <span>监控账号</span>
          <button type="button" aria-label={`查看 ${accounts.length} 个监控账号`} onClick={onViewAccounts}>{accounts.length}</button>
          <p>个</p>
        </div>
      </section>
      <div className={styles.customActions}>
        <div className={styles.mockNotice}>
          <Tag color="blue">Mock 数据</Tag>
          <span>用于前端交互演示 · 最近刷新 {formatTime(calculatedAt)}</span>
        </div>
      </div>
      <section className={styles.mockBoard}>
        <div className={styles.mockBoardHead}>
          <div>
            <h2>{group.name} · 圈内榜</h2>
            <p>当前群组帖子 Top 10 · 基于匹配账号生成</p>
          </div>
          {!group.enabled ? <Tag>群组已暂停</Tag> : null}
        </div>
        <div className={styles.mockTrendHead}>
          <span>排名</span>
          <span>热门内容</span>
          <SourceAccountFilter value={accountTypeFilter} onChange={setAccountTypeFilter} />
          <span>当前浏览量</span>
          <span>本轮新增</span>
          <span>榜单变化</span>
          <span>状态</span>
        </div>
        <div className={styles.mockLeaderboard}>
          {visibleMockPosts.length ? visibleMockPosts.map(({ post, rank }) => {
            const expanded = expandedPost === post.id
            return (
              <article key={post.id} className={styles.mockRankItem}>
                <button
                  type="button"
                  className={styles.mockTrendRow}
                  aria-expanded={expanded}
                  onClick={() => setExpandedPost(expanded ? null : post.id)}
                >
                  <span className={`${styles.mockRankBadge} ${rank <= 3 ? styles.mockRankHot : ''}`}>{rank}</span>
                  <span className={styles.mockContentCell}>
                    <b>{post.summary}</b>
                    <small className="muted">{group.name} · 发布 {formatTime(post.publishedAt)}</small>
                  </span>
                  <span className={styles.mockAuthor}>
                    <i>{post.account.name.slice(0, 1).toUpperCase()}</i>
                    @{post.account.handle}
                  </span>
                  <strong>{formatCompact(post.views)}</strong>
                  <span className={styles.mockPositive}>+{formatCompact(post.deltaViews)}</span>
                  <span>{formatMockRankChange(post.previousRank, rank)}</span>
                  <Tag color={post.status === 'hot_event_candidate' ? 'orange' : 'processing'}>
                    {post.status === 'hot_event_candidate' ? 'Hot Event 候选' : '观察中'}
                  </Tag>
                </button>
                {expanded ? (
                  <div className={styles.mockPostPanel}>
                    <div className={styles.mockPostMeta}>
                      <span>来源账号：@{post.account.handle}</span>
                      <span>账号区域：{post.account.region}</span>
                      <span>粉丝量：{formatCompact(post.account.followers)}</span>
                      <Tag color="blue">Mock</Tag>
                    </div>
                    <p>{post.body}</p>
                    <div className={styles.mockPostMetrics}>
                      <span>浏览 {formatCompact(post.views)}</span>
                      <span>模拟新增 {formatCompact(post.deltaViews)}</span>
                      <span>近 7 天发文 {post.account.weeklyPosts} 条</span>
                      <span>单帖平均评论 {formatCompact(post.account.avgComments)}</span>
                      <span>转发 {formatCompact(post.account.avgReposts)}</span>
                      <span>点赞 {formatCompact(post.account.avgLikes)}</span>
                    </div>
                    <MockViralFormula post={post} />
                  </div>
                ) : null}
              </article>
            )
          }) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={mockPosts.length ? '当前账号类型没有匹配帖子' : '当前筛选条件没有匹配账号，请编辑群组后再生成 Mock 榜单'}
            >
              {mockPosts.length ? (
                <Button onClick={() => setAccountTypeFilter([])}>清除账号类型筛选</Button>
              ) : (
                <Button onClick={onEdit}>编辑筛选条件</Button>
              )}
            </Empty>
          )}
        </div>
      </section>
    </>
  )
}

function MockViralFormula({ post }: { post: MockMonitoringPost }) {
  const factors = buildMockViralFormula(post)
  return (
    <section className={styles.viralFormula}>
      <div className={styles.viralFormulaHead}>
        <span><BulbOutlined /> 爆款公式</span>
        <Tag color="blue">规则提炼</Tag>
      </div>
      <strong>{factors.join(' × ')}</strong>
      <p>提炼依据：账号影响力、单帖互动均值、浏览增长和内容主题结构。</p>
    </section>
  )
}

function buildMockViralFormula(post: MockMonitoringPost) {
  const engagement = post.account.avgComments + post.account.avgReposts + post.account.avgLikes
  return [
    post.account.followers >= 3_000_000 ? '权威账号背书' : '垂直账号人设',
    engagement >= 20_000 ? '高互动预期' : '可讨论切口',
    post.deltaViews >= 20_000 ? '快速增长窗口' : '稳定增量',
    post.status === 'hot_event_candidate' ? '事件候选信号' : '持续观察价值',
    '核心结论前置',
  ]
}

function buildMockPosts(group: CustomMonitoringGroup, accounts: MonitoringAccount[]): MockMonitoringPost[] {
  const calculatedAt = new Date(group.lastCollectedAt ?? group.updatedAt).getTime()
  const refreshSeed = Math.floor(calculatedAt / 1000) % 997

  return accounts
    .map((account, index) => {
      const seed = hashString(`${group.id}:${account.id}`)
      const viewRate = 0.78 + (seed % 37) / 100
      const views = Math.max(1_200, Math.round(account.avgViews * viewRate) + ((refreshSeed * (index + 3)) % 6_000))
      const deltaViews = Math.max(260, Math.round(views * (0.05 + (seed % 9) / 100)))
      const subject = group.purpose || `近期围绕“${group.name}”的讨论热度持续上升，多个新信号值得关注。`
      return {
        id: `${group.id}-${account.id}`,
        account,
        summary: `${account.name} 发布了一条与${group.name}相关的新动态：${truncateMockText(subject, 30)}`,
        body: `【Mock 帖子】${account.name} 分享了关于“${group.name}”的最新观察。${subject} 当前数据仅用于演示筛选、排名、状态和详情展开交互。`,
        publishedAt: new Date(calculatedAt - (index + 1) * 17 * 60 * 1000).toISOString(),
        views,
        deltaViews,
        previousRank: index % 4 === 0 ? null : index + 1 + ((seed % 3) - 1),
        status: index < 2 || views > 180_000 ? 'hot_event_candidate' : 'watching',
      } satisfies MockMonitoringPost
    })
    .sort((left, right) => right.views - left.views)
    .slice(0, 10)
}

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 0)
}

function truncateMockText(value: string, maxLength: number) {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}…` : compact
}

function formatMockRankChange(previousRank: number | null, rank: number) {
  if (previousRank == null) return '新上榜'
  const delta = previousRank - rank
  if (delta > 0) return `↑ ${delta}`
  if (delta < 0) return `↓ ${Math.abs(delta)}`
  return '—'
}

function createDraft(group: CustomMonitoringGroup | null): CustomMonitoringGroup {
  const now = new Date().toISOString()
  if (group) {
    const cloned = structuredClone(group)
    return { ...cloned, filters: normalizeFilters(cloned.filters) }
  }
  return {
    id: `custom-${Date.now()}`,
    name: '',
    purpose: '',
    enabled: true,
    intervalHours: 3,
    filters: { ...EMPTY_FILTERS },
    createdAt: now,
    updatedAt: now,
  }
}

function loadGroups(): CustomMonitoringGroup[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map((group) => ({ ...group, filters: normalizeFilters(group.filters) }))
      : []
  } catch {
    return []
  }
}

function normalizeFilters(filters?: Partial<CustomGroupFilters>): CustomGroupFilters {
  return {
    ...EMPTY_FILTERS,
    ...filters,
    regions: Array.isArray(filters?.regions) ? filters.regions : [],
    manualIncludes: Array.isArray(filters?.manualIncludes) ? filters.manualIncludes : [],
    manualExcludes: Array.isArray(filters?.manualExcludes) ? filters.manualExcludes : [],
  }
}

function accountOptions(disabledIds: string[]) {
  const disabled = new Set(disabledIds)
  return ACCOUNT_POOL.map((account) => ({
    value: account.id,
    label: `${account.name} · @${account.handle}`,
    disabled: disabled.has(account.id),
  }))
}

const ACCOUNT_COLUMNS = [
  {
    title: '账号',
    key: 'account',
    render: (_: unknown, account: MonitoringAccount) => (
      <div className={styles.accountCell}>
        <i>{account.name.slice(0, 1).toUpperCase()}</i>
        <span><b>{account.name}</b><small>@{account.handle}</small></span>
      </div>
    ),
  },
  {
    title: '粉丝量',
    dataIndex: 'followers',
    key: 'followers',
    width: 100,
    render: (value: number) => formatCompact(value),
  },
  {
    title: '近 7 天发文',
    dataIndex: 'weeklyPosts',
    key: 'weeklyPosts',
    width: 105,
    render: (value: number) => `${value} 条`,
  },
  {
    title: '单帖平均互动',
    key: 'engagement',
    width: 190,
    render: (_: unknown, account: MonitoringAccount) => (
      <div className={styles.engagementCell}>
        <span>评论 {formatCompact(account.avgComments)} · 转发 {formatCompact(account.avgReposts)}</span>
        <small>浏览 {formatCompact(account.avgViews)} · 点赞 {formatCompact(account.avgLikes)}</small>
      </div>
    ),
  },
  { title: '区域', dataIndex: 'region', key: 'region', width: 80 },
]

function formatCompact(value: number) {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFilterSummary(filters: CustomGroupFilters) {
  const parts: string[] = []
  if (filters.followerMin != null) parts.push(`粉丝 ≥ ${formatCompact(filters.followerMin)}`)
  if (filters.followerMax != null) parts.push(`粉丝 ≤ ${formatCompact(filters.followerMax)}`)
  if (filters.minWeeklyPosts != null) parts.push(`周发文 ≥ ${filters.minWeeklyPosts}`)
  if (filters.minAvgComments != null) parts.push(`评论 ≥ ${formatCompact(filters.minAvgComments)}`)
  if (filters.minAvgReposts != null) parts.push(`转发 ≥ ${formatCompact(filters.minAvgReposts)}`)
  if (filters.minAvgViews != null) parts.push(`浏览 ≥ ${formatCompact(filters.minAvgViews)}`)
  if (filters.minAvgLikes != null) parts.push(`点赞 ≥ ${formatCompact(filters.minAvgLikes)}`)
  if (filters.regions.length) parts.push(filters.regions.join('、'))
  return parts.join(' · ') || '全部账号'
}
