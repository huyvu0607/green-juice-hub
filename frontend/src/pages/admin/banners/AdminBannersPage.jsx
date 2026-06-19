import { useEffect, useState, useCallback, useRef } from 'react'
import adminBannerApi from '@/api/adminBannerApi'
import { uploadImage } from '@/api/cloudinaryApi'
import { useAdminRole } from '@/hooks/useAdminRole'

// ─── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
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
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
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
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
}

// ─── BannerFormModal ──────────────────────────────────────────────────────────

function BannerFormModal({ banner, onClose, onSaved }) {
  const [form, setForm] = useState(
    banner
      ? { ...banner }
      : { ...EMPTY_FORM }
  )
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(banner?.imageUrl || '')
  const fileInputRef = useRef(null)

  const isEdit = !!banner

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview ngay lập tức
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    setError('')
    try {
      const url = await uploadImage(file, 'banners')
      set('imageUrl', url)
      setPreviewUrl(url)
    } catch (err) {
      setError(err.message || 'Upload ảnh thất bại')
      setPreviewUrl(form.imageUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề'); return }
    if (!form.imageUrl)      { setError('Vui lòng upload ảnh banner'); return }

    setLoading(true); setError('')
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description?.trim() || null,
        imageUrl:    form.imageUrl,
        linkUrl:     form.linkUrl?.trim() || null,
        sortOrder:   Number(form.sortOrder) || 0,
        isActive:    form.isActive,
      }

      let res
      if (isEdit) {
        res = await adminBannerApi.update(banner.id, payload)
      } else {
        res = await adminBannerApi.create(payload)
      }

      onSaved(res.data, isEdit)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-200'
  const labelCls = 'mb-1 block text-xs font-medium text-gray-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <span className="h-5 w-5 block">{icons.x}</span>
          </button>
        </div>

        <div className="space-y-4">

          {/* Upload ảnh */}
          <div>
            <label className={labelCls}>Ảnh banner *</label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition
                ${uploading ? 'cursor-wait opacity-70' : 'hover:border-green-400 hover:bg-green-50'}
                ${previewUrl ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}
              `}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                  {/* overlay khi hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/30">
                    <span className="hidden h-8 w-8 text-white group-hover:block">{icons.upload}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <span className="h-10 w-10">{icons.image}</span>
                  <span className="text-sm">Click để chọn ảnh</span>
                  <span className="text-xs text-gray-300">PNG, JPG, WEBP</span>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                    <span className="text-xs text-gray-500">Đang upload...</span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewUrl && !uploading && (
              <p className="mt-1 text-right text-xs text-gray-400">
                Click vào ảnh để thay đổi
              </p>
            )}
          </div>

          {/* Tiêu đề */}
          <div>
            <label className={labelCls}>Tiêu đề *</label>
            <input
              className={inputCls}
              placeholder="VD: Khuyến mãi mùa hè 2026"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className={labelCls}>Mô tả (không bắt buộc)</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={2}
              placeholder="VD: Ép tươi mỗi ngày, giao nhanh trong 2h nội thành"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Link URL */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 inline-block">{icons.link}</span>
                URL liên kết (không bắt buộc)
              </span>
            </label>
            <input
              className={inputCls}
              placeholder="VD: /products?category=nuoc-ep"
              value={form.linkUrl}
              onChange={e => set('linkUrl', e.target.value)}
            />
          </div>

          {/* Sort order + isActive */}
          <div className="flex items-center gap-4">
            <div className="w-32">
              <label className={labelCls}>Thứ tự hiển thị</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={e => set('sortOrder', e.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center gap-2 pt-5">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700">
                {form.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm banner'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ banner, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-semibold text-gray-900">Xoá banner?</h3>
        <p className="mb-1 text-sm text-gray-500">
          Banner <span className="font-medium text-gray-700">"{banner.title}"</span> sẽ bị xoá vĩnh viễn.
        </p>
        <p className="text-sm text-red-500">Hành động này không thể hoàn tác.</p>

        {/* Preview nhỏ */}
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="mt-3 h-24 w-full rounded-lg object-cover"
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BannerCard ───────────────────────────────────────────────────────────────

function BannerCard({ banner, onEdit, onDelete, onToggle, toggling, canWrite }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all
      ${banner.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}
    `}>
      {/* Ảnh banner */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="h-12 w-12 text-gray-300">{icons.image}</span>
          </div>
        )}

        {/* Badge thứ tự */}
        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs font-semibold text-white">
          {banner.sortOrder}
        </div>

        {/* Badge trạng thái */}
        <div className="absolute right-2 top-2">
          {banner.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Đang hiện
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/90 px-2 py-0.5 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Đang ẩn
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="mb-1 truncate font-medium text-gray-900">{banner.title}</p>
        {banner.linkUrl ? (
          <p className="flex items-center gap-1 truncate text-xs text-gray-400">
            <span className="h-3 w-3 shrink-0">{icons.link}</span>
            {banner.linkUrl}
          </p>
        ) : (
          <p className="text-xs text-gray-300">Không có liên kết</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2.5">
        {canWrite && (
          <>
            {/* Toggle active */}
            <button
              onClick={() => onToggle(banner)}
              disabled={toggling === banner.id}
              title={banner.isActive ? 'Ẩn banner' : 'Hiện banner'}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition
                ${banner.isActive
                  ? 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                } disabled:opacity-50`}
            >
              <span className="h-3.5 w-3.5">
                {banner.isActive ? icons.eyeOff : icons.eye}
              </span>
              {toggling === banner.id ? '...' : banner.isActive ? 'Ẩn' : 'Hiện'}
            </button>

            {/* Sửa */}
            <button
              onClick={() => onEdit(banner)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <span className="h-3.5 w-3.5">{icons.edit}</span>
              Sửa
            </button>

            {/* Xoá */}
            <button
              onClick={() => onDelete(banner)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
            >
              <span className="h-3.5 w-3.5">{icons.trash}</span>
              Xoá
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBannersPage() {
  const { canWrite } = useAdminRole()

  const [banners, setBanners]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Modal states
  const [formModal, setFormModal]     = useState(null)   // null | 'new' | banner object
  const [deleteModal, setDeleteModal] = useState(null)   // null | banner object
  const [deleting, setDeleting]       = useState(false)
  const [toggling, setToggling]       = useState(null)   // banner id

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBanners = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await adminBannerApi.getAll()
      setBanners(res.data)
    } catch {
      setError('Không thể tải danh sách banner')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSaved = (savedBanner, isEdit) => {
    if (isEdit) {
      setBanners(prev => prev.map(b => b.id === savedBanner.id ? savedBanner : b))
    } else {
      setBanners(prev => [...prev, savedBanner].sort((a, b) => a.sortOrder - b.sortOrder))
    }
  }

  const handleToggle = async (banner) => {
    setToggling(banner.id)
    try {
      const res = await adminBannerApi.toggleActive(banner.id)
      setBanners(prev => prev.map(b => b.id === banner.id ? res.data : b))
    } catch {
      alert('Có lỗi khi thay đổi trạng thái')
    } finally {
      setToggling(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await adminBannerApi.remove(deleteModal.id)
      setBanners(prev => prev.filter(b => b.id !== deleteModal.id))
      setDeleteModal(null)
    } catch {
      alert('Có lỗi khi xoá banner')
    } finally {
      setDeleting(false)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const activeCount   = banners.filter(b => b.isActive).length
  const inactiveCount = banners.length - activeCount

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Banner</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {banners.length} banner
            {activeCount > 0 && (
              <span className="ml-1 text-green-600">· {activeCount} đang hiện</span>
            )}
            {inactiveCount > 0 && (
              <span className="ml-1 text-gray-400">· {inactiveCount} đang ẩn</span>
            )}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setFormModal('new')}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition"
          >
            <span className="h-4 w-4">{icons.plus}</span>
            Thêm banner
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="h-44 animate-pulse bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="flex gap-2 border-t border-gray-100 px-4 py-2.5">
                <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-7 w-14 animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid banners */}
      {!loading && banners.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <span className="mb-3 h-12 w-12 text-gray-300">{icons.image}</span>
          <p className="text-sm font-medium text-gray-500">Chưa có banner nào</p>
          <p className="mt-1 text-xs text-gray-400">Nhấn "Thêm banner" để bắt đầu</p>
        </div>
      )}

      {!loading && banners.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map(banner => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={b => setFormModal(b)}
              onDelete={b => setDeleteModal(b)}
              onToggle={handleToggle}
              toggling={toggling}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      {/* Ghi chú thứ tự */}
      {!loading && banners.length > 1 && (
        <p className="text-xs text-gray-400">
          💡 Banner được sắp xếp theo thứ tự hiển thị (số nhỏ hiện trước). Chỉnh số thứ tự khi sửa banner.
        </p>
      )}

      {/* Modals */}
      {formModal && (
        <BannerFormModal
          banner={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          banner={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}
    </div>
  )
}