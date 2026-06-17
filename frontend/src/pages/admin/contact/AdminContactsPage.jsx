import { useEffect, useState, useCallback, useRef } from 'react'
import adminContactApi from '@/api/adminContactApi'

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Config ────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'ALL',         label: 'Tất cả' },
  { key: 'NEW',         label: 'Mới' },
  { key: 'IN_PROGRESS', label: 'Đang xử lý' },
  { key: 'RESOLVED',    label: 'Đã giải quyết' },
]

const STATUS_CFG = {
  NEW:         { label: 'Mới',          color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  IN_PROGRESS: { label: 'Đang xử lý',  color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  RESOLVED:    { label: 'Đã giải quyết', color: '#14532d', bg: '#dcfce7', dot: '#16a34a' },
}

const PAGE_SIZE = 10

// ── Icons ─────────────────────────────────────────────────────────
const icons = {
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 9.81a19.79 19.79 0 0 1-3.07-8.68A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  ),
  reply: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
}

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#374151', bg: '#f3f4f6', dot: '#9ca3af' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ── Reply Box ─────────────────────────────────────────────────────
function ReplyBox({ contact, onSaved }) {
  const [open, setOpen]     = useState(false)
  const [text, setText]     = useState(contact.reply || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setText(contact.reply || '') }, [contact.reply])

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await adminContactApi.reply(contact.id, text.trim())
      onSaved(res.data)
      setOpen(false)
    } catch {
      alert('Có lỗi khi gửi phản hồi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* Hiển thị reply đã có */}
      {contact.reply && !open && (
        <div className="mb-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-blue-700">
                {contact.repliedByName || 'Quản trị viên'}
              </p>
            </div>
            <p className="text-xs text-blue-400">{fmtDate(contact.repliedAt)}</p>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">{contact.reply}</p>
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="h-3.5 w-3.5">{icons.reply}</span>
          {contact.reply ? 'Sửa phản hồi' : 'Phản hồi qua email'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            Email sẽ được gửi tới <span className="font-medium text-gray-600">{contact.email}</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung phản hồi..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200
              resize-none leading-relaxed"
          />
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || !text.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5
                text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
              {saving
                ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                : <span className="h-3 w-3">{icons.send}</span>
              }
              Gửi phản hồi
            </button>
            <button
              onClick={() => { setOpen(false); setText(contact.reply || '') }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Contact Card ──────────────────────────────────────────────────
function ContactCard({ contact, onUpdated }) {
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (contact.status === newStatus) return
    setUpdatingStatus(true)
    try {
      const res = await adminContactApi.updateStatus(contact.id, newStatus)
      onUpdated(res.data)
    } catch {
      alert('Có lỗi khi cập nhật trạng thái')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
      {/* Top: info + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar chữ cái */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
            bg-green-100 text-sm font-semibold text-green-700">
            {(contact.fullName || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{contact.fullName}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-3 w-3 shrink-0">{icons.mail}</span>
                {contact.email}
              </span>
              {contact.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="h-3 w-3 shrink-0">{icons.phone}</span>
                  {contact.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={contact.status} />
        </div>
      </div>

      {/* Subject */}
      <div>
        <p className="text-xs text-gray-400 mb-0.5">Chủ đề</p>
        <p className="text-sm font-medium text-gray-800">{contact.subject}</p>
      </div>

      {/* Message */}
      <div className="rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
      </div>

      {/* Footer: ngày gửi + actions đổi status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <span className="h-3 w-3">{icons.clock}</span>
          {fmtDate(contact.createdAt)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Nút đổi status nhanh */}
          {contact.status !== 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={updatingStatus}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border
                border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100
                disabled:opacity-50 transition-colors font-medium"
            >
              Đang xử lý
            </button>
          )}
          {contact.status !== 'RESOLVED' && (
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border
                border-green-200 bg-green-50 text-green-700 hover:bg-green-100
                disabled:opacity-50 transition-colors font-medium"
            >
              {updatingStatus
                ? <span className="h-3 w-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                : <span className="h-3 w-3">{icons.check}</span>
              }
              Đã giải quyết
            </button>
          )}
          {contact.status === 'RESOLVED' && (
            <button
              onClick={() => handleStatusChange('NEW')}
              disabled={updatingStatus}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200
                text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Mở lại
            </button>
          )}
        </div>
      </div>

      {/* Reply box */}
      <ReplyBox contact={contact} onSaved={onUpdated} />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-32 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-48 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
      <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, color = '#374151', bg = '#f9fafb' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl font-semibold leading-none" style={{ color }}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function AdminContactsPage() {
  const [tab, setTab]             = useState('ALL')
  const [contacts, setContacts]   = useState([])
  const [stats, setStats]         = useState({ totalNew: 0, totalInProgress: 0, totalResolved: 0, total: 0 })
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ── Fetch stats ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminContactApi.getStats()
      setStats(res.data)
    } catch {}
  }, [])

  // ── Fetch contacts ───────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, size: PAGE_SIZE }
      if (tab !== 'ALL') params.status = tab

      const res = await adminContactApi.getContacts(params)
      setContacts(res.data.content)
      setTotal(res.data.totalElements)
    } catch {
      setError('Không thể tải danh sách liên hệ')
    } finally {
      setLoading(false)
    }
  }, [page, tab])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { setPage(0) }, [tab])

  // ── Handlers ─────────────────────────────────────────────────
  const handleUpdated = (updated) => {
    setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    // Refresh stats vì status có thể thay đổi
    fetchStats()
  }

  const handleRefresh = () => {
    fetchContacts()
    fetchStats()
  }

  // ── Tab counts ────────────────────────────────────────────────
  const tabCount = {
    ALL:         stats.total,
    NEW:         stats.totalNew,
    IN_PROGRESS: stats.totalInProgress,
    RESOLVED:    stats.totalResolved,
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Quản lý liên hệ</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tổng cộng <span className="font-medium text-gray-700">{stats.total}</span> liên hệ
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="h-3.5 w-3.5">{icons.refresh}</span>
            Làm mới
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {STATUS_TABS.map((t) => {
            const isActive = tab === t.key
            const count    = tabCount[t.key] ?? 0
            const isNew    = t.key === 'NEW' && count > 0
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-2.5
                  cursor-pointer transition-all whitespace-nowrap border-b-2"
                style={{
                  fontWeight:  isActive ? 600 : 400,
                  color:       isActive ? '#15803d' : '#6b7280',
                  borderColor: isActive ? '#16a34a' : 'transparent',
                  background:  'transparent',
                }}>
                {t.label}
                {count > 0 && (
                  <span className="text-xs px-1.5 rounded-full font-semibold leading-relaxed min-w-[18px] text-center"
                    style={{
                      background: isActive ? '#16a34a' : isNew ? '#ef4444' : '#e5e7eb',
                      color:      isActive || isNew ? '#fff' : '#6b7280',
                    }}>
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
        <StatCard label="Tổng liên hệ"    value={stats.total}          color="#374151" />
        <StatCard label="Mới"             value={stats.totalNew}        color="#1e40af" />
        <StatCard label="Đang xử lý"      value={stats.totalInProgress} color="#92400e" />
        <StatCard label="Đã giải quyết"   value={stats.totalResolved}   color="#14532d" />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-3">

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border
            border-gray-200 bg-white py-16 text-gray-400">
            <span className="mb-3 h-12 w-12 flex items-center justify-center
              rounded-full bg-gray-100 text-gray-300">
              <span className="h-6 w-6">{icons.mail}</span>
            </span>
            <p className="text-sm">Không có liên hệ nào</p>
          </div>
        )}

        {/* Grid cards */}
        {!loading && contacts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
            <span>Hiển thị {contacts.length} / {total} liên hệ</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100
                  disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="h-4 w-4 block">{icons.chevronLeft}</span>
              </button>
              <span>
                Trang <strong className="text-gray-900">{page + 1}</strong> / {totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-100
                  disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="h-4 w-4 block">{icons.chevronRight}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}