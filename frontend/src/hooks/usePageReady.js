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
    // Chỉ báo ready khi đã từng loading rồi mới xong
    if (hasStarted.current) {
      setPageReady(true)
    }
  }, [loading])

  // Reset khi unmount để trang tiếp theo không bị stale
  useEffect(() => {
    return () => {
      hasStarted.current = false
    }
  }, [])
}