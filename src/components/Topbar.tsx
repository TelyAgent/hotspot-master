import { useNavigate } from 'react-router-dom'
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
      <span className="small">工作区 / {PAGE_LABELS[page]}</span>
      <div className="top-right">
        <i className="online"></i>
        <span className="small">自动响应链路正常</span>
        <button className="btn mini" onClick={() => go('tasks')}>
          待处理 5
        </button>
        <span className="avatar" title={user ?? ''}>
          {initials(user)}
        </span>
        <button className="btn mini" onClick={handleLogout}>
          退出
        </button>
      </div>
    </header>
  )
}
