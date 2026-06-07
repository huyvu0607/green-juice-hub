import { useState, useCallback, useRef, useEffect } from "react";
import { useProductDetail } from "@/hooks/useProductDetail";
import ProductCard from "@/components/product/ProductCard";
import { sharedObserver } from "@/utils/sharedObserver";
import useCartStore from '@/store/useCartStore'
import RichText from '@/components/common/RichText';
import { useParams, Link, useNavigate } from "react-router-dom";  // thêm useNavigate
import useAuthStore from "@/store/authStore";
import { usePageReady } from '@/hooks/usePageReady'




/* ─── Helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const TAG_STYLES = {
  Bestseller: "bg-amber-100 text-amber-800 border border-amber-200",
  Organic: "bg-brand-100 text-brand-700 border border-brand-200",
  New: "bg-sky-100 text-sky-700 border border-sky-200",
  Sale: "bg-red-100 text-red-700 border border-red-200",
};
const tagClass = (tag) =>
  TAG_STYLES[tag] ?? "bg-neutral-100 text-neutral-600 border border-neutral-200";

/**
 * Map relatedProducts (shape từ backend/ProductDetailPage)
 * sang shape mà ProductCard cần.
 *
 * ProductCard cần:
 *   slug, name, primaryImage, avgRating, reviewCount,
 *   minSalePrice, maxDiscountPercent, inStock, tags (string[]), categoryName
 */
function mapToProductCardShape(p) {
  const variants = p.variants ?? [];

  // minSalePrice — lấy giá thấp nhất trong các variant đang active
  const activePrices = variants
    .filter((v) => v.isActive !== false)
    .map((v) => Number(v.salePrice))
    .filter((n) => !isNaN(n));
  const minSalePrice = activePrices.length ? Math.min(...activePrices) : 0;

  // maxDiscountPercent
  const discounts = variants
    .filter((v) => v.isActive !== false)
    .map((v) => Number(v.discountPercent))
    .filter((n) => !isNaN(n));
  const maxDiscountPercent = discounts.length ? Math.max(...discounts) : 0;

  // inStock — có ít nhất 1 variant còn hàng
  const inStock = variants.some((v) => v.stockQty > 0);


  // tags — backend trả [{name: "Bestseller"}] hoặc ["Bestseller"]
  // ProductCard cần key lowercase: "bestseller", "organic", "new", "sugar-free"
  const TAG_KEY_MAP = {
    Bestseller: "bestseller",
    Organic: "organic",
    New: "new",
    Sale: "sale",
    "Sugar-free": "sugar-free",
  };
  const tags = (p.tags ?? []).map((t) => {
    const raw = t?.name ?? t;
    return TAG_KEY_MAP[raw] ?? raw?.toLowerCase() ?? raw;
  });

  return {
    slug: p.slug,
    name: p.name,
    primaryImage: p.primaryImage ?? null,
    avgRating: p.avgRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    minSalePrice: p.minSalePrice ?? 0,
    maxDiscountPercent: p.maxDiscountPercent ? Math.round(Number(p.maxDiscountPercent)) : 0,
    inStock: p.inStock ?? false,
    tags: p.tags ?? [],        // backend đã trả lowercase rồi
    categoryName: p.categoryName ?? "",
     id: p.id,
    defaultVariantId: p.defaultVariantId
      ?? variants.find(v => v.isActive && v.stockQty > 0)?.id
      ?? variants[0]?.id,
  };
}

/* ─── Sub-components ────────────────────────────────────────── */
function AnimatedCard({ children, colIndex = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sharedObserver.observe(el, () => setVisible(true));
    return () => sharedObserver.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: visible ? `${colIndex * 80}ms` : "0ms",
        transitionProperty: "opacity, transform",
        transitionDuration: "600ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.88)",
      }}
    >
      {children}
    </div>
  );
}
/** Breadcrumb */
function Breadcrumb({ category, name }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-secondary mb-6 font-sans">
      <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
      <span className="text-muted-fg">/</span>
      {category && (
        <>
          <Link
            to={`/products?categoryId=${category.id}`}
            className="hover:text-primary transition-colors"
          >
            {category.name}
          </Link>
          <span className="text-muted-fg">/</span>
        </>
      )}
      <span className="text-primary font-medium truncate max-w-[180px]">{name}</span>
    </nav>
  );
}

