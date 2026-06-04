import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard, { ProductCardSkeleton } from "@/components/product/ProductCard";
import { sharedObserver } from "@/utils/sharedObserver";


const TAG_CHIPS = [
  { key: "bestseller", label: "Bestseller" },
  { key: "organic",    label: "Organic"    },
  { key: "new",        label: "New"        },
  { key: "sugar-free", label: "Sugar-free" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất"        },
  { value: "bestseller", label: "Bán chạy"        },
  { value: "price_asc",  label: "Giá tăng dần"    },
  { value: "price_desc", label: "Giá giảm dần"    },
  { value: "rating",     label: "Đánh giá cao"    },
  { value: "rating_asc", label: "Giảm nhiều nhất" },
];

/* ── AnimatedCard ── */
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

/* ── ProductsPage ── */
export default function ProductsPage() {
  const {
    filter, products, totalElements, hasMore, loading, loadingMore,
    categories, flavors, sizes,
    updateFilter, loadMore, resetFilter,
  } = useProducts();

  // khai báo sidebarOpen trước khi dùng
  const sidebarOpen = filter._sidebarOpen !== false;
  const setSidebarOpen = (val) => updateFilter({ _sidebarOpen: val });

  // số cột phụ thuộc sidebar — khai báo sau sidebarOpen
  const cols = sidebarOpen ? 3 : 4;

  // ── Infinite scroll sentinel ──
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleTag = (tag) => {
    const cur = filter.tags ?? [];
    updateFilter({
      tags: cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag],
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto px-0 py-0">

      {/* ── Toolbar — sticky ── */}
      <div className="sticky top-[65px] z-10 -mx-6 px-6 py-2 mb-5
                      bg-[var(--color-bg-surface)]
                      border-b border-[var(--color-border-subtle)]
                      flex items-center gap-2 flex-wrap">

        {/* Bộ lọc */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                      border transition-colors shrink-0
                      ${sidebarOpen
                        ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                        : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
                      }`}
        >
          <SlidersHorizontal size={14} />
          Bộ lọc
        </button>

        <div className="flex-1" />

        {/* Tag chips */}
        {TAG_CHIPS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleTag(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0
              ${(filter.tags ?? []).includes(key)
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
              }`}
          >
            {label}
          </button>
        ))}

        {/* Price range */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number" placeholder="Từ đ"
            value={filter.minPrice}
            onChange={e => updateFilter({ minPrice: e.target.value })}
            className="w-20 px-2 py-1.5 text-sm rounded-lg
                       border border-[var(--color-border-subtle)] bg-transparent
                       text-[var(--color-text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <span className="text-[var(--color-text-muted)] text-xs">—</span>
          <input
            type="number" placeholder="Đến đ"
            value={filter.maxPrice}
            onChange={e => updateFilter({ maxPrice: e.target.value })}
            className="w-20 px-2 py-1.5 text-sm rounded-lg
                       border border-[var(--color-border-subtle)] bg-transparent
                       text-[var(--color-text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* Sort */}
        <select
          value={filter.sortBy}
          onChange={e => updateFilter({ sortBy: e.target.value })}
          className="px-3 py-1.5 text-sm rounded-lg shrink-0
                     border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]
                     text-[var(--color-text-primary)] focus:outline-none
                     focus:ring-1 focus:ring-[var(--color-primary)]"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Reset */}
        <button
          onClick={resetFilter}
          className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] transition-colors shrink-0"
        >
          <X size={13} /> Xoá lọc
        </button>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div className="flex gap-5 items-start">

        {/* Sidebar */}
        <div
          className={`transition-all duration-300 shrink-0 self-stretch
            ${sidebarOpen
              ? "w-[260px] opacity-100"
              : "w-0 opacity-0 overflow-hidden pointer-events-none"
            }`}
        >
          <div className="sticky top-[calc(65px+52px+8px)] overflow-y-auto max-h-[calc(100vh-120px)]
                          scrollbar-thin scrollbar-thumb-[var(--color-border-subtle)]
                          scrollbar-track-transparent">
            <FilterSidebar
              filter={filter}
              categories={categories}
              flavors={flavors}
              sizes={sizes}
              onChange={updateFilter}
              onReset={resetFilter}
            />
          </div>
        </div>

        {/* Grid column */}
        <div className="flex-1 min-w-0">

          {/* Result count */}
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Tìm thấy <strong className="text-[var(--color-text-primary)]">{totalElements}</strong> sản phẩm
          </p>

          {/* ── Loading skeleton ── */}
          {loading ? (
            <div className={`grid gap-4 grid-cols-${cols}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>

          /* ── Empty ── */
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24
                            text-[var(--color-text-muted)]">
              <span className="text-5xl mb-4">🥤</span>
              <p className="text-base font-medium mb-1">Không tìm thấy sản phẩm nào</p>
              <p className="text-sm mb-4">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              <button
                onClick={resetFilter}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Xoá bộ lọc
              </button>
            </div>

          /* ── Products grid ── */
          ) : (
            <>
              <div className={`grid gap-4 ${sidebarOpen ? "grid-cols-3" : "grid-cols-4"}`}>
                {products.map((p, i) => (
                  <AnimatedCard key={p.id} colIndex={i % cols}>
                    <ProductCard product={p} />
                  </AnimatedCard>
                ))}
                {loadingMore && Array.from({ length: 3 }).map((_, i) => (
                  <ProductCardSkeleton key={`more-${i}`} />
                ))}
              </div>

              {hasMore && <div ref={sentinelRef} className="h-10 mt-4" />}

              {!hasMore && products.length > 0 && (
                <p className="text-center text-sm text-[var(--color-text-muted)] mt-8 py-4">
                  Đã hiển thị tất cả {totalElements} sản phẩm
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}