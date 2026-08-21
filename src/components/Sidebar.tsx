import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import {
  BarChartOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  ProfileOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useApp } from '../context/AppContext'
import { NAV_ITEMS } from '../data/labels'
import type { PageId } from '../data/types'

const NAV_ICONS: Record<PageId, ReactNode> = {
  overview: <BarChartOutlined />,
  monitor: <ThunderboltOutlined />,
  future: <CalendarOutlined />,
  events: <FileSearchOutlined />,
  tasks: <ProfileOutlined />,
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

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: '运营工作区',
      children: NAV_ITEMS.map((item) => ({
        key: item.page,
        icon: NAV_ICONS[item.page],
        label: navLabel(item.label, item.sub),
      })),
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
        selectedKeys={[page]}
        items={items}
        onClick={({ key }) => go(key as PageId)}
      />
    </aside>
  )
}
