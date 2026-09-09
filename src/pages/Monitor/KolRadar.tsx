import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Button, Empty, List, Select, Space, Tabs, Tag } from 'antd'
import { EditOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useApp } from '../../context/AppContext'
import type { KolRadarFeedItem, KolRadarFeedResponse } from '../../api/types'
import styles from './Monitor.module.css'
import {
  CustomGroupEditorDrawer,
  CustomGroupManagerDrawer,
  getMatchedAccounts,
  useCustomMonitoringGroups,
  type CustomMonitoringGroup,
} from './CustomMonitoringGroups'
import { useAccountPool } from '../../hooks/useAccountPool'

type SortKey = 'views' | 'latest' | 'likes' | 'comments' | 'handle'

type RadarTab = {
  key: string
  label: ReactNode
  items: KolRadarFeedItem[]
  title: string
  description: string
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, '').toLowerCase()
}

export default function KolRadar({
  data,
  loading,
  collecting,
  error,
  onCollect,
}: {
  data: KolRadarFeedResponse | null
  loading: boolean
  collecting: boolean
  error: string | null
  onCollect: () => Promise<number>
}) {
  const { toast } = useApp()
  const customGroups = useCustomMonitoringGroups()
  const { accounts: accountPool } = useAccountPool()
  const [sortBy, setSortBy] = useState<SortKey>('views')
  const [activeTab, setActiveTab] = useState<string>('')
  const [managerOpen, setManagerOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomMonitoringGroup | null>(null)

  const openCreateGroup = () => {
    setEditingGroup(null)
    setEditorOpen(true)
  }

  const openEditGroup = (group: CustomMonitoringGroup) => {
    setManagerOpen(false)
    setEditingGroup(group)
    setEditorOpen(true)
  }

  const saveCustomGroup = (group: CustomMonitoringGroup) => {
    customGroups.saveGroup(group)
    setActiveTab(`custom:${group.id}`)
    setEditorOpen(false)
    setEditingGroup(null)
    toast(group.enabled ? '监控群组已保存并开启' : '监控群组已保存为草稿')
  }

  const deleteCustomGroup = (id: string) => {
    customGroups.deleteGroup(id)
    if (activeTab === `custom:${id}`) {
      setActiveTab('')
    }
    toast('监控群组已删除')
  }

  const items = data?.items ?? []
  const observedLabel = formatDateTime(data?.collectedAt || items[0]?.observedAt)

  const tabs = useMemo(() => {
    return customGroups.groups.map((group) => {
      const matchedHandles = getMatchedAccounts(group, accountPool).map((account) => normalizeHandle(account.handle))
      const nextItems = items.filter((item) => matchedHandles.includes(normalizeHandle(item.handle)))
      return {
        key: `custom:${group.id}`,
        label: (
          <span className={styles.customTopicLabel}>
            {group.name}
            <button
              type="button"
              className={styles.customTopicEditButton}
              aria-label={`编辑群组 ${group.name}`}
              onClick={(event) => {
                event.stopPropagation()
                openEditGroup(group)
              }}
            >
              <span className={styles.customTopicCount}>{matchedHandles.length}</span>
              <EditOutlined className={styles.customTopicEditIcon} />
            </button>
          </span>
        ),
        items: nextItems,
        title: group.name,
        description: group.purpose || '自定义群组过滤结果',
      }
    })
  }, [accountPool, customGroups.groups, items])

  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTab('')
      return
    }

    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key)
    }
  }, [activeTab, tabs])

  return (
    <>
      <div className={styles.monitorTabsHeader}>
        <div className={styles.monitorTabsHeaderActions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateGroup}>
            新建群组
          </Button>
          {tabs.length > 0 ? (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              aria-label="管理群组"
              onClick={() => setManagerOpen(true)}
            />
          ) : null}
        </div>
      </div>
      {tabs.length > 0 ? (
        <Tabs
          className={styles.topicTabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            children: (
              <RadarBoard
                title={tab.title}
                description={tab.description}
                items={tab.items}
                loading={loading}
                collecting={collecting}
                error={error}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                collectedLabel={observedLabel}
                onCollect={() => {
                  toast('已发起 KOL 雷达立即采集')
                  onCollect()
                    .then((count) => {
                      toast(`KOL 雷达采集完成，新增 ${count} 条原始帖子`)
                    })
                    .catch((e: unknown) => {
                      toast(e instanceof Error ? e.message : 'KOL 雷达采集失败')
                    })
                }}
                uniqueHandles={new Set(tab.items.map((item) => item.handle)).size}
              />
            ),
          }))}
        />
      ) : (
        <RadarBoard
          title="全部"
          description="当前还没有任何群组，下面展示所有 KOL 雷达数据"
          items={items}
          loading={loading}
          collecting={collecting}
          error={error}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          collectedLabel={observedLabel}
          onCollect={() => {
            toast('已发起 KOL 雷达立即采集')
            onCollect()
              .then((count) => {
                toast(`KOL 雷达采集完成，新增 ${count} 条原始帖子`)
              })
              .catch((e: unknown) => {
                toast(e instanceof Error ? e.message : 'KOL 雷达采集失败')
              })
          }}
          uniqueHandles={new Set(items.map((item) => item.handle)).size}
        />
      )}
      <CustomGroupEditorDrawer
        open={editorOpen}
        group={editingGroup}
        onClose={() => {
          setEditorOpen(false)
          setEditingGroup(null)
        }}
        onSave={saveCustomGroup}
      />
      <CustomGroupManagerDrawer
        open={managerOpen}
        groups={customGroups.groups}
        onClose={() => setManagerOpen(false)}
        onEdit={openEditGroup}
        onToggle={(id) => {
          customGroups.toggleGroup(id)
          toast('监控状态已更新')
        }}
        onDelete={deleteCustomGroup}
      />
    </>
  )
}

