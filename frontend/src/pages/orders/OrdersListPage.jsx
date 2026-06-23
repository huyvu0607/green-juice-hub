import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useOrderStore from '@/store/useOrderStore'
import { fmt, formatDate, StatusBadge, Icon } from './orderHelpers'
import ReviewFormPopup from '@/components/product/ReviewFormPopup'
import useCartStore from '@/store/useCartStore'

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
]

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function OrdersListPage() {
  const navigate = useNavigate()
  const {
    orders, loading, statusCounts,
    totalPages, currentPage,
    fetchMyOrders, fetchStatusCounts,
  } = useOrderStore()

  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const tabRef = useRef(null)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)
  // ref để scroll lên đầu content khi đổi tab
  const contentTopRef = useRef(null)

  const [reviewItems, setReviewItems] = useState(null)
  const { addItem } = useCartStore()

  useEffect(() => {
    fetchMyOrders(0)
    fetchStatusCounts()
  }, [])

  // Scroll tab active vào giữa thanh tab
  useEffect(() => {
    if (!tabRef.current) return
    const activeEl = tabRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeTab])

  const filtered = searchQuery.trim()
    ? orders.filter(o =>
      o.orderCode?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : orders

  const handleTabChange = (key) => {
    setActiveTab(key)
    setSearchQuery('')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchMyOrders(0, 10, key === 'ALL' ? null : key)
    }, 300)

    // Scroll lên đầu trang khi đổi tab
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (e) => setSearchQuery(e.target.value)
  const handleClearSearch = () => {
    setSearchQuery('')
    searchRef.current?.focus()
  }

  const countFor = (key) => key === 'ALL'
    ? statusCounts['ALL'] ?? 0
    : statusCounts[key] ?? 0

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>

      {/* ── Sticky header ── */}
      <div
        className="sticky top-16 z-10"
        style={{ background: 'var(--color-bg-surface)', borderBottom: '0.5px solid var(--color-border-subtle)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-3">

          {/* Breadcrumb — ẩn trên mobile để tiết kiệm không gian */}
          <nav className="hidden sm:flex items-center gap-1.5 text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
            <span className="opacity-50">/</span>
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Đơn hàng của tôi</span>
          </nav>

          {/* Title + Search: stack trên mobile, hàng ngang trên desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1
                className="font-bold"
                style={{
                  color: 'var(--color-text-primary)',
                  fontSize: 'clamp(1.25rem, 4vw, 1.6rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  fontFamily: '"Be Vietnam Pro", "Inter", system-ui, sans-serif',
                }}
              >
                Đơn hàng của tôi
              </h1>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Theo dõi, xem chi tiết và trạng thái tất cả đơn hàng của bạn.
              </p>
            </div>

            {/* Search box: full-width trên mobile */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-lg)] transition-all w-full sm:w-[260px] flex-shrink-0"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
              }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
            >
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}><SearchIcon /></span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Tìm theo mã đơn hàng..."
                className="flex-1 text-sm bg-transparent outline-none min-w-0"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          {!isSearching && (
            <div
              ref={tabRef}
              className="flex gap-1 p-1 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6"
              style={{
                background: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius-lg)',
                scrollbarWidth: 'none',
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key
                const count = countFor(tab.key)
                return (
                  <button
                    key={tab.key}
                    data-active={isActive}
                    onClick={() => handleTabChange(tab.key)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer transition-all whitespace-nowrap"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      fontWeight: isActive ? 600 : 400,
                      padding: '7px 10px',
                      background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      border: isActive ? '0.5px solid var(--color-border-subtle)' : '0.5px solid transparent',
                    }}
                  >
                    {tab.label}
                    {count > 0 && ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(tab.key) && (
                      <span
                        className="text-xs px-1.5 rounded-full"
                        style={{
                          background: isActive ? 'var(--color-primary)' : '#ef4444',
                          color: '#fff', fontWeight: 600, lineHeight: '1.6',
                          minWidth: 18, textAlign: 'center',
                        }}
                      >
                        {count}
                      </span>
                    )}
                    {count > 0 && !['PENDING', 'CONFIRMED', 'SHIPPING'].includes(tab.key) && isActive && (
                      <span
                        className="text-xs px-1.5 rounded-full"
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff', fontWeight: 600, lineHeight: '1.6',
                          minWidth: 18, textAlign: 'center',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={contentTopRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

        {loading && orders.length === 0 && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          </div>
        )}

        {isSearching && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {filtered.length > 0
              ? `Tìm thấy ${filtered.length} đơn khớp với "${searchQuery}"`
              : `Không tìm thấy đơn nào khớp với "${searchQuery}"`
            }
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-muted)' }}
            >
              <Icon.Package />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {isSearching
                ? `Không tìm thấy đơn hàng nào với mã "${searchQuery}"`
                : activeTab === 'ALL'
                  ? 'Bạn chưa có đơn hàng nào'
                  : `Không có đơn "${TABS.find(t => t.key === activeTab)?.label}"`
              }
            </p>
            {isSearching ? (
              <button
                onClick={handleClearSearch}
                className="px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer"
                style={{
                  background: 'var(--color-bg-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Xoá tìm kiếm
              </button>
            ) : activeTab === 'ALL' && (
              <button
                onClick={() => navigate('/products')}
                className="px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white cursor-pointer"
                style={{ background: 'var(--color-primary)' }}
              >
                Mua sắm ngay
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const previewNames = order.items?.slice(0, 2).map(i => i.productName).join(', ')
            const extraItems = (order.items?.length ?? 0) - 2
            const unreviewedItems = order.items?.filter(i => !i.hasReviewed) ?? []
            const unreviewedCount = unreviewedItems.length

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${order.id}`)}
                className="w-full text-left rounded-[var(--radius-lg)] overflow-hidden cursor-pointer transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '0.5px solid var(--color-border-subtle)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
              >
                {/* Top: mã đơn + status */}
                <div
                  className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3"
                  style={{
                    borderBottom: '0.5px solid var(--color-border-subtle)',
                    background: 'var(--color-bg-muted)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-5 h-5 rounded"
                      style={{ background: 'var(--color-primary)', flexShrink: 0 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)', lineHeight: 1 }}>Mã đơn hàng</span>
                      <span
                        className="font-bold"
                        style={{
                          color: 'var(--color-text-primary)',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em',
                          lineHeight: 1.3,
                        }}
                      >
                        #{order.orderCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PENDING' && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#fef3c7', color: '#92400e' }}
                      >
                        Chờ CK
                      </span>
                    )}
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {/* Middle: thumbnails + tên SP + action buttons */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                  {/* Thumbnails */}
                  <div className="flex items-center -space-x-2 flex-shrink-0">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <img
                        key={item.id}
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.productName}
                        className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-[var(--radius-sm)]"
                        style={{ border: '2px solid var(--color-bg-elevated)', zIndex: 3 - idx }}
                      />
                    ))}
                    {(order.items?.length ?? 0) > 3 && (
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-medium"
                        style={{
                          background: 'var(--color-bg-muted)',
                          color: 'var(--color-text-muted)',
                          border: '2px solid var(--color-bg-elevated)',
                          zIndex: 0,
                        }}
                      >
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Tên sản phẩm */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs sm:text-sm font-medium"
                      style={{
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {previewNames}
                      {extraItems > 0 && (
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                          {' '}· {extraItems} SP khác
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {order.items?.length} sản phẩm
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>

                    {/* Nút "Đánh giá" */}
                    {order.status === 'DELIVERED' && unreviewedCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const items = unreviewedItems.map(i => ({
                            productId: i.productId,
                            variantId: i.variantId,
                            orderId: order.id,
                            productName: i.productName,
                            variantName: i.variantName,
                            imageUrl: i.imageUrl,
                            quantity: i.quantity,
                          }))
                          if (items.length > 0) setReviewItems(items)
                        }}
                        className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer transition-all whitespace-nowrap"
                        style={{
                          background: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          border: '1px solid var(--color-primary)',
                        }}
                      >
                        Đánh giá{unreviewedCount > 1 ? ` (${unreviewedCount})` : ''}
                      </button>
                    )}

                    {/* Nút "Mua lại" */}
                    {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!order.items?.length) return
                          try {
                            for (const item of order.items) {
                              await addItem(item.productId, item.variantId, item.quantity ?? 1)
                            }
                            window.dispatchEvent(new CustomEvent('cart:item-added', {
                              detail: { imageUrl: order.items[0]?.imageUrl ?? null }
                            }))
                          } catch { }
                        }}
                        className="text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer transition-all whitespace-nowrap"
                        style={{
                          background: 'var(--color-bg-muted)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        Mua lại
                      </button>
                    )}

                    {/* Nút "Xem chi tiết" */}
                    {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/orders/${order.id}`)
                        }}
                        className="text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer transition-all whitespace-nowrap"
                        style={{
                          background: 'var(--color-bg-muted)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        Chi tiết →
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom: date + price */}
                <div
                  className="flex items-center justify-between px-3 sm:px-4 py-2.5"
                  style={{ borderTop: '0.5px solid var(--color-border-subtle)' }}
                >
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <ClockIcon />
                    {formatDate(order.createdAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      {fmt(order.totalAmount)}
                    </span>
                    <Icon.ChevronRight />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isSearching && currentPage + 1 < totalPages && (
          <div className="flex justify-center mt-6 pb-6">
            <button
              onClick={() => fetchMyOrders(currentPage + 1, 10, activeTab === 'ALL' ? null : activeTab)}
              disabled={loading}
              className="px-5 py-2 rounded-[var(--radius-md)] text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors"
              style={{
                background: 'var(--color-bg-muted)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {loading ? 'Đang tải...' : 'Xem thêm đơn hàng'}
            </button>
          </div>
        )}

      </div>

      {reviewItems && reviewItems.length > 0 && (
        <ReviewFormPopup
          items={reviewItems}
          onClose={() => setReviewItems(null)}
          onSuccess={() => fetchMyOrders(0, 10, activeTab === 'ALL' ? null : activeTab)}
        />
      )}
    </div>
  )
}