import { useState, useEffect } from 'react'

export function useDrawerTransition(isOpen) {
  // visible = true khi đang mở HOẶC đang chạy animation đóng
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      // Mở: hiện ngay để transition chạy được
      setVisible(true)
    } else {
      // Đóng: chờ animation xong (250ms) rồi mới ẩn
      const t = setTimeout(() => setVisible(false), 250)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const overlayStyle = {
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'opacity 0.25s ease',
    visibility: visible ? 'visible' : 'hidden',
  }

  const drawerStyle = {
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: isOpen
      ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)',
    willChange: 'transform',
    visibility: visible ? 'visible' : 'hidden',
  }

  return { overlayStyle, drawerStyle }
}