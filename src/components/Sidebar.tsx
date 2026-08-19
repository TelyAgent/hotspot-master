import { useApp } from '../context/AppContext'
import { NAV_ITEMS } from '../data/labels'

export default function Sidebar() {
  const { page, go } = useApp()

  return (
    <aside className="side">
      <div className="brand">
        <span className="mark">PX</span>
        <div>
          热点运营系统
          <small>Operations OS</small>
        </div>
      </div>

      <div className="group">运营工作区</div>
      {NAV_ITEMS.map((n) => (
        <button
          key={n.page}
          className={`nav ${page === n.page ? 'active' : ''}`}
          onClick={() => go(n.page)}
        >
          <b>{n.label}</b>
          <small>{n.sub}</small>
        </button>
      ))}

      <div className="group">系统</div>
      <button
        className={`nav ${page === 'settings' ? 'active' : ''}`}
        onClick={() => go('settings')}
      >
        <b>系统设置</b>
        <small>Configuration</small>
      </button>
    </aside>
  )
}
