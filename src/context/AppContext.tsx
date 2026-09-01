import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { App as AntdApp } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EventItem, PageId } from '../data/types'
import type { SettingId } from '../data/settings'
import { initialEvents } from '../data/events'
import { normalizedTrendName } from '../data/trends'
import { PAGE_LABELS } from '../data/labels'

export interface AppState {
  mt: string
  region: string
  eventStatus: string
  event: string
  candidate: number | null
  setting: SettingId
  campaignVersion: number
  campaignChoice: number | null
  topicDetail: string | null
}

interface ModalState {
  title: string
  body: ReactNode
  readonly: boolean
  size?: 'default' | 'large'
  confirm?: {
    label: string
    onConfirm: () => void | Promise<void>
  }
}

interface AppContextValue extends AppState {
  page: PageId
  user: string | null
  isAuthenticated: boolean
  events: EventItem[]
  modal: ModalState | null

  set: (patch: Partial<AppState>) => void
  go: (page: PageId) => void
  login: (name: string) => void
  logout: () => void
  toast: (msg: string) => void
  openModal: (
    title: string,
    body: ReactNode,
    readonly?: boolean,
    size?: 'default' | 'large',
    confirm?: { label: string; onConfirm: () => void | Promise<void> },
  ) => void
  closeModal: () => void
  ensureEventForTrend: (
    name: string,
    region: string,
    rank?: number | string,
  ) => EventItem
}

const defaultState: AppState = {
  mt: 'ranking',
  region: 'Worldwide',
  eventStatus: '全部',
  event: 'e1',
  candidate: null,
  setting: 'twitter',
  campaignVersion: 1,
  campaignChoice: null,
  topicDetail: null,
}

const AppContext = createContext<AppContextValue | null>(null)

export function findEventForTrend(
  events: EventItem[],
  name: string,
): EventItem | undefined {
  const n = normalizedTrendName(name)
  if (/GPT-6|OpenAI/i.test(n)) return events.find((e) => e.id === 'e1')
  if (/CPI/i.test(n)) return events.find((e) => e.id === 'e2')
  if (/Stablecoin/i.test(n)) return events.find((e) => e.id === 'e3')
  if (/World Cup/i.test(n)) return events.find((e) => e.id === 'e4')
  if (/NVIDIA/i.test(n)) return events.find((e) => e.id === 'e5')
  return undefined
}

const PAGE_IDS = Object.keys(PAGE_LABELS) as PageId[]

const AUTH_STORAGE_KEY = 'hotspot-monitor.user'

export function AppProvider({ children }: { children: ReactNode }) {
  const { notification } = AntdApp.useApp()
  const [state, setState] = useState<AppState>(defaultState)
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [user, setUser] = useState<string | null>(
    () => localStorage.getItem(AUTH_STORAGE_KEY),
  )

  const login = (name: string) => {
    setUser(name)
    localStorage.setItem(AUTH_STORAGE_KEY, name)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const navigate = useNavigate()
  const location = useLocation()

  const path = location.pathname.replace(/^\/+/, '')
  const topPath = path.split('/')[0] || 'monitor'
  const page: PageId = (PAGE_IDS as string[]).includes(topPath)
    ? (topPath as PageId)
    : 'monitor'

  const set = (patch: Partial<AppState>) =>
    setState((prev) => ({ ...prev, ...patch }))

  const go = (target: PageId) => {
    navigate(`/${target}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toast = (msg: string) => {
    notification.open({
      message: msg,
      placement: 'topRight',
      duration: 2.5,
    })
  }

  const openModal = (
    title: string,
    body: ReactNode,
    readonly = false,
    size: 'default' | 'large' = 'default',
    confirm?: { label: string; onConfirm: () => void | Promise<void> },
  ) => setModal({ title, body, readonly, size, confirm })

  const closeModal = () => setModal(null)

  const ensureEventForTrend = (
    name: string,
    region: string,
    rank?: number | string,
  ): EventItem => {
    const known = findEventForTrend(events, name)
    if (known) return known

    const clean = normalizedTrendName(name)
    const id =
      'trend-' +
      clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      region.toLowerCase().replace(/[^a-z]+/g, '')

    const existing = events.find((e) => e.id === id)
    if (existing) return existing

    const event: EventItem = {
      id,
      title: clean + '成为热搜上升话题',
      summary: `${clean}进入${region}热搜榜并出现明显讨论增长，系统已聚合该榜单条目及当前可取得的热门帖子。`,
      status: '内容生成中',
      verify: '信息一致',
      regions: region,
      trigger: `榜单第${rank ?? '—'}位 / 热点监测跳转`,
      urls: [
        `https://x.com/search?q=${encodeURIComponent(clean)}&src=trend_click&f=live`,
      ],
      related: [],
    }

    setEvents((prev) => (prev.some((e) => e.id === id) ? prev : [...prev, event]))
    return event
  }

  const value: AppContextValue = {
    ...state,
    page,
    user,
    isAuthenticated: user != null,
    events,
    modal,
    set,
    go,
    login,
    logout,
    toast,
    openModal,
    closeModal,
    ensureEventForTrend,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
