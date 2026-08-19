import type { ReactNode } from 'react'
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
    <div className="head">
      <div>
        <h1>{title}</h1>
        <div className="muted">{desc}</div>
      </div>
      <div className="actions">{actions}</div>
    </div>
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
