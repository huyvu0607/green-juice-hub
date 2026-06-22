import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import useCartStore from '@/store/useCartStore';
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";

const TAG_STYLE = {
  bestseller: "bg-yellow-400 text-yellow-900",
  organic: "bg-green-500 text-white",
  new: "bg-blue-500 text-white",
  "sugar-free": "bg-pink-500 text-white",
};

const TAG_LABEL = {
  bestseller: "Bestseller",
  organic: "Organic",
  new: "New",
  "sugar-free": "Sugar-free",
};

function ImageSkeleton() {
  return (
    <div className="absolute inset-0 bg-[var(--color-bg-muted)] animate-pulse" />
  );
}

export default function ProductCard({ product }) {
  const {
    slug, name, primaryImage, avgRating, reviewCount,
    minSalePrice, maxDiscountPercent, inStock,
    tags = [], categoryName,
  } = product;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }

    const variantId = product.defaultVariantId ?? product.variants?.[0]?.id;
    if (!variantId) return;

    setAdding(true);
    try {
      await addItem(product.id, variantId, 1);
      window.dispatchEvent(new CustomEvent("cart:item-added", {
        detail: { imageUrl: product.primaryImage },
      }));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/products/${slug}`}
      className="group relative bg-[var(--color-bg-card)] rounded-2xl overflow-hidden
                 border border-[var(--color-border-subtle)]
                 hover:shadow-xl hover:-translate-y-0.5
                 transition-all duration-200 flex flex-col"
    >
      {/* ── Image area ── */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-bg-muted)]">

        {!imgLoaded && !imgError && <ImageSkeleton />}

        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={name}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover group-hover:scale-105
              transition-transform duration-300
              ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-200 to-emerald-400" />
        )}

        {/* Tags — top left */}
        <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
          {tags.slice(0, 1).map(tag => (
            <span
              key={tag}
              className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                         ${TAG_STYLE[tag] ?? "bg-gray-400 text-white"}`}
            >
              {TAG_LABEL[tag] ?? tag}
            </span>
          ))}
        </div>

        {/* Discount — top right */}
        {maxDiscountPercent > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white
                           text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full">
            -{maxDiscountPercent}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/70 text-white text-xs font-medium
                             px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}

        {/*
          Add to cart:
          - Mobile: always visible at bottom of image (small icon button, no text)
          - Desktop: slide up on hover with full text
        */}
        {inStock && (
          <>
            {/* Mobile add button — always visible, bottom-right corner */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="
                md:hidden
                absolute bottom-2 right-2 z-10
                w-8 h-8 rounded-full
                bg-[var(--color-primary)] text-white
                flex items-center justify-center
                shadow-[0_2px_8px_rgba(0,0,0,0.2)]
                active:scale-90 transition-transform
                disabled:opacity-60
              "
              aria-label="Thêm vào giỏ hàng"
            >
              {adding
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ShoppingCart size={14} />
              }
            </button>

            {/* Desktop slide-up button */}
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="
                hidden md:flex
                absolute bottom-0 inset-x-0
                bg-[var(--color-primary)] text-white
                py-2.5 text-sm font-medium items-center justify-center gap-2
                translate-y-full group-hover:translate-y-0
                transition-transform duration-200
                disabled:opacity-70
              "
            >
              {adding
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ShoppingCart size={15} />
              }
              Thêm vào giỏ
            </button>
          </>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="p-2 sm:p-3 flex flex-col gap-0.5 sm:gap-1 flex-1">
        <p className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] truncate">
          {categoryName}
        </p>

        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]
                       line-clamp-2 leading-snug">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-text-secondary)]">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {avgRating?.toFixed(1)}
          </span>
          <span>({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[var(--color-primary)] font-bold text-xs sm:text-sm">
            {Number(minSalePrice)?.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]
                    bg-[var(--color-bg-card)] flex flex-col animate-pulse">
      <div className="aspect-square bg-[var(--color-bg-muted)]" />
      <div className="p-2 sm:p-3 flex flex-col gap-2">
        <div className="h-2.5 w-1/3 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-3.5 w-3/4 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-2.5 w-1/4 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-3 w-1/3 bg-[var(--color-bg-muted)] rounded" />
      </div>
    </div>
  );
}