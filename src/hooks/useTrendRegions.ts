import { useEffect, useState } from 'react'
import { getPlatformCollectionConfig } from '../api/collectionConfig'

const FALLBACK_REGIONS = ['global', 'United States', 'United Kingdom', 'Japan', 'Korea']

export function useTrendRegions() {
  const [regions, setRegions] = useState<string[]>(FALLBACK_REGIONS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    getPlatformCollectionConfig('x')
      .then((config) => {
        if (!mounted) return
        const configured = config.variables.regions?.length
          ? config.variables.regions
          : config.defaultRegions
        setRegions(configured.length ? configured : FALLBACK_REGIONS)
      })
      .catch((e: unknown) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : '加载热榜地区配置失败')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { regions, loading, error }
}
