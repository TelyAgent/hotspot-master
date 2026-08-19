import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Modal from './components/Modal'
import Toast from './components/Toast'
import AssistantChatFloat from './components/AssistantChatFloat'
import Login from './pages/Login/Login'
import Overview from './pages/Overview/Overview'
import Monitor from './pages/Monitor/Monitor'
import Events from './pages/Events/Events'
import Schedule from './pages/Schedule/Schedule'
import Tasks from './pages/Tasks/Tasks'
import Insights from './pages/Insights/Insights'
import Settings from './pages/Settings/Settings'

function AppLayout() {
  return (
    <div className="app">
      <Sidebar />
      <div>
        <Topbar />
        <main className="page">
          <Outlet />
        </main>
      </div>
      <Modal />
      <Toast />
      <AssistantChatFloat />
    </div>
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
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/monitor" element={<Monitor />} />
              <Route path="/events" element={<Events />} />
              <Route path="/future" element={<Schedule />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