function RadarBoard({
  title,
  description,
  items,
  loading,
  collecting,
  error,
  sortBy,
  onSortByChange,
  collectedLabel,
  onCollect,
  uniqueHandles,
}: {
  title: string
  description: string
  items: KolRadarFeedItem[]
  loading: boolean
  collecting: boolean
  error: string | null
  sortBy: SortKey
  onSortByChange: (value: SortKey) => void
  collectedLabel: string
  onCollect: () => void
  uniqueHandles: number
}) {
  const sortedItems = useMemo(() => {
    const next = [...items]

    next.sort((a, b) => {
      if (sortBy === 'handle') return a.handle.localeCompare(b.handle)
      if (sortBy === 'latest') return new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
      if (sortBy === 'likes') return getMetricNumber(b.metrics, 'likes', 'likeCount') - getMetricNumber(a.metrics, 'likes', 'likeCount')
      if (sortBy === 'comments') {
        return getMetricNumber(b.metrics, 'replies', 'replyCount', 'commentCount', 'comments') -
          getMetricNumber(a.metrics, 'replies', 'replyCount', 'commentCount', 'comments')
      }
      return getMetricNumber(b.metrics, 'views', 'viewCount') - getMetricNumber(a.metrics, 'views', 'viewCount')
    })

    return next
  }, [items, sortBy])

  const handleCollect = () => {
    onCollect()
  }

  return (
    <>
      <div className={styles.topicToolbar}>
        <Space wrap>
          <span className="small">
            KOL 人驱动热点雷达每 6 小时自动采集；最近成功采集 {collectedLabel || '--'}
          </span>
          <Select
            style={{ minWidth: 170 }}
            value={sortBy}
            options={[
              { value: 'views', label: '按浏览量' },
              { value: 'latest', label: '按最新采集' },
              { value: 'likes', label: '按点赞数' },
              { value: 'comments', label: '按评论数' },
              { value: 'handle', label: '按账号名' },
            ]}
            onChange={(value) => onSortByChange(value)}
          />
        </Space>
        <Button type="primary" icon={<ReloadOutlined />} loading={collecting} onClick={handleCollect}>
          立即采集
        </Button>
      </div>
      <section className={styles.kolWrap}>
        <div className={styles.kolStats}>
          <div>
            <strong>{sortedItems.length}</strong>
            <span>最新帖子</span>
          </div>
          <div>
            <strong>{uniqueHandles}</strong>
            <span>活跃账号</span>
          </div>
          <div>
            <strong>{collectedLabel || '--'}</strong>
            <span>{title}</span>
          </div>
        </div>
        {loading ? (
          <div className="note">正在加载 KOL 雷达数据…</div>
        ) : error ? (
          <Alert type="error" message={`加载失败：${error}`} showIcon />
        ) : sortedItems.length === 0 ? (
          <Empty description={`暂无 ${title} 数据`} />
        ) : (
          <List
            className={styles.kolList}
            dataSource={sortedItems}
            renderItem={(item) => (
              <List.Item className={styles.kolListItem}>
                <div className={styles.kolCard}>
                  <div className={styles.kolCardTop}>
                    <div className={styles.kolCardTitleRow}>
                      <h3>{item.title}</h3>
                      <Tag color="blue">@{item.handle}</Tag>
                    </div>
                    <div className={styles.kolCardMeta}>
                      {item.authorName ? <span>{item.authorName}</span> : null}
                      {item.postType ? <span>{item.postType}</span> : null}
                      {item.publishedAt ? <span>发表于 {formatDateTime(item.publishedAt)}</span> : null}
                      <span>采集于 {formatDateTime(item.observedAt)}</span>
                    </div>
                  </div>
                  <p className={styles.kolSummary}>{item.summary}</p>
                  <div className={styles.kolMetricRow}>
                    <Tag color="blue">浏览量 {formatMetricNumber(getMetricNumber(item.metrics, 'views', 'viewCount'))}</Tag>
                    <Tag color="green">点赞 {formatMetricNumber(getMetricNumber(item.metrics, 'likes', 'likeCount'))}</Tag>
                    <Tag color="orange">评论 {formatMetricNumber(getMetricNumber(item.metrics, 'replies', 'replyCount', 'commentCount', 'comments'))}</Tag>
                  </div>
                  <div className={styles.kolCardFoot}>
                    <span className="muted">来源：X 人驱动雷达</span>
                    {item.url ? (
                      <Button type="link" href={item.url} target="_blank" rel="noreferrer">
                        打开帖子
                      </Button>
                    ) : null}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </section>
      <div className="note">
        这里展示的是 KOL 雷达采集结果，后续可继续接到内容创作或事件管理流程。
      </div>
      <Alert
        style={{ marginTop: 12 }}
        type="info"
        showIcon
        message="采集说明"
        description={description}
      />
    </>
  )
}

function getMetricNumber(metrics: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metrics[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

function formatMetricNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`
  }
  return String(value)
}
