import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import {
  BarChartOutlined,
  BulbOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LineChartOutlined,
  ProfileOutlined,
  ReadOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  XOutlined,
  YoutubeOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { NAV_ITEMS } from '../data/labels'
import type { PageId } from '../data/types'

const NAV_ICONS: Record<PageId, ReactNode> = {
  overview: <BarChartOutlined />,
  monitor: <ThunderboltOutlined />,
  decision: <BulbOutlined />,
  future: <CalendarOutlined />,
  events: <FileSearchOutlined />,
  insights: <LineChartOutlined />,
  settings: <SettingOutlined />,
}

function navLabel(label: string, sub: string) {
  return (
    <span className="nav-label">
      <b>{label}</b>
      <small>{sub}</small>
    </span>
  )
}

export default function Sidebar() {
  const { page, go } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const monitorKey = location.pathname.startsWith('/monitor/youtube') ? 'monitor-youtube' : 'monitor-twitter'
  const decisionKey = location.pathname.startsWith('/decision/inbox')
    ? 'decision-inbox'
    : location.pathname.startsWith('/decision/creation')
      ? 'decision-creation'
      : location.pathname.startsWith('/decision/publish')
        ? 'decision-publish'
      : location.pathname.startsWith('/decision/records')
        ? 'decision-records'
        : 'decision-recommendations'
  const selectedKey = page === 'monitor' ? monitorKey : page === 'decision' ? decisionKey : page

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: '运营工作区',
      children: [
        ...NAV_ITEMS.map((item) =>
          item.page === 'monitor'
            ? {
              key: 'monitor',
              icon: NAV_ICONS.monitor,
              label: navLabel(item.label, item.sub),
              children: [
                {
                  key: 'monitor-twitter',
                  icon: <XOutlined />,
                  label: navLabel('Twitter', 'X Trends'),
                },
                {
                  key: 'monitor-youtube',
                  icon: <YoutubeOutlined />,
                  label: navLabel('YouTube', 'Video Trends'),
                },
              ],
            }
            : {
              key: item.page,
              icon: NAV_ICONS[item.page],
              label: navLabel(item.label, item.sub),
            },
        ),
        {
          key: 'decision',
          icon: NAV_ICONS.decision,
          label: navLabel('运营决策', 'Decision Center'),
          children: [
            {
              key: 'decision-recommendations',
              icon: <BulbOutlined />,
              label: navLabel('选题推荐', 'Recommendations'),
            },
            {
              key: 'decision-inbox',
              icon: <InboxOutlined />,
              label: navLabel('上下文收件箱', 'Context Inbox'),
            },
            {
              key: 'decision-creation',
              icon: <ReadOutlined />,
              label: navLabel('AI创作中心', 'AI Creation Center'),
            },
            {
              key: 'decision-publish',
              icon: <SendOutlined />,
              label: navLabel('内容发布', 'Content Publishing'),
            },
            {
              key: 'decision-records',
              icon: <ProfileOutlined />,
              label: navLabel('决策记录', 'Decision Records'),
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      label: '系统',
      children: [
        {
          key: 'settings',
          icon: NAV_ICONS.settings,
          label: navLabel('系统设置', 'Configuration'),
        },
      ],
    },
  ]

  return (
    <aside className="side">
      <div className="brand">
        <span className="mark">PX</span>
        <div>
          热点运营系统
          <small>Operations OS</small>
        </div>
      </div>
      <Menu
        className="side-menu"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={['monitor', 'decision']}
        items={items}
        onClick={({ key }) => {
          if (key === 'monitor-twitter') {
            go('monitor')
            return
          }
          if (key === 'monitor-youtube') {
            navigate('/monitor/youtube')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key === 'decision-recommendations') {
            navigate('/decision/recommendations')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key === 'decision-inbox') {
            navigate('/decision/inbox')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key === 'decision-creation') {
            navigate('/decision/creation')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key === 'decision-publish') {
            navigate('/decision/publish')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key === 'decision-records') {
            navigate('/decision/records')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
          }
          if (key !== 'monitor' && key !== 'decision') go(key as PageId)
        }}
      />
    </aside>
  )
}
