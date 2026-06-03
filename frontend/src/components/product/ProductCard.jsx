import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

const TAG_STYLE = {
  bestseller: "bg-yellow-400 text-yellow-900",
  organic:    "bg-green-500 text-white",
  new:        "bg-blue-500 text-white",
  "sugar-free": "bg-pink-500 text-white",
};

const TAG_LABEL = {
  bestseller: "Bestseller",
  organic:    "Organic",
  new:        "New",
  "sugar-free": "Sugar-free",
};

// Skeleton khi ảnh chưa load
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

  return (
    <Link
      to={`/products/${slug}`}
      className="group relative bg-[var(--color-bg-card)] rounded-2xl overflow-hidden
                 border border-[var(--color-border-subtle)]
                 hover:shadow-xl hover:-translate-y-0.5
                 transition-all duration-200 flex flex-col"
    >
      {/* ── Image area ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-bg-muted)]">

        {/* Skeleton */}
        {!imgLoaded && !imgError && <ImageSkeleton />}

        {primaryImage && !imgError ? (
          <img
            src={primaryImage}
            alt={name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover group-hover:scale-105
                        transition-transform duration-300
                        ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          /* Fallback gradient khi không có ảnh */
          <div className="w-full h-full bg-gradient-to-br from-green-200 to-emerald-400" />
        )}

        {/* Tags — top left */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                         ${TAG_STYLE[tag] ?? "bg-gray-400 text-white"}`}
            >
              {TAG_LABEL[tag] ?? tag}
            </span>
          ))}
        </div>

        {/* Discount — top right */}
        {maxDiscountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white
                           text-[11px] font-bold px-2 py-0.5 rounded-full">
            -{maxDiscountPercent}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/70 text-white text-sm font-medium
                             px-4 py-1.5 rounded-full">
              Hết hàng
            </span>
          </div>
        )}

        {/* Add to cart — slide up on hover */}
        {inStock && (
          <button
            onClick={(e) => { e.preventDefault(); /* TODO: addToCart */ }}
            className="absolute bottom-0 inset-x-0 bg-[var(--color-primary)] text-white
                       py-2.5 text-sm font-medium flex items-center justify-center gap-2
                       translate-y-full group-hover:translate-y-0
                       transition-transform duration-200"
          >
            <ShoppingCart size={15} />
            Thêm vào giỏ
          </button>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="p-3 flex flex-col gap-1">
        <p className="text-[11px] text-[var(--color-text-muted)]">{categoryName}</p>

        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]
                       line-clamp-2 leading-snug">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
          <span className="text-yellow-400">★</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {avgRating?.toFixed(1)}
          </span>
          <span>({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[var(--color-primary)] font-bold text-sm">
            {Number(minSalePrice)?.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>
    </Link>
  );
}

// Card skeleton dùng khi load trang
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]
                    bg-[var(--color-bg-card)] flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-[var(--color-bg-muted)]" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-1/3 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-4 w-3/4 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-3 w-1/4 bg-[var(--color-bg-muted)] rounded" />
        <div className="h-4 w-1/3 bg-[var(--color-bg-muted)] rounded" />
      </div>
    </div>
  );
}