/** Star Rating */
function StarRating({ value = 0, count = 0 }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i + 1 <= Math.floor(value);
    const half = !filled && i < value;
    return { filled, half };
  });
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {stars.map(({ filled, half }, i) => (
          <svg key={i} className="w-4 h-4" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`star-${i}`}>
                <stop offset={half ? "50%" : filled ? "100%" : "0%"} stopColor="#f59e0b" />
                <stop offset={half ? "50%" : "0%"} stopColor="#d1d5db" />
              </linearGradient>
            </defs>
            <path
              d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.26 6.62l5.35-.78z"
              fill={filled ? "#f59e0b" : half ? `url(#star-${i})` : "#e5e7eb"}
            />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        {value.toFixed(1)}
      </span>
      <span className="text-sm text-secondary">({count} đánh giá)</span>
    </div>
  );
}

/** Image Gallery */
function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-square rounded-[var(--radius-lg)] bg-muted flex items-center justify-center text-muted-fg">
        <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-muted shadow-[var(--shadow-md)]">
        <img
          src={images[active]?.url}
          alt={images[active]?.alt ?? "Ảnh sản phẩm"}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {images[active]?.isPrimary && (
          <span className="absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-pill bg-brand-600 text-white">
            Ảnh chính
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id ?? idx}
              onClick={() => setActive(idx)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-[var(--radius-md)] overflow-hidden border-2 transition-all duration-200
                ${idx === active
                  ? "border-[var(--color-primary)] shadow-[var(--shadow-glow)]"
                  : "border-transparent opacity-60 hover:opacity-90"}
              `}
            >
              <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Variant Selector (flavor + size) */
function VariantSelector({ variants = [], selected, onSelect }) {
  const flavors = [...new Map(
    variants.filter(v => v.flavor).map(v => [v.flavor.id, v.flavor])
  ).values()];
  const sizes = [...new Map(
    variants.filter(v => v.size).map(v => [v.size.id, v.size])
  ).values()];

  const handleFlavor = (flavorId) => {
    const match = variants.find(
      v => v.flavor?.id === flavorId && (selected?.size ? v.size?.id === selected?.size?.id : true)
    ) ?? variants.find(v => v.flavor?.id === flavorId);
    if (match) onSelect(match);
  };

  const handleSize = (sizeId) => {
    const match = variants.find(
      v => v.size?.id === sizeId && (selected?.flavor ? v.flavor?.id === selected?.flavor?.id : true)
    ) ?? variants.find(v => v.size?.id === sizeId);
    if (match) onSelect(match);
  };

  const isFlavorActive = (id) => selected?.flavor?.id === id;
  const isSizeActive = (id) => selected?.size?.id === id;

  const btnBase =
    "px-3.5 py-1.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all duration-150 cursor-pointer select-none";
  const btnActive =
    "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--shadow-glow)]";
  const btnInactive =
    "bg-base border-default text-primary hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]";

  return (
    <div className="flex flex-col gap-4">
      {flavors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Hương vị:&nbsp;
            <span className="text-primary font-semibold">{selected?.flavor?.name ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {flavors.map(f => (
              <button
                key={f.id}
                onClick={() => handleFlavor(f.id)}
                className={`${btnBase} ${isFlavorActive(f.id) ? btnActive : btnInactive}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Khối lượng:&nbsp;
            <span className="text-primary font-semibold">{selected?.size?.name ?? "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map(s => (
              <button
                key={s.id}
                onClick={() => handleSize(s.id)}
                className={`${btnBase} ${isSizeActive(s.id) ? btnActive : btnInactive}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Quantity Stepper */
function QuantityStepper({ value, min = 1, max, onChange }) {
  return (
    <div className="flex items-center gap-0 rounded-[var(--radius-lg)] border border-default overflow-hidden w-fit">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-lg text-secondary
          hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <span className="w-12 text-center text-sm font-semibold text-primary border-x border-default py-2">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max ?? 999, value + 1))}
        disabled={max !== undefined && value >= max}
        className="w-10 h-10 flex items-center justify-center text-lg text-secondary
          hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
}

/** Trust badges */
function TrustBadges() {
  const badges = [
    { icon: "🌿", label: "Luôn trong xanh" },
    { icon: "✅", label: "100% tươi" },
    { icon: "🚚", label: "Đổi trả 24h" },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)]
            bg-[var(--color-primary-subtle)] border border-[var(--color-brand-200)] text-xs font-medium text-brand-700"
        >
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab section ───────────────────────────────────────────── */
// Chỉ còn 2 tab: Mô tả + Đánh giá, căn giữa
const TABS = ["Mô tả", "Đánh giá"];

function TabSection({ product }) {
  const [tab, setTab] = useState(0);

  const content = [
    // Tab 0 — Mô tả
    <RichText key="desc" content={product.description} />,

    // Tab 1 — Đánh giá
    <div key="rev">
      {product.reviews?.length ? (
        <div className="flex flex-col gap-4">
          {product.reviews.map((r, i) => (
            <div key={i} className="p-4 rounded-[var(--radius-md)] bg-surface border border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <StarRating value={r.rating} count={0} />
                <span className="text-sm font-medium text-primary">{r.userName}</span>
              </div>
              <p className="text-sm text-secondary">{r.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-secondary">Chưa có đánh giá nào.</p>
      )}
    </div>,
  ];

  return (
    <div className="mt-10">
      {/* Tab headers — căn giữa */}
      <div className="flex justify-center border-b border-subtle">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`
              px-10 pb-3 pt-1 text-sm font-medium border-b-2 transition-all duration-150 -mb-px
              ${tab === i
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-secondary hover:text-primary"}
            `}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="py-6">{content[tab]}</div>
    </div>
  );
}

/** Skeleton loader */
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-[var(--radius-md)] bg-muted ${className}`} />
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square rounded-[var(--radius-lg)]" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="w-16 h-16 rounded-[var(--radius-md)]" />)}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const { product, loading, error } = useProductDetail(slug);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, loading: cartLoading } = useCartStore()
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  usePageReady(loading)


  // Chọn variant mặc định khi data load xong
  const initVariant = useCallback((variants) => {
    if (!variants?.length) return;
    const first = variants.find(v => v.isActive && v.stockQty > 0) ?? variants[0];
    setSelectedVariant(first);
  }, []);

  if (product && !selectedVariant) {
    initVariant(product.variants);
  }

  /* Add to cart mock */
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!selectedVariant || !product?.id) return;
    try {
      await addItem(product.id, selectedVariant.id, qty);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      window.dispatchEvent(new CustomEvent('cart:item-added', {
      detail: { imageUrl: product.images?.[0]?.url ?? product.primaryImage ?? null }
    }))
    } catch {
      // error đã được set trong store
    }
  };
  const handleBuyNow = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!selectedVariant || !product?.id) return;

    navigate("/checkout", {
      state: {
        buyNowItem: {
          cartItemId: `buynow-${selectedVariant.id}`,
          productName: product.name,
          imageUrl: product.images?.[0]?.url ?? null,
          variantId: selectedVariant.id,
          variantLabel: [selectedVariant.flavor?.name, selectedVariant.size?.name]
            .filter(Boolean).join(" / "),
          originalPrice: selectedVariant.originalPrice,
          salePrice: selectedVariant.salePrice,
          quantity: qty,
        },
      },
    });
  };
  /* ── Loading ── */
  if (loading) return <DetailSkeleton />;

  /* ── Error ── */
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🥤</div>
        <h2 className="text-xl font-display font-semibold text-primary mb-2">
          Không tìm thấy sản phẩm
        </h2>
        <p className="text-secondary text-sm mb-6">{error}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)]
            bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const variant = selectedVariant;
  const discountPct = variant ? Math.round(Number(variant.discountPercent)) : 0;
  const inStock = variant ? variant.stockQty > 0 : false;
  const stockLow = variant && variant.stockQty > 0 && variant.stockQty <= 5;

  // Map relatedProducts sang shape ProductCard cần
  const relatedCards = (product.relatedProducts ?? []).map(mapToProductCardShape);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-slide-up">

      <Breadcrumb category={product.category} name={product.name} />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

        {/* Left — Gallery */}
        <div>
          <ImageGallery images={product.images ?? []} />
        </div>

        {/* Right — Info */}
        <div className="flex flex-col gap-5">

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <span key={t.name ?? t} className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${tagClass(t.name ?? t)}`}>
                  {t.name ?? t}
                </span>
              ))}
            </div>
          )}

          {/* Name */}
          <h1 className="font-display text-3xl font-bold text-primary leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <StarRating value={product.avgRating ?? 0} count={product.reviewCount ?? 0} />

          {/* Price block */}
          {variant && (
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl font-bold font-display text-[var(--color-primary)]">
                {fmt(variant.salePrice)}
              </span>
              {discountPct > 0 && (
                <>
                  <span className="text-lg text-muted-fg line-through">
                    {fmt(variant.originalPrice)}
                  </span>
                  <span className="px-2 py-0.5 text-sm font-bold rounded-pill bg-red-100 text-red-700 border border-red-200">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
          )}

          {/* Short description
          {product.description && (
            <p className="text-sm text-secondary leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )} */}

          {/* Variant selector */}
          {product.variants?.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selected={variant}
              onSelect={(v) => { setSelectedVariant(v); setQty(1); }}
            />
          )}

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-400"}`} />
            {inStock
              ? stockLow
                ? <span className="text-amber-700 font-medium">Sắp hết hàng — còn {variant.stockQty} sản phẩm</span>
                : <span className="text-green-700 font-medium">Còn hàng</span>
              : <span className="text-red-600 font-medium">Tạm hết hàng</span>
            }
          </div>

          {/* Qty + CTA */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-secondary">Số lượng:</span>
              <QuantityStepper
                value={qty}
                min={1}
                max={variant?.stockQty}
                onChange={setQty}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[var(--radius-pill)]
                  text-sm font-semibold border transition-all duration-200
                  ${addedToCart
                    ? "bg-green-600 border-green-600 text-white"
                    : inStock
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                      : "bg-muted border-default text-muted-fg cursor-not-allowed"}
                `}
              >
                {addedToCart ? "✓ Đã thêm vào giỏ!" : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm vào giỏ
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}   // ← thêm dòng này
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[var(--radius-pill)]
    text-sm font-semibold bg-orange-500 text-white border border-orange-500
    hover:bg-orange-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
                disabled={!inStock || cartLoading}  // ← thêm cartLoading vào disabled
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Mua ngay
              </button>

              <button
                onClick={() => setWishlist(w => !w)}
                className={`
                  w-12 h-12 flex items-center justify-center rounded-[var(--radius-pill)] border transition-all duration-200
                  ${wishlist
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "bg-base border-default text-secondary hover:border-red-300 hover:text-red-400"}
                `}
                aria-label="Thêm vào yêu thích"
              >
                <svg className="w-5 h-5" fill={wishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Trust badges */}
          <TrustBadges />

        </div>
      </div>

      {/* ── Tab section (Mô tả + Đánh giá, căn giữa) ── */}
      <TabSection product={product} />

      {/* ── Sản phẩm liên quan ── */}
      {relatedCards.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-primary">
              Sản phẩm liên quan
            </h2>
            {/* Link "Xem thêm" filter theo category của sản phẩm hiện tại */}
            {product.category && (
              <Link
                to={`/products?categoryId=${product.category.id}`}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline transition-colors"
              >
                Xem tất cả {product.category.name} →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedCards.map((p, idx) => (
              <AnimatedCard key={p.slug ?? idx} delay={idx * 60}>
                <ProductCard product={p} />
              </AnimatedCard>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}