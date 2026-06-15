import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import adminOrderApi from '@/api/adminOrderApi'

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

const formatDate = (iso) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

const STATUS_CFG = {
  PENDING:   { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  SHIPPING:  { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  DELIVERED: { label: 'Đã giao',      color: '#14532d', bg: '#dcfce7', dot: '#16a34a' },
  CANCELLED: { label: 'Đã huỷ',      color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
}

const PAYMENT_STATUS_CFG = {
  PENDING:        { label: 'Chưa thanh toán',  color: '#92400e', bg: '#fef3c7' },
  PAID:           { label: 'Đã thanh toán',    color: '#14532d', bg: '#dcfce7' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền',    color: '#5b21b6', bg: '#ede9fe' },
  REFUNDED:       { label: 'Đã hoàn tiền',     color: '#6d28d9', bg: '#f5f3ff' },
}

const PAYMENT_METHOD_LABEL = {
  COD:           'COD',
  VNPAY:         'VNPay',
  MOMO:          'MoMo',
  BANK_TRANSFER: 'Chuyển khoản',
}

// ── Tab definitions ───────────────────────────────────────────────
const ORDER_STATUS_TABS = [
  { key: 'ALL',       label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING',  label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
]

const PAYMENT_STATUS_TABS = [
  { key: 'ALL',           label: 'Tất cả' },
  { key: 'PENDING',       label: 'Chưa thanh toán' },
  { key: 'PAID',          label: 'Đã thanh toán' },
  { key: 'REFUND_PENDING',label: 'Chờ hoàn tiền' },
  { key: 'REFUNDED',      label: 'Đã hoàn tiền' },
]

// Badge color logic for order status tabs
const ORDER_STATUS_BADGE_KEYS = ['PENDING', 'CONFIRMED', 'SHIPPING']

// ── Components ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function PaymentStatusBadge({ status }) {
  const cfg = PAYMENT_STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6' }
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function TabBar({ tabs, active, onChange, counts, badgeKeys = [] }) {
  return (
    <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key
        const count = counts[tab.key] ?? 0
        const showBadge = badgeKeys.includes(tab.key) && count > 0
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg cursor-pointer transition-all whitespace-nowrap"
            style={{
              fontWeight: isActive ? 600 : 400,
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? '#15803d' : '#6b7280',
              border: isActive ? '1px solid #e5e7eb' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {tab.label}
            {showBadge && (
              <span
                className="text-xs px-1.5 rounded-full font-semibold leading-relaxed min-w-[18px] text-center"
                style={{ background: isActive ? '#16a34a' : '#ef4444', color: '#fff' }}
              >
                {count}
              </span>
            )}
            {!showBadge && count > 0 && isActive && (
              <span
                className="text-xs px-1.5 rounded-full font-semibold leading-relaxed min-w-[18px] text-center"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const navigate = useNavigate()

  const [orders, setOrders]             = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [paymentCounts, setPaymentCounts] = useState({})
  const [loading, setLoading]           = useState(true)
  const [totalPages, setTotalPages]     = useState(0)
  const [currentPage, setCurrentPage]   = useState(0)

  const [activeOrderTab, setActiveOrderTab]     = useState('ALL')
  const [activePaymentTab, setActivePaymentTab] = useState('ALL')
  const [search, setSearch]                     = useState('')
  const [inputValue, setInputValue]             = useState('')

  // Refs for abort & debounce
  const abortRef    = useRef(null)
  const debounceRef = useRef(null)
  const searchRef   = useRef(null)

  // ── Core fetch (uses AbortController to cancel in-flight requests) ──
  const fetchOrders = useCallback(async ({
    page = 0,
    orderTab = activeOrderTab,
    paymentTab = activePaymentTab,
    q = search,
    append = false,
  } = {}) => {
    // Cancel any pending request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const params = { page, size: 15 }
      if (orderTab !== 'ALL')   params.status = orderTab
      if (paymentTab !== 'ALL') params.paymentStatus = paymentTab
      if (q.trim())             params.search = q.trim()

      const res = await adminOrderApi.getOrders(params, { signal: controller.signal })
      const data = res.data

      if (append) {
        setOrders(prev => [...prev, ...data.content])
      } else {
        setOrders(data.content)
      }
      setTotalPages(data.totalPages)
      setCurrentPage(data.number)
    } catch (e) {
      // Ignore abort errors — they're intentional
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.name === 'AbortError') return
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeOrderTab, activePaymentTab, search])

  // ── Fetch counts ─────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const res = await adminOrderApi.getStatusCounts()
      const data = res.data

      // Split into order-status counts and payment-status counts
      // Expected shape from backend: { ALL, PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED,
      //                                 PAY_PENDING, PAY_PAID, PAY_REFUND_PENDING, PAY_REFUNDED }
      // Adjust keys below to match your actual backend response.
      const orderCounts   = {}
      const paymentCounts = {}

      ;['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].forEach(k => {
        orderCounts[k] = data[k] ?? 0
      })
      ;['ALL', 'PENDING', 'PAID', 'REFUND_PENDING', 'REFUNDED'].forEach(k => {
        // Backend may prefix payment counts with "PAY_" — adjust accordingly
        paymentCounts[k] = data[`PAY_${k}`] ?? data[k] ?? 0
      })

      setStatusCounts(orderCounts)
      setPaymentCounts(paymentCounts)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders({ page: 0, orderTab: 'ALL', paymentTab: 'ALL', q: '' })
    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Order status tab change ───────────────────────────────────────
  const handleOrderTabChange = (key) => {
    if (key === activeOrderTab) return   // no-op if same tab
    setActiveOrderTab(key)
    setInputValue('')
    setSearch('')
    fetchOrders({ page: 0, orderTab: key, paymentTab: activePaymentTab, q: '' })
  }

  // ── Payment status tab change ─────────────────────────────────────
  const handlePaymentTabChange = (key) => {
    if (key === activePaymentTab) return  // no-op if same tab
    setActivePaymentTab(key)
    fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: key, q: search })
  }

  // ── Search with debounce 350ms ────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: activePaymentTab, q: val })
    }, 350)
  }

  const handleClearSearch = () => {
    setInputValue('')
    setSearch('')
    searchRef.current?.focus()
    fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: activePaymentTab, q: '' })
  }

  // ── Refresh ──────────────────────────────────────────────────────
  const handleRefresh = () => {
    fetchOrders({ page: 0 })
    fetchCounts()
  }

  // ── Load more ────────────────────────────────────────────────────
  const handleLoadMore = () => {
    fetchOrders({
      page: currentPage + 1,
      orderTab: activeOrderTab,
      paymentTab: activePaymentTab,
      q: search,
      append: true,
    })
  }

  const isSearching = inputValue.trim().length > 0

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tổng cộng{' '}
              <span className="font-medium text-gray-700">{statusCounts['ALL'] ?? 0}</span> đơn hàng
            </p>
          </div>

          {/* Search + refresh */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 transition-colors focus-within:border-green-500"
              style={{ width: 260 }}
            >
              <span className="text-gray-400 flex-shrink-0"><SearchIcon /></span>
              <input
                ref={searchRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Tìm mã đơn hàng..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
              />
              {isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                >
                  <XIcon />
                </button>
              )}
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <RefreshIcon />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* ── Order Status Tabs ── */}
        <TabBar
          tabs={ORDER_STATUS_TABS}
          active={activeOrderTab}
          onChange={handleOrderTabChange}
          counts={statusCounts}
          badgeKeys={ORDER_STATUS_BADGE_KEYS}
        />

        {/* ── Payment Status Tabs ── */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 px-0.5 uppercase tracking-wide">Thanh toán</p>
          <div className="flex gap-1 flex-wrap">
            {PAYMENT_STATUS_TABS.map((tab) => {
              const isActive = activePaymentTab === tab.key
              const cfg = PAYMENT_STATUS_CFG[tab.key]
              return (
                <button
                  key={tab.key}
                  onClick={() => handlePaymentTabChange(tab.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? (cfg?.bg ?? '#f3f4f6') : 'transparent',
                    color: isActive ? (cfg?.color ?? '#374151') : '#9ca3af',
                    border: isActive ? `1px solid ${cfg?.bg ?? '#e5e7eb'}` : '1px solid #f3f4f6',
                  }}
                >
                  {tab.label}
                  {isActive && paymentCounts[tab.key] > 0 && tab.key !== 'ALL' && (
                    <span
                      className="text-xs px-1.5 rounded-full font-semibold leading-relaxed min-w-[16px] text-center"
                      style={{ background: cfg?.color ?? '#374151', color: '#fff', fontSize: 10 }}
                    >
                      {paymentCounts[tab.key]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200" />
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto px-6 py-4">

        {/* Loading skeleton */}
        {loading && orders.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              {isSearching ? `Không tìm thấy đơn nào với "${inputValue}"` : 'Không có đơn hàng nào'}
            </p>
            {isSearching && (
              <button onClick={handleClearSearch} className="text-sm text-green-600 underline cursor-pointer">
                Xoá tìm kiếm
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {orders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ngày đặt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Thanh toán</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const addr = order.shippingAddress
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      {/* Mã đơn */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          #{order.orderCode}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 text-sm">{addr?.fullName || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{addr?.phone || ''}</p>
                      </td>

                      {/* Ngày đặt */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                      </td>

                      {/* Thanh toán */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-500 mb-1">
                          {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                        </p>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-gray-900">{fmt(order.totalAmount)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Arrow */}
                      <td className="px-3 py-3.5 text-gray-300 group-hover:text-gray-500 transition-colors">
                        <ChevronRight />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Load more */}
            {currentPage + 1 < totalPages && (
              <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-sm text-green-600 font-medium hover:underline cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang tải...' : 'Xem thêm đơn hàng'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subtle loading indicator when appending */}
        {loading && orders.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}