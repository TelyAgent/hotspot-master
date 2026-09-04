import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Breadcrumb, Button, Space, Tooltip, Typography } from 'antd'
import { LogoutOutlined, ProfileOutlined } from '@ant-design/icons'
import { useApp } from '../context/AppContext'
import { PAGE_LABELS } from '../data/labels'

function initials(name: string | null): string {
  const trimmed = name?.trim() ?? ''
  if (!trimmed) return '--'
  return trimmed.slice(0, 2).toUpperCase()
}

export default function Topbar() {
  const { page, go, user, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="top">
      <Breadcrumb
        className="top-breadcrumb"
        items={[
          { title: '工作区' },
          { title: PAGE_LABELS[page] },
        ]}
      />
      <Space className="top-right" size={10}>
        <Badge status="processing" color="#1677ff" />
        <Typography.Text type="secondary" className="top-status">
          自动响应链路正常
        </Typography.Text>
        <Button size="small" icon={<ProfileOutlined />} onClick={() => go('events')}>
          待处理 5
        </Button>
        <Tooltip title={user ?? ''}>
          <Avatar className="avatar">{initials(user)}</Avatar>
        </Tooltip>
        <Button size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>
      </Space>
    </header>
  )
}
