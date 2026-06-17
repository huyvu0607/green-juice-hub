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

const ORDER_STATUS_CFG = {
  PENDING:   { label: 'Chờ xác nhận', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  CONFIRMED: { label: 'Đã xác nhận',  color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  SHIPPING:  { label: 'Đang giao',    color: '#5b21b6', bg: '#ede9fe', dot: '#8b5cf6' },
  DELIVERED: { label: 'Đã giao',      color: '#14532d', bg: '#dcfce7', dot: '#16a34a' },
  CANCELLED: { label: 'Đã huỷ',      color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
}

const PAYMENT_STATUS_CFG = {
  PENDING:        { label: 'Chưa thanh toán', color: '#92400e', bg: '#fef3c7' },
  PAID:           { label: 'Đã thanh toán',   color: '#14532d', bg: '#dcfce7' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền',   color: '#7c2d12', bg: '#fff7ed', dot: '#ea580c' },
  REFUNDED:       { label: 'Đã hoàn tiền',    color: '#6d28d9', bg: '#f5f3ff' },
}

const PAYMENT_METHOD_LABEL = {
  COD:           'COD',
  VNPAY:         'VNPay',
  MOMO:          'MoMo',
  BANK_TRANSFER: 'Chuyển khoản',
}

const ORDER_STATUS_TABS = [
  { key: 'ALL',       label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING',  label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã huỷ' },
]

const PAYMENT_STATUS_TABS = [
  { key: 'ALL',            label: 'Tất cả' },
  { key: 'PENDING',        label: 'Chưa TT' },
  { key: 'PAID',           label: 'Đã TT' },
  { key: 'REFUND_PENDING', label: '⚠ Chờ hoàn', urgent: true },
  { key: 'REFUNDED',       label: 'Đã hoàn' },
]

// ── Icons ─────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const BarChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const TrophyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
    <path d="M12 17c-2.8 0-5-2.2-5-5V5h10v7c0 2.8-2.2 5-5 5z"/>
    <line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/>
  </svg>
)

// ── Badge components ──────────────────────────────────────────────
function OrderStatusBadge({ status }) {
  const cfg = ORDER_STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function PaymentStatusBadge({ status }) {
  const cfg = PAYMENT_STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6' }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {status === 'REFUND_PENDING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
      )}
      {cfg.label}
    </span>
  )
}

// ── Mini Calendar Dropdown ────────────────────────────────────────
function CalendarDropdown({ year, month, countsByDate, selectedDate, onSelectDate, onMonthChange, onClose }) {
  const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const firstDay    = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today       = new Date().toISOString().slice(0, 10)
  const pad         = (n) => String(n).padStart(2, '0')

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const totalInMonth = Object.values(countsByDate).reduce((s, v) => s + v, 0)

  return (
    <div
      className="absolute right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
      style={{ width: 260 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <button onClick={() => onMonthChange(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
          <ChevronLeftIcon />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">Tháng {month}/{year}</p>
          {totalInMonth > 0 && (
            <p className="text-[10px] text-green-600 font-medium">{totalInMonth} đơn trong tháng</p>
          )}
        </div>
        <button onClick={() => onMonthChange(1)}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
          <ChevronRightIcon />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-3">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const dateStr    = `${year}-${pad(month)}-${pad(day)}`
          const count      = countsByDate[dateStr] ?? 0
          const isSelected = selectedDate === dateStr
          const isToday    = dateStr === today
          const hasOrders  = count > 0

          return (
            <button key={dateStr}
              onClick={() => { onSelectDate(isSelected ? null : dateStr); onClose() }}
              className="relative flex flex-col items-center justify-center rounded-lg py-1.5 transition-all hover:bg-gray-50"
              style={{
                background: isSelected ? '#16a34a' : isToday && !isSelected ? '#f0fdf4' : undefined,
                border: isToday && !isSelected ? '1px solid #86efac' : '1px solid transparent',
              }}
            >
              <span className="text-[12px] font-medium leading-none"
                style={{ color: isSelected ? '#fff' : isToday ? '#15803d' : hasOrders ? '#111827' : '#9ca3af' }}>
                {day}
              </span>
              {hasOrders && (
                <span className="text-[9px] font-bold leading-none mt-0.5 px-1 min-w-[14px] text-center rounded-full"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#dcfce7',
                    color:      isSelected ? '#fff' : '#15803d',
                  }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Clear filter */}
      {selectedDate && (
        <div className="border-t border-gray-100 px-3 py-2">
          <button
            onClick={() => { onSelectDate(null); onClose() }}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            <XIcon />
            Bỏ lọc ngày {selectedDate.split('-').reverse().join('/')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor = '#16a34a', icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <div className="text-2xl font-semibold text-gray-900 leading-none">{value}</div>
      {sub && <div className="text-xs font-medium" style={{ color: subColor }}>{sub}</div>}
    </div>
  )
}

// ── Mini Bar Chart ────────────────────────────────────────────────
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 mb-3 text-gray-700">
        <BarChartIcon />
        <span className="text-xs font-semibold">Đơn 7 ngày qua</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => {
          const isToday = i === data.length - 1
          const pct = Math.max((d.count / max) * 100, 8)
          return (
            <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] text-gray-400 font-medium">{d.count}</span>
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${pct}%`,
                  background: isToday ? '#16a34a' : '#bbf7d0',
                  minHeight: 4,
                }}
              />
              <span
                className="text-[9px] font-medium"
                style={{ color: isToday ? '#15803d' : '#9ca3af' }}
              >{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Top Products ──────────────────────────────────────────────────
function TopProducts({ items }) {
  const rankColors = ['#d97706', '#6b7280', '#92400e']
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 mb-3 text-gray-700">
        <TrophyIcon />
        <span className="text-xs font-semibold">Top sản phẩm bán chạy</span>
      </div>
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={item.name}
            className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs font-bold w-4 text-center flex-shrink-0"
              style={{ color: rankColors[i] || '#9ca3af' }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
              {item.variant && <p className="text-[10px] text-gray-400">{item.variant}</p>}
            </div>
            <span className="text-xs font-semibold text-green-700 flex-shrink-0">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Urgent Orders ─────────────────────────────────────────────────
function UrgentOrders({ orders, onNavigate }) {
  if (!orders.length) return null
  return (
    <div className="rounded-xl border p-4"
      style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <AlertIcon />
        <span className="text-xs font-semibold text-amber-800">
          Cần xử lý gấp — {orders.length} đơn chờ hoàn tiền
        </span>
      </div>
      <div className="space-y-1.5">
        {orders.map(order => (
          <div key={order.id}
            onClick={() => onNavigate(`/admin/orders/${order.id}`)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors group">
            <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
              #{order.orderCode}
            </span>
            <span className="text-xs text-gray-600 flex-1 truncate">
              {order.shippingAddress?.fullName || '—'}
            </span>
            <span className="text-xs font-semibold text-gray-700">{fmt(order.totalAmount)}</span>
            <span className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0">
              <ChevronRight />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const navigate = useNavigate()

  const [orders, setOrders]               = useState([])
  const [orderCounts, setOrderCounts]     = useState({})
  const [paymentCounts, setPaymentCounts] = useState({})
  const [loading, setLoading]             = useState(true)
  const [totalPages, setTotalPages]       = useState(0)
  const [currentPage, setCurrentPage]     = useState(0)

  const [activeOrderTab, setActiveOrderTab]     = useState('ALL')
  const [activePaymentTab, setActivePaymentTab] = useState('ALL')
  const [search, setSearch]                     = useState('')
  const [inputValue, setInputValue]             = useState('')

  // ── Calendar state ────────────────────────────────────────────────
  const today = new Date()
  const [calYear, setCalYear]           = useState(today.getFullYear())
  const [calMonth, setCalMonth]         = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [countsByDate, setCountsByDate] = useState({})
  const [showCalendar, setShowCalendar] = useState(false)

  // ── Sidebar data ──────────────────────────────────────────────────
  const [weeklyData, setWeeklyData]   = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [urgentOrders, setUrgentOrders] = useState([])

  const abortRef    = useRef(null)
  const debounceRef = useRef(null)
  const searchRef   = useRef(null)
  const calBtnRef   = useRef(null)
  const calPopRef   = useRef(null)

  // ── Close calendar on outside click ──────────────────────────────
  useEffect(() => {
    if (!showCalendar) return
    const handler = (e) => {
      if (
        calBtnRef.current && !calBtnRef.current.contains(e.target) &&
        calPopRef.current && !calPopRef.current.contains(e.target)
      ) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCalendar])

  // ── Fetch counts by date (calendar) ──────────────────────────────
  useEffect(() => {
    adminOrderApi.getOrderCountsByMonth(calYear, calMonth)
      .then(res => setCountsByDate(res.data))
      .catch(() => {})
  }, [calYear, calMonth])

  // ── Core fetch ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async ({
    page       = 0,
    orderTab   = activeOrderTab,
    paymentTab = activePaymentTab,
    q          = search,
    date       = selectedDate,
    append     = false,
  } = {}) => {
    if (abortRef.current) abortRef.current.abort()
    const controller  = new AbortController()
    abortRef.current  = controller

    setLoading(true)
    try {
      const params = { page, size: 15 }
      if (orderTab !== 'ALL')   params.status        = orderTab
      if (paymentTab !== 'ALL') params.paymentStatus = paymentTab
      if (q.trim())             params.search        = q.trim()
      if (date) {
        params.dateFrom = date
        params.dateTo   = date
      }

      const res  = await adminOrderApi.getOrders(params, { signal: controller.signal })
      const data = res.data

      setOrders(prev => append ? [...prev, ...data.content] : data.content)
      setTotalPages(data.totalPages)
      setCurrentPage(data.number)
    } catch (e) {
      if (e?.name === 'AbortError' || e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeOrderTab, activePaymentTab, search, selectedDate])

  // ── Fetch counts (tabs) ───────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const res  = await adminOrderApi.getStatusCounts()
      const data = res.data
      const oc = {}
      const pc = {}
      ;['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].forEach(k => { oc[k] = data[k] ?? 0 })
      ;['ALL', 'PENDING', 'PAID', 'REFUND_PENDING', 'REFUNDED'].forEach(k => { pc[k] = data[`PAY_${k}`] ?? 0 })
      setOrderCounts(oc)
      setPaymentCounts(pc)
    } catch (e) { console.error(e) }
  }, [])

  // ── Fetch sidebar data ────────────────────────────────────────────
  const fetchSidebarData = useCallback(async () => {
    try {
      // Weekly chart — 7 ngày gần nhất
      if (adminOrderApi.getWeeklyOrderCounts) {
        const res = await adminOrderApi.getWeeklyOrderCounts()
        setWeeklyData(res.data)
      } else {
        // Fallback: build from countsByDate
        const result = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          result.push({ label: `${d.getDate()}`, count: countsByDate[key] ?? 0 })
        }
        setWeeklyData(result)
      }
    } catch (e) {}

    try {
      // Top products
      if (adminOrderApi.getTopProducts) {
        const res = await adminOrderApi.getTopProducts({ limit: 5 })
        setTopProducts(res.data)
      }
    } catch (e) {}
  }, [countsByDate])

  // ── Fetch urgent orders (REFUND_PENDING) ──────────────────────────
  const fetchUrgentOrders = useCallback(async () => {
    try {
      const res = await adminOrderApi.getOrders({ paymentStatus: 'REFUND_PENDING', page: 0, size: 5 })
      setUrgentOrders(res.data.content || [])
    } catch (e) {}
  }, [])

  // ── Rebuild weekly chart from countsByDate when it changes ────────
  useEffect(() => {
    if (!adminOrderApi.getWeeklyOrderCounts) {
      const result = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        result.push({ label: `${d.getDate()}`, count: countsByDate[key] ?? 0 })
      }
      setWeeklyData(result)
    }
  }, [countsByDate])

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders({ page: 0, orderTab: 'ALL', paymentTab: 'ALL', q: '', date: null })
    fetchCounts()
    fetchUrgentOrders()
    fetchSidebarData()
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────
  const handleOrderTabChange = (key) => {
    if (key === activeOrderTab) return
    setActiveOrderTab(key)
    setInputValue(''); setSearch('')
    fetchOrders({ page: 0, orderTab: key, paymentTab: activePaymentTab, q: '', date: selectedDate })
  }

  const handlePaymentTabChange = (key) => {
    if (key === activePaymentTab) return
    setActivePaymentTab(key)
    fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: key, q: search, date: selectedDate })
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: activePaymentTab, q: val, date: selectedDate })
    }, 350)
  }

  const handleClearSearch = () => {
    setInputValue(''); setSearch('')
    searchRef.current?.focus()
    fetchOrders({ page: 0, orderTab: activeOrderTab, paymentTab: activePaymentTab, q: '', date: selectedDate })
  }

  const handleRefresh = () => {
    fetchOrders({ page: 0, date: selectedDate })
    fetchCounts()
    fetchUrgentOrders()
    adminOrderApi.getOrderCountsByMonth(calYear, calMonth).then(res => setCountsByDate(res.data)).catch(() => {})
  }

  const handleLoadMore = () => {
    fetchOrders({
      page: currentPage + 1,
      orderTab: activeOrderTab, paymentTab: activePaymentTab,
      q: search, date: selectedDate, append: true,
    })
  }

  const handleMonthChange = (delta) => {
    let newMonth = calMonth + delta
    let newYear  = calYear
    if (newMonth < 1)  { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1;  newYear++ }
    setCalMonth(newMonth)
    setCalYear(newYear)
  }

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr)
    fetchOrders({
      page: 0,
      orderTab:   activeOrderTab,
      paymentTab: activePaymentTab,
      q:          search,
      date:       dateStr,
    })
  }

  // ── Derived ───────────────────────────────────────────────────────
  const refundPendingCount = paymentCounts['REFUND_PENDING'] ?? 0
  const isSearching        = inputValue.trim().length > 0

  // Today's order count from countsByDate
  const todayStr     = today.toISOString().slice(0, 10)
  const todayCount   = countsByDate[todayStr] ?? 0
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)
  const yesterdayCount = countsByDate[yesterdayStr] ?? 0
  const todayDiff    = todayCount - yesterdayCount

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0 flex-shrink-0">

        {/* Top row */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tổng cộng{' '}
              <span className="font-medium text-gray-700">{orderCounts['ALL'] ?? 0}</span> đơn hàng
              {selectedDate && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <CalendarIcon />
                  {selectedDate.split('-').reverse().join('/')}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Calendar button + dropdown */}
            <div className="relative" ref={calBtnRef}>
              <button
                onClick={() => setShowCalendar(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  background:  showCalendar || selectedDate ? '#f0fdf4' : '#fff',
                  color:       showCalendar || selectedDate ? '#15803d' : '#6b7280',
                  borderColor: showCalendar || selectedDate ? '#86efac' : '#e5e7eb',
                }}
              >
                <CalendarIcon />
                <span>Lịch</span>
                {selectedDate && (
                  <span className="text-[10px] bg-green-600 text-white rounded-full px-1.5 py-0.5 leading-none font-bold">
                    {selectedDate.split('-').reverse().slice(0, 2).join('/')}
                  </span>
                )}
              </button>

              {showCalendar && (
                <div ref={calPopRef}>
                  <CalendarDropdown
                    year={calYear}
                    month={calMonth}
                    countsByDate={countsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    onMonthChange={handleMonthChange}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 transition-colors focus-within:border-green-400"
              style={{ width: 220 }}>
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
                <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                  <XIcon />
                </button>
              )}
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshIcon />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Order status tabs */}
        <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {ORDER_STATUS_TABS.map((tab) => {
            const isActive  = activeOrderTab === tab.key
            const count     = orderCounts[tab.key] ?? 0
            const showBadge = ['PENDING', 'CONFIRMED', 'SHIPPING'].includes(tab.key) && count > 0
            return (
              <button key={tab.key} onClick={() => handleOrderTabChange(tab.key)}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-2.5 cursor-pointer transition-all whitespace-nowrap border-b-2"
                style={{
                  fontWeight:   isActive ? 600 : 400,
                  color:        isActive ? '#15803d' : '#6b7280',
                  borderColor:  isActive ? '#16a34a' : 'transparent',
                  background:   'transparent',
                }}>
                {tab.label}
                {count > 0 && (showBadge || isActive) && (
                  <span className="text-xs px-1.5 rounded-full font-semibold leading-relaxed min-w-[18px] text-center"
                    style={{ background: isActive ? '#16a34a' : showBadge ? '#ef4444' : '#16a34a', color: '#fff' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 flex-shrink-0">
        <StatCard
          label="Đơn hôm nay"
          value={todayCount}
          sub={todayDiff > 0 ? `↑ ${todayDiff} so với hôm qua` : todayDiff < 0 ? `↓ ${Math.abs(todayDiff)} so với hôm qua` : 'Bằng hôm qua'}
          subColor={todayDiff >= 0 ? '#16a34a' : '#dc2626'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>}
        />
        <StatCard
          label="Tổng đơn tháng này"
          value={Object.values(countsByDate).reduce((s, v) => s + v, 0)}
          sub="Trong tháng hiện tại"
          subColor="#6b7280"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard
          label="Chờ xác nhận"
          value={orderCounts['PENDING'] ?? 0}
          sub={(orderCounts['PENDING'] ?? 0) > 0 ? 'Cần xử lý sớm' : 'Không có đơn chờ'}
          subColor={(orderCounts['PENDING'] ?? 0) > 0 ? '#d97706' : '#16a34a'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Chờ hoàn tiền"
          value={refundPendingCount}
          sub={refundPendingCount > 0 ? '⚠ Ưu tiên xử lý' : 'Không có'}
          subColor={refundPendingCount > 0 ? '#ea580c' : '#16a34a'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M15 9H9v6h6V9z"/></svg>}
        />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto">
        <div className="flex gap-4 px-6 py-4">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Payment tabs */}
            <div className="flex gap-1.5 items-center flex-wrap">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Thanh toán:</span>
              {PAYMENT_STATUS_TABS.map((tab) => {
                const isActive = activePaymentTab === tab.key
                const count    = paymentCounts[tab.key] ?? 0
                const isUrgent = tab.urgent
                const urgentAndHasCount = isUrgent && count > 0
                return (
                  <button key={tab.key} onClick={() => handlePaymentTabChange(tab.key)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap"
                    style={{
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? (isUrgent ? '#fff7ed' : '#fff') : urgentAndHasCount ? '#fff7ed' : 'transparent',
                      color:      isActive ? (isUrgent ? '#c2410c' : '#15803d') : urgentAndHasCount ? '#c2410c' : '#9ca3af',
                      border:     isActive ? `1.5px solid ${isUrgent ? '#fed7aa' : '#e5e7eb'}` : urgentAndHasCount ? '1.5px solid #fed7aa' : '1px solid #f3f4f6',
                      boxShadow:  isActive && isUrgent && count > 0 ? '0 0 0 3px rgba(234,88,12,0.1)' : 'none',
                    }}>
                    {tab.label}
                    {count > 0 && (isActive || isUrgent) && (
                      <span className="text-[10px] px-1.5 rounded-full font-bold leading-relaxed min-w-[16px] text-center"
                        style={{ background: isUrgent ? '#ea580c' : '#16a34a', color: '#fff' }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Urgent orders */}
            <UrgentOrders orders={urgentOrders} onNavigate={navigate} />

            {/* Loading skeleton */}
            {loading && orders.length === 0 && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && orders.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a4 4 0 0 1 8 0v2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedDate
                    ? `Không có đơn hàng nào ngày ${selectedDate.split('-').reverse().join('/')}`
                    : isSearching ? `Không tìm thấy đơn nào với "${inputValue}"`
                    : 'Không có đơn hàng nào'}
                </p>
                {selectedDate && (
                  <button onClick={() => handleSelectDate(null)} className="text-sm text-green-600 underline cursor-pointer">
                    Bỏ lọc ngày
                  </button>
                )}
                {isSearching && !selectedDate && (
                  <button onClick={handleClearSearch} className="text-sm text-green-600 underline cursor-pointer">
                    Xoá tìm kiếm
                  </button>
                )}
              </div>
            )}

            {/* Orders table */}
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
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => {
                      const addr = order.shippingAddress
                      const isRefundPending = order.paymentStatus === 'REFUND_PENDING'
                      return (
                        <tr key={order.id}
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors group"
                          style={isRefundPending ? { background: '#fffbeb' } : {}}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                #{order.orderCode}
                              </span>
                              {isRefundPending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" title="Chờ hoàn tiền" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{addr?.fullName || '—'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{addr?.phone || ''}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-xs text-gray-400 mb-1">
                              {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                            </p>
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-gray-900 text-sm">{fmt(order.totalAmount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-3 py-3 text-gray-300 group-hover:text-gray-500 transition-colors">
                            <ChevronRight />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {currentPage + 1 < totalPages && (
                  <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                    <button onClick={handleLoadMore} disabled={loading}
                      className="text-sm text-green-600 font-medium hover:underline cursor-pointer disabled:opacity-50">
                      {loading ? 'Đang tải...' : 'Xem thêm đơn hàng'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading && orders.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-56 flex-shrink-0 space-y-3">
            {weeklyData.length > 0 && <MiniBarChart data={weeklyData} />}
            {topProducts.length > 0 && <TopProducts items={topProducts} />}
          </div>
        </div>
      </div>
    </div>
  )
}