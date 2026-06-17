import { useEffect, useState, useCallback } from 'react'
import adminReviewApi from '@/api/adminReviewApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  starFilled: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-amber-400">
      <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" />
    </svg>
  ),
  starEmpty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      className="h-3.5 w-3.5 text-gray-300">
      <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  reply: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
  ),
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? icons.starFilled : icons.starEmpty}</span>
      ))}
    </div>
  )
}

// ── Image preview modal ───────────────────────────────────────────────────────
function ImageModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}>
      <img src={url} alt="Ảnh đánh giá"
        className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

// ── Reply Box ─────────────────────────────────────────────────────────────────
function ReplyBox({ review, onSaved }) {
  const [open, setOpen]       = useState(false)
  const [text, setText]       = useState(review.reply || '')
  const [saving, setSaving]   = useState(false)

  // Sync khi review thay đổi (sau khi save)
  useEffect(() => { setText(review.reply || '') }, [review.reply])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await adminReviewApi.reply(review.id, text)
      onSaved(res.data)
      setOpen(false)
    } catch {
      alert('Có lỗi khi lưu phản hồi')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Xoá phản hồi này?')) return
    setSaving(true)
    try {
      const res = await adminReviewApi.reply(review.id, '')
      onSaved(res.data)
      setOpen(false)
    } catch {
      alert('Có lỗi khi xoá phản hồi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* Hiển thị reply đã có */}
      {review.reply && !open && (
        <div className="mb-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-blue-700">Quản trị viên</p>
            <p className="text-xs text-blue-400">{fmtDate(review.repliedAt)}</p>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">{review.reply}</p>
        </div>
      )}

      {/* Toggle mở/đóng ô reply */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-600 transition-colors"
        >
          <span className="h-3.5 w-3.5">{icons.reply}</span>
          {review.reply ? 'Sửa phản hồi' : 'Phản hồi'}
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập phản hồi với tư cách Quản trị viên..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
              focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200
              resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving || !text.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5
                  text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
                {saving
                  ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <span className="h-3 w-3">{icons.send}</span>
                }
                Gửi
              </button>
              <button onClick={() => { setOpen(false); setText(review.reply || '') }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                Huỷ
              </button>
            </div>
            {/* Xoá reply nếu đã có */}
            {review.reply && (
              <button onClick={handleDelete} disabled={saving}
                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Xoá phản hồi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, onUpdated, onDeleted }) {
  const [imgOpen, setImgOpen]   = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      const res = await adminReviewApi.toggle(review.id)
      onUpdated(res.data)
    } catch {
      alert('Có lỗi khi thay đổi trạng thái')
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Xoá hẳn đánh giá này khỏi hệ thống?')) return
    setDeleting(true)
    try {
      await adminReviewApi.delete(review.id)
      onDeleted(review.id)
    } catch {
      alert('Có lỗi khi xoá đánh giá')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
      review.isApproved ? 'border-gray-200' : 'border-gray-200 opacity-70'
    }`}>
      {/* Top: avatar + rating + badge + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName}
              className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              bg-green-100 text-sm font-semibold text-green-700">
              {(review.userName || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{review.userName || 'Ẩn danh'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Stars rating={review.rating} />
              <span className="text-xs text-gray-400">{fmtDate(review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions: toggle hiển thị + xoá */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={review.isApproved ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs
              font-medium transition-colors disabled:opacity-50 ${
              review.isApproved
                ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <span className="h-3.5 w-3.5">
              {toggling
                ? <span className="block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : review.isApproved ? icons.eyeOff : icons.eye
              }
            </span>
            {review.isApproved ? 'Ẩn' : 'Hiện'}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Xoá đánh giá"
            className="flex items-center justify-center rounded-lg border border-red-100
              bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <span className="h-3.5 w-3.5">
              {deleting
                ? <span className="block h-3 w-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                : icons.trash
              }
            </span>
          </button>
        </div>
      </div>

      {/* Sản phẩm + đơn hàng */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1
          text-xs font-medium text-gray-700">
          {review.productName || `Sản phẩm #${review.productId}`}
        </span>
        <span className="text-xs text-gray-400">
          Đơn <span className="font-mono font-medium text-gray-600">
            #{review.orderCode || review.orderId}
          </span>
        </span>
        {/* Badge ẩn */}
        {!review.isApproved && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5
            text-xs text-gray-500">
            Đang ẩn
          </span>
        )}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}

      {/* Ảnh */}
      {review.imageUrl && (
        <div className="mt-3">
          <button onClick={() => setImgOpen(true)}
            className="group relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200
              hover:border-green-400 transition-colors">
            <img src={review.imageUrl} alt="Ảnh đánh giá" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center
              bg-black/0 group-hover:bg-black/20 transition-colors">
              <span className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {icons.image}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Reply box */}
      <ReplyBox review={review} onSaved={onUpdated} />

      {imgOpen && <ImageModal url={review.imageUrl} onClose={() => setImgOpen(false)} />}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-28 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="h-6 w-40 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-10 rounded bg-gray-100 animate-pulse" />
    </div>
  )
}

// ── Filter config ─────────────────────────────────────────────────────────────
const VISIBILITY_TABS = [
  { key: '',      label: 'Tất cả',      isApproved: undefined },
  { key: 'show',  label: 'Đang hiện',   isApproved: true },
  { key: 'hide',  label: 'Đang ẩn',     isApproved: false },
]

const STAR_FILTERS = [
  { value: '', label: 'Tất cả sao' },
  { value: '5', label: '⭐ 5 sao' },
  { value: '4', label: '⭐ 4 sao' },
  { value: '3', label: '⭐ 3 sao' },
  { value: '2', label: '⭐ 2 sao' },
  { value: '1', label: '⭐ 1 sao' },
]

const PAGE_SIZE = 10

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const [tab, setTab]           = useState('')
  const [starFilter, setStar]   = useState('')
  const [reviews, setReviews]   = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentTab = VISIBILITY_TABS.find((t) => t.key === tab)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        ...(currentTab.isApproved !== undefined && { isApproved: currentTab.isApproved }),
        ...(starFilter && { rating: parseInt(starFilter) }),
      }
      const res = await adminReviewApi.getReviews(params)
      setReviews(res.data.content)
      setTotal(res.data.totalElements)
    } catch {
      setError('Không thể tải danh sách đánh giá')
    } finally {
      setLoading(false)
    }
  }, [page, tab, starFilter])

  useEffect(() => { fetchReviews() }, [fetchReviews])
  useEffect(() => { setPage(0) }, [tab, starFilter])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdated = (updated) => {
    setReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r))
  }

  const handleDeleted = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setTotal((t) => Math.max(0, t - 1))
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Quản lý đánh giá</h1>
        <p className="mt-0.5 text-sm text-gray-500">{total} đánh giá</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Visibility tabs */}
        <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
          {VISIBILITY_TABS.map((t) => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className="px-5 py-2 text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? '#16a34a' : 'transparent',
                color: tab === t.key ? '#fff' : '#6b7280',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Star filter */}
        <select value={starFilter} onChange={(e) => setStar(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm
            focus:border-green-500 focus:outline-none">
          {STAR_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border
          border-gray-200 bg-white py-16 text-gray-400">
          <span className="mb-2 text-4xl">⭐</span>
          <p className="text-sm">Không có đánh giá nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Hiển thị {reviews.length} / {total} đánh giá</span>
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
  )
}