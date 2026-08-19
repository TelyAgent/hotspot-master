import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toastState } = useApp()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!toastState) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 2300)
    return () => clearTimeout(t)
  }, [toastState])

  if (!toastState || !show) return null

  return <div className="toast">{toastState.msg}</div>
}
