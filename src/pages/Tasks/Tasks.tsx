import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { TaskItem } from '../../data/types'
import { Head } from '../../components/ui'
import { useTasks } from '../../hooks/useTasks'
import { getTask, publishTask, regenerateTask } from '../../api/task'
import TaskDetailModal from './TaskDetailModal'
import styles from './Tasks.module.css'

const SUMMARY: [string, string][] = [
  ['进行中', '6'],
  ['待发布', '3'],
  ['异常', '1'],
  ['追踪中', '8'],
  ['今日完成', '17'],
]

export default function Tasks() {
  const { taskEvent, taskRole, taskStatus, taskRisk, set, toast, openModal, closeModal } =
    useApp()
  const [page, setPage] = useState(1)
  const { tasks, accounts, facets, total, pageSize, loading, error, reload } = useTasks({
    page,
    event: taskEvent === '全部' ? undefined : taskEvent,
    account: taskRole === '全部' ? undefined : taskRole,
    status: taskStatus === '全部' ? undefined : taskStatus,
    risk: taskRisk === '全部' ? undefined : taskRisk,
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const regenerateAndReload = async (t: TaskItem, instruction?: string) => {
    try {
      await regenerateTask(t.id, instruction)
      const detail = await getTask(t.id)
      toast('已重新生成 3 条候选')
      showTaskModal(detail)
      reload()
    } catch {
      toast('重新生成失败，请稍后重试')
    }
  }

  const publishAndReload = async (t: TaskItem, url: string, candidateId: string) => {
    try {
      await publishTask(t.id, url, candidateId)
      toast('发布已记录，开始追踪')
      closeModal()
      reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : '回填失败')
    }
  }

  const showTaskModal = (t: TaskItem) => {
    openModal(
      `${t.code} · ${t.account}`,
      <TaskDetailModal
        task={t}
        onRegenerate={(instruction) => regenerateAndReload(t, instruction)}
        onPublish={(url, candidateId) => publishAndReload(t, url, candidateId)}
      />,
      true,
      'large',
    )
  }

  const openTaskModal = async (t: TaskItem) => {
    openModal(
      `${t.code} · ${t.account}`,
      <div className="note">正在加载任务详情…</div>,
      true,
      'large',
    )
    try {
      showTaskModal(await getTask(t.id))
    } catch (e) {
      toast(e instanceof Error ? e.message : '加载任务详情失败')
      closeModal()
    }
  }

  return (
    <>
      <Head
        title="内容发布"
        desc="完成各账号候选内容的AI调整、人工发布、URL回填与发布异常处理。"
        actions={<button className="btn">导出任务</button>}
      />

      <section className={styles.summaryGrid}>
        {SUMMARY.map((x) => (
          <div className={styles.summaryCell} key={x[0]}>
            <span className="small">{x[0]}</span>
            <strong>{x[1]}</strong>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="filters">
          <select
            className="filter"
            value={taskEvent}
            onChange={(e) => {
              set({ taskEvent: e.target.value })
              setPage(1)
            }}
          >
            <option value="全部">Event：全部</option>
            {facets.events.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className="filter"
            value={taskRole}
            onChange={(e) => {
              set({ taskRole: e.target.value })
              setPage(1)
            }}
          >
            <option value="全部">账号：全部</option>
            {accounts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className="filter"
            value={taskStatus}
            onChange={(e) => {
              set({ taskStatus: e.target.value })
              setPage(1)
            }}
          >
            <option value="全部">状态：全部</option>
            {facets.statuses.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className="filter"
            value={taskRisk}
            onChange={(e) => {
              set({ taskRisk: e.target.value })
              setPage(1)
            }}
          >
            <option value="全部">风险：全部</option>
            {facets.risks.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <span className="small">共 {total} 条任务</span>
        </div>

        <div className={styles.taskHead} style={{ marginTop: 14 }}>
          <span>ID</span>
          <span>账号任务</span>
          <span>关联Event</span>
          <span>状态</span>
          <span>风险</span>
          <span>时间</span>
        </div>
        {loading && <div className="note">正在加载任务…</div>}
        {error && <div className="note warning">加载失败：{error}</div>}
        {tasks.map((x) => (
          <div className={styles.taskRow} key={x.id} onClick={() => openTaskModal(x)}>
            <span>{x.code}</span>
            <div className={styles.account}>
              <span className={styles.accountIcon}>{x.account.slice(0, 2)}</span>
              <span>
                <b>{x.account}</b>
                <br />
                <small className="muted">{x.role}</small>
              </span>
            </div>
            <span>{x.event}</span>
            <span className={`pill ${x.status === '异常' ? 'red' : x.status.includes('待') ? 'orange' : 'green'}`}>
              {x.status}
            </span>
            <span className={`pill ${x.risk === '中' ? 'orange' : 'green'}`}>{x.risk}</span>
            <span>{x.time}</span>
          </div>
        ))}
        {!loading && !error && tasks.length === 0 && (
          <div className="note">当前条件下没有任务。</div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 12,
          }}
        >
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一页
          </button>
          <span className="small">
            第 {page} / {totalPages} 页
          </span>
          <button
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      </section>
    </>
  )
}
