import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { App as AntdApp, ConfigProvider, Layout } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Modal from './components/Modal'
import AssistantChatFloat from './components/AssistantChatFloat'
import Login from './pages/Login/Login'
import Monitor from './pages/Monitor/Monitor'
import YouTubeMonitor from './pages/Monitor/YouTubeMonitor'
import DecisionRecommendations from './pages/Decision/Recommendations'
import DecisionContextInbox from './pages/Decision/ContextInbox'
import DecisionRecords from './pages/Decision/DecisionRecords'
import Events from './pages/Events/Events'
import Schedule from './pages/Schedule/Schedule'
import Insights from './pages/Insights/Insights'
import Settings from './pages/Settings/Settings'

function AppLayout() {
  return (
    <Layout className="app">
      <Layout.Sider className="app-sider" width={224} theme="light">
        <Sidebar />
      </Layout.Sider>
      <Layout className="app-main">
        <Layout.Header className="app-header">
          <Topbar />
        </Layout.Header>
        <Layout.Content className="app-content">
          <main className="page">
            <Outlet />
          </main>
        </Layout.Content>
      </Layout>
      <Modal />
      <AssistantChatFloat />
    </Layout>
  )
}

function RequireAuth() {
  const { isAuthenticated } = useApp()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#087b71',
          colorInfo: '#087b71',
          colorSuccess: '#087b71',
          colorWarning: '#b55020',
          colorError: '#a53d44',
          colorLink: '#087b71',
          colorLinkHover: '#05665e',
          colorLinkActive: '#04524c',
          colorText: '#172026',
          colorTextSecondary: '#647276',
          colorBorder: '#d6dfdf',
          colorBgLayout: '#f4f7f7',
          borderRadius: 6,
          fontFamily:
            "Inter, system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Alert: {
            colorInfoBg: 'rgb(244, 247, 247)',
            colorInfoBorder: '#d6dfdf',
            colorInfoText: '#647276',
          },
        },
      }}
    >
      <AntdApp notification={{ placement: 'topRight' }}>
        <BrowserRouter>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/monitor" replace />} />
                  <Route path="/overview" element={<Navigate to="/monitor" replace />} />
                  <Route path="/monitor" element={<Monitor />} />
                  <Route path="/monitor/youtube" element={<YouTubeMonitor />} />
                  <Route path="/decision" element={<Navigate to="/decision/recommendations" replace />} />
                  <Route path="/decision/recommendations" element={<DecisionRecommendations />} />
                  <Route path="/decision/inbox" element={<DecisionContextInbox />} />
                  <Route path="/decision/records" element={<DecisionRecords />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/future" element={<Schedule />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
