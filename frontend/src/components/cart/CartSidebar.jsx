import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useCartStore from '../../store/useCartStore'
import useAuthStore from '../../store/authStore'
import CartItemCard from './CartItemCard'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'

const CartSidebar = () => {
  const navigate = useNavigate()
  const overlayRef = useRef(null)

  const { isOpen, closeCart, items, totalItems, totalAmount, loading, error, fetchCart, clearCart } =
    useCartStore()
  const { isLoggedIn } = useAuthStore()
  const { overlayStyle, drawerStyle } = useDrawerTransition(isOpen)


  // ── Selection state ──────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Khi items thay đổi: loại bỏ id đã bị xoá khỏi selection
  useEffect(() => {
    const validIds = new Set(items.map((i) => i.cartItemId))
    setSelectedIds((prev) => new Set([...prev].filter((id) => validIds.has(id))))
  }, [items])

  // Các item còn hàng (có thể chọn)
  const availableItems = useMemo(() => items.filter((i) => i.inStock), [items])
  const availableIds = useMemo(() => availableItems.map((i) => i.cartItemId), [availableItems])

  const isAllSelected =
    availableIds.length > 0 && availableIds.every((id) => selectedIds.has(id))
  const isIndeterminate =
    !isAllSelected && availableIds.some((id) => selectedIds.has(id))

  const handleToggleItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(availableIds))
    }
  }

  // Tính tổng tiền theo selection
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.cartItemId)),
    [items, selectedIds]
  )
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0)
  const selectedAmount = selectedItems.reduce((sum, i) => {
    const price = i.salePrice ?? i.originalPrice
    return sum + price * i.quantity
  }, 0)
  // ────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && isLoggedIn) fetchCart()
  }, [isOpen, isLoggedIn])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const handleCheckout = () => {
    closeCart()
    // Truyền danh sách cartItemId đã chọn qua navigate state
    navigate('/checkout', { state: { selectedIds: [...selectedIds] } })
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeCart()
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`
          fixed inset-0 bg-black/40 backdrop-blur-[2px]
          transition-opacity duration-[var(--duration-base)]
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        style={{ zIndex: 'var(--z-overlay)' ,
          ...overlayStyle,
        }}
      />

      {/* Sidebar panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-[420px]
          flex flex-col
          bg-[var(--color-bg-base)]
          shadow-[var(--shadow-lg)]
          transition-transform duration-[var(--duration-slow)] ease-[var(--ease-smooth)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ zIndex: 'var(--z-modal)',
          ...drawerStyle, 
         }}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <h2 className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)] font-display">
              Giỏ hàng
            </h2>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold bg-[var(--color-primary)] text-white">
                {totalItems}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[var(--text-xs)] text-[var(--color-text-muted)] hover:text-red-500 px-2 py-1 rounded-[var(--radius-sm)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Xoá tất cả
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors"
              aria-label="Đóng giỏ hàng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Select All bar ─────────────────────────────── */}
        {isLoggedIn && items.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)]/50">
            {/* Checkbox chọn tất cả */}
            <button
              onClick={handleToggleAll}
              aria-label={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              className={`
                relative w-5 h-5 rounded-[var(--radius-sm)] border-2 flex items-center justify-center
                transition-all duration-150 shrink-0
                ${isAllSelected
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                  : isIndeterminate
                    ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]'
                    : 'border-[var(--color-border-default)] hover:border-[var(--color-primary)] bg-transparent'
                }
              `}
            >
              {isAllSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isIndeterminate && !isAllSelected && (
                <span className="w-2.5 h-0.5 rounded-full bg-[var(--color-primary)] block" />
              )}
            </button>

            <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] flex-1">
              {isAllSelected
                ? `Đã chọn tất cả (${availableIds.length})`
                : selectedIds.size > 0
                  ? `Đã chọn ${selectedIds.size}/${availableIds.length} sản phẩm`
                  : 'Chọn tất cả'}
            </span>

            {selectedIds.size > 0 && (
              <span className="text-[var(--text-xs)] font-medium" style={{ color: 'var(--color-primary)' }}>
                {fmt(selectedAmount)}
              </span>
            )}
          </div>
        )}

        {/* ── Body ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">

          {/* Chưa đăng nhập */}
          {!isLoggedIn && (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--text-md)] font-medium text-[var(--color-text-primary)]">Vui lòng đăng nhập</p>
                <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                  Đăng nhập để xem và quản lý giỏ hàng
                </p>
              </div>
              <button
                onClick={() => { closeCart(); navigate('/login') }}
                className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[var(--text-sm)] font-medium transition-colors"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoggedIn && loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Đang tải...</p>
            </div>
          )}

          {/* Giỏ trống */}
          {isLoggedIn && !loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-bg-muted)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--text-md)] font-medium text-[var(--color-text-primary)]">Giỏ hàng trống</p>
                <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                  Thêm sản phẩm yêu thích vào giỏ nhé!
                </p>
              </div>
              <button
                onClick={() => { closeCart(); navigate('/products') }}
                className="px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[var(--text-sm)] font-medium transition-colors"
              >
                Mua sắm ngay
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <p className="text-[var(--text-xs)] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Danh sách items */}
          {isLoggedIn && items.length > 0 && items.map((item) => (
            <CartItemCard
              key={item.cartItemId}
              item={item}
              selected={selectedIds.has(item.cartItemId)}
              onToggle={handleToggleItem}
            />
          ))}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        {isLoggedIn && items.length > 0 && (
          <div className="border-t border-[var(--color-border-subtle)] px-5 py-4 space-y-3 bg-[var(--color-bg-base)]">
            {/* Tổng tiền */}
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                Tạm tính
                {selectedCount > 0 && (
                  <span className="ml-1 text-[var(--text-xs)]">({selectedCount} sản phẩm đã chọn)</span>
                )}
              </span>
              <span className="text-[var(--text-lg)] font-bold text-red-500 tabular-nums">
                {fmt(selectedIds.size > 0 ? selectedAmount : totalAmount)}
              </span>
            </div>

            <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">
              Phí vận chuyển sẽ được tính ở bước thanh toán
            </p>

            {/* Nút thanh toán */}
            <button
              onClick={handleCheckout}
              disabled={loading || selectedIds.size === 0}
              className="
                w-full py-3 rounded-[var(--radius-md)]
                bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                text-white font-semibold text-[var(--text-sm)]
                transition-colors duration-[var(--duration-fast)]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : selectedIds.size === 0 ? (
                'Chọn sản phẩm để thanh toán'
              ) : (
                <>
                  Thanh toán ({selectedIds.size} sản phẩm)
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CartSidebar