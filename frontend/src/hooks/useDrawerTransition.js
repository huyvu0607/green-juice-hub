/**
 * useDrawerTransition
 * Hook dùng chung cho tất cả drawer/sidebar trượt từ phải vào.
 * 
 * @param {boolean} isOpen
 * @returns {{ overlayStyle, drawerStyle, overlayClass }}
 */
export function useDrawerTransition(isOpen) {
  const overlayStyle = {
    transition: 'opacity 0.3s ease',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
  }

  const drawerStyle = {
    transition: isOpen
      ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'transform 0.25s cubic-bezier(0.4, 0, 1, 1)',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    willChange: 'transform',
    visibility: isOpen ? 'visible' : 'hidden',
  }

  return { overlayStyle, drawerStyle }
}