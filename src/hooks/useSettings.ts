import { useCallback, useEffect, useState } from 'react'
import { createSetting, deleteSetting, getSettings, updateSetting } from '../api/settings'
import type { SettingItem, SettingPayload } from '../api/settings'

export function useSettings(category: string) {
  const [items, setItems] = useState<SettingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    getSettings(category)
      .then(setItems)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [category])

  useEffect(() => {
    reload()
  }, [reload])

  const create = (data: SettingPayload & { name: string }) => createSetting(category, data)

  const update = (id: string, data: SettingPayload) => updateSetting(category, id, data)

  const remove = (id: string) => deleteSetting(category, id)

  return { items, loading, error, reload, create, update, remove }
}
