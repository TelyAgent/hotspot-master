import { useState } from 'react'
import { Alert, Avatar, Button, Empty, Pagination, Select, Space, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ExportOutlined } from '@ant-design/icons'
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

function statusColor(status: string) {
  if (status === '异常') return 'error'
  if (status.includes('待')) return 'warning'
  return 'success'
}

function riskColor(risk: string) {
  return risk === '中' || risk === '高' ? 'warning' : 'success'
}

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

  const columns: ColumnsType<TaskItem> = [
    {
      title: 'ID',
      dataIndex: 'code',
      width: 96,
    },
    {
      title: '账号任务',
      dataIndex: 'account',
      width: 220,
      render: (_value, record) => (
        <Space size={8}>
          <Avatar className={styles.accountIcon}>{record.account.slice(0, 2)}</Avatar>
          <span>
            <b>{record.account}</b>
            <br />
            <small className="muted">{record.role}</small>
          </span>
        </Space>
      ),
    },
    {
      title: '关联Event',
      dataIndex: 'event',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>,
    },
    {
      title: '风险',
      dataIndex: 'risk',
      width: 90,
      render: (value: string) => <Tag color={riskColor(value)}>{value}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      width: 110,
    },
  ]

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
        actions={<Button icon={<ExportOutlined />}>导出任务</Button>}
      />

      <section className={styles.summaryGrid}>
        {SUMMARY.map((x) => (
          <div className={styles.summaryCell} key={x[0]}>
            <Statistic title={x[0]} value={x[1]} />
          </div>
        ))}
      </section>

      <section className="card">
        <Space className="filters" size={8} wrap>
          <Select
            style={{ minWidth: 180 }}
            value={taskEvent}
            options={[
              { value: '全部', label: 'Event：全部' },
              ...facets.events.map((x) => ({ value: x, label: x })),
            ]}
            onChange={(value) => {
              set({ taskEvent: value })
              setPage(1)
            }}
          />
          <Select
            style={{ minWidth: 170 }}
            value={taskRole}
            options={[
              { value: '全部', label: '账号：全部' },
              ...accounts.map((x) => ({ value: x, label: x })),
            ]}
            onChange={(value) => {
              set({ taskRole: value })
              setPage(1)
            }}
          />
          <Select
            style={{ minWidth: 150 }}
            value={taskStatus}
            options={[
              { value: '全部', label: '状态：全部' },
              ...facets.statuses.map((x) => ({ value: x, label: x })),
            ]}
            onChange={(value) => {
              set({ taskStatus: value })
              setPage(1)
            }}
          />
          <Select
            style={{ minWidth: 140 }}
            value={taskRisk}
            options={[
              { value: '全部', label: '风险：全部' },
              ...facets.risks.map((x) => ({ value: x, label: x })),
            ]}
            onChange={(value) => {
              set({ taskRisk: value })
              setPage(1)
            }}
          />
          <span className="small">共 {total} 条任务</span>
        </Space>

        {error ? <Alert style={{ marginTop: 14 }} type="error" message={`加载失败：${error}`} showIcon /> : null}
        <Table
          className={styles.taskTable}
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="当前条件下没有任务" /> }}
          onRow={(record) => ({
            onClick: () => openTaskModal(record),
          })}
        />
        <div className={styles.paginationBar}>
          <span className="small">第 {page} / {totalPages} 页</span>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </section>
    </>
  )
}
