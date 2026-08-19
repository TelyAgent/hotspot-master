import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import styles from './Login.module.css'

export default function Login() {
  const { isAuthenticated, login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) return <Navigate to="/overview" replace />

  // 登录后回到被拦截前的页面（无则回到总览）
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/overview'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    login(username.trim())
    navigate(from, { replace: true })
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <span className="mark">PX</span>
          <div>
            热点运营系统
            <small>Operations OS</small>
          </div>
        </div>

        <h1 className={styles.title}>登录</h1>
        <p className="small">登录以进入热点监控与运营工作区</p>

        <div className="field" style={{ marginTop: 20 }}>
          <label>用户名</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoFocus
          />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>

        {error && (
          <div className="note warning" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn primary"
          style={{ width: '100%', marginTop: 16, padding: '10px 0' }}
        >
          登录
        </button>

        <p className="small" style={{ marginTop: 14, textAlign: 'center' }}>
          演示环境 · 任意用户名与密码即可登录
        </p>
      </form>
    </div>
  )
}
