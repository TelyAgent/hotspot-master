import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import {
  BarChartOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  LineChartOutlined,
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
  const selectedKey = page === 'monitor' ? monitorKey : page

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: '运营工作区',
      children: NAV_ITEMS.map((item) =>
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
        defaultOpenKeys={['monitor']}
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
          if (key !== 'monitor') go(key as PageId)
        }}
      />
    </aside>
  )
}
