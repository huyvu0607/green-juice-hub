import { useState } from 'react'
import useCartStore from '../../store/useCartStore'

const CartItemCard = ({ item, selected, onToggle }) => {
  const { updateItem, removeItem } = useCartStore()
  const [removing, setRemoving] = useState(false)

  const {
    cartItemId,
    productName,
    productSlug,
    imageUrl,
    variantLabel,
    originalPrice,
    salePrice,
    discountPercent,
    quantity,
    subtotal,
    stockQty,
    inStock,
  } = item

  const displayPrice = salePrice ?? originalPrice
  const hasDiscount = discountPercent && discountPercent > 0

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  const handleDecrease = () => {
    if (quantity <= 1) return
    updateItem(cartItemId, quantity - 1)
  }

  const handleIncrease = () => {
    if (quantity >= stockQty) return
    updateItem(cartItemId, quantity + 1)
  }

  const handleRemove = async () => {
    setRemoving(true)
    await removeItem(cartItemId)
  }

  return (
    <div
      className={`
        group relative flex gap-3 p-3 rounded-[var(--radius-md)]
        bg-[var(--color-bg-elevated)] border transition-all duration-200
        ${selected
          ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
          : 'border-[var(--color-border-subtle)]'
        }
        ${removing ? 'opacity-40 scale-95 pointer-events-none' : ''}
        ${!inStock ? 'opacity-60' : ''}
      `}
    >
      {/* Checkbox */}
      <div className="flex items-center shrink-0 pt-0.5">
        <button
          onClick={() => onToggle(cartItemId)}
          disabled={!inStock}
          aria-label={selected ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'}
          className={`
            w-5 h-5 rounded-[var(--radius-sm)] border-2 flex items-center justify-center
            transition-all duration-150 shrink-0
            ${selected
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
              : 'border-[var(--color-border-default)] hover:border-[var(--color-primary)] bg-transparent'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Ảnh sản phẩm */}
      <div className="relative shrink-0 w-[72px] h-[72px] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-bg-muted)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-1 left-1 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-red-500 text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2">
              {productName}
            </p>
            {variantLabel && (
              <p className="mt-0.5 text-[var(--text-xs)] text-[var(--color-text-secondary)]">
                {variantLabel}
              </p>
            )}
            {!inStock && (
              <p className="mt-0.5 text-[var(--text-xs)] text-red-500 font-medium">Hết hàng</p>
            )}
          </div>

          {/* Nút xoá */}
          <button
            onClick={handleRemove}
            className="shrink-0 p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Xoá sản phẩm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Giá + điều chỉnh số lượng */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
              {fmt(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] line-through leading-none">
                {fmt(originalPrice)}
              </span>
            )}
          </div>

          {/* Bộ điều chỉnh số lượng */}
          <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] overflow-hidden">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-7 text-center text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] select-none">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={quantity >= stockQty}
              className="w-7 h-7 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItemCard