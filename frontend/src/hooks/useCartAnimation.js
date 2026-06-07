import { useEffect } from 'react'

export function useCartAnimation(cartBtnRef) {
  useEffect(() => {
    const handler = (e) => {
      const { imageUrl } = e.detail
      const cartBtn = cartBtnRef.current
      if (!cartBtn) return

      const btnRect = cartBtn.getBoundingClientRect()

      // ── Ảnh thumbnail xuất hiện dưới giỏ, trượt lên ──
      const thumb = document.createElement('img')
      thumb.src = imageUrl || '/placeholder.png'
      Object.assign(thumb.style, {
        position:     'fixed',
        width:        '36px',
        height:       '36px',
        borderRadius: '50%',
        objectFit:    'cover',
        border:       '2px solid var(--color-primary, #16a34a)',
        zIndex:       '9999',
        pointerEvents:'none',
        // Bắt đầu: ngay bên dưới icon giỏ hàng
        left:         `${btnRect.left + btnRect.width / 2 - 18}px`,
        top:          `${btnRect.bottom + 8}px`,
        opacity:      '1',
        transform:    'scale(1)',
        transition:   'top 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease 0.35s, transform 0.45s ease',
      })
      document.body.appendChild(thumb)

      // Trigger trượt lên (vào giỏ)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          thumb.style.top     = `${btnRect.top + btnRect.height / 2 - 18}px`
          thumb.style.opacity = '0'
          thumb.style.transform = 'scale(0.3)'
        })
      })

      // Khi ảnh vào đến giỏ → giỏ "nuốt" (bounce scale)
      setTimeout(() => {
        cartBtn.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.45)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' },
          ],
          { duration: 380, easing: 'ease-out' }
        )
        document.body.removeChild(thumb)
      }, 420)
    }

    window.addEventListener('cart:item-added', handler)
    return () => window.removeEventListener('cart:item-added', handler)
  }, [cartBtnRef])
}