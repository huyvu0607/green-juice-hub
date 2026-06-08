import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useOrderStore from '@/store/useOrderStore'
import { fmt, formatDate, StatusBadge, Icon } from './orderHelpers'

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

export default function OrdersListPage() {
  const navigate = useNavigate()
  const {
    orders, loading, statusCounts,
    totalPages, currentPage,
    fetchMyOrders, fetchStatusCounts,
  } = useOrderStore()

  const [activeTab, setActiveTab] = useState('ALL')
  const tabRef = useRef(null)

  useEffect(() => {
    fetchMyOrders(0)
    fetchStatusCounts()
  }, [])

  // Scroll tab active vào giữa khi đổi tab
  useEffect(() => {
    if (!tabRef.current) return
    const activeEl = tabRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeTab])

  const filtered = orders

  const handleTabChange = (key) => {
    setActiveTab(key)
    fetchMyOrders(0, 10, key === 'ALL' ? null : key)
  }

  const countFor = (key) => key === 'ALL'
    ? statusCounts['ALL'] ?? 0
    : statusCounts[key] ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-surface)' }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-3">
          <h1
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Đơn hàng của tôi
          </h1>

          {/* Tab bar */}
          <div
            ref={tabRef}
            className="flex gap-1 p-1 overflow-x-auto -mx-4 px-4"
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
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    fontWeight: isActive ? 500 : 400,
                    padding : '10px 12px',
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
                        color: '#fff',
                        fontWeight: 500,
                        lineHeight: '1.6',
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      {count}
                    </span>
                  )}

                  {/* Tab ALL và DELIVERED, CANCELLED chỉ hiện số khi active */}
                  {count > 0 && !['PENDING', 'CONFIRMED', 'SHIPPING'].includes(tab.key) && isActive && (
                    <span
                      className="text-xs px-1.5 rounded-full"
                      style={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        fontWeight: 500,
                        lineHeight: '1.6',
                        minWidth: 18,
                        textAlign: 'center',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-3">

        {loading && orders.length === 0 && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          </div>
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
              {activeTab === 'ALL'
                ? 'Bạn chưa có đơn hàng nào'
                : `Không có đơn "${TABS.find(t => t.key === activeTab)?.label}"`}
            </p>
            {activeTab === 'ALL' && (
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

        <div className="flex flex-col gap-2.5">
          {filtered.map((order) => {
            const previewNames = order.items
              ?.slice(0, 2)
              .map((i) => i.productName)
              .join(', ')
            const extraItems = (order.items?.length ?? 0) - 2

            return (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full text-left rounded-[var(--radius-lg)] overflow-hidden cursor-pointer transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '0.5px solid var(--color-border-subtle)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
              >
                {/* Top: order code + status */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: '0.5px solid var(--color-border-subtle)' }}
                >
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    #{order.orderCode}
                  </p>
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

                {/* Middle: thumbnails + product names */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex items-center -space-x-2">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <img
                        key={item.id}
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.productName}
                        className="w-11 h-11 object-cover rounded-[var(--radius-sm)]"
                        style={{
                          border: '2px solid var(--color-bg-elevated)',
                          zIndex: 3 - idx,
                        }}
                      />
                    ))}
                    {(order.items?.length ?? 0) > 3 && (
                      <div
                        className="w-11 h-11 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-medium"
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

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
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
                          {' '}+{extraItems} sản phẩm khác
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {order.items?.length} sản phẩm
                    </p>
                  </div>
                </div>

                {/* Bottom: date + price */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: '0.5px solid var(--color-border-subtle)' }}
                >
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <ClockIcon />
                    {formatDate(order.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {fmt(order.totalAmount)}
                    </span>
                    <Icon.ChevronRight />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Load more */}
        {currentPage + 1 < totalPages && (
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
    </div>
  )
}