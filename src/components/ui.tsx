import type { ReactNode } from 'react'
import { Flex, Space, Typography } from 'antd'
import styles from './ui.module.css'

export function Head({
  title,
  desc,
  actions,
}: {
  title: string
  desc: string
  actions?: ReactNode
}) {
  return (
    <Flex className="head" align="flex-end" justify="space-between" gap={16} wrap>
      <div>
        <Typography.Title level={1} className={styles.headTitle}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{desc}</Typography.Text>
      </div>
      {actions ? (
        <Space className="actions" size={8} wrap>
          {actions}
        </Space>
      ) : null}
    </Flex>
  )
}

export function Chart() {
  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 690 150">
        <path className={styles.g} d="M25 25H680M25 70H680M25 115H680M25 145H680" />
        <path
          className={styles.a}
          d="M25 125C90 126 135 102 205 109S310 82 380 90S485 47 550 61S625 40 680 25V145H25Z"
        />
        <path
          className={styles.l}
          d="M25 125C90 126 135 102 205 109S310 82 380 90S485 47 550 61S625 40 680 25"
        />
      </svg>
    </div>
  )
}
