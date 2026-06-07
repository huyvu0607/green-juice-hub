import { useEffect, useRef } from 'react'
import useAppStore from '@/store/useAppStore'

export function usePageReady(loading) {
  const { setPageReady } = useAppStore()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (loading) {
      hasStarted.current = true
      return
    }
    setPageReady(true)
  }, [loading])
}