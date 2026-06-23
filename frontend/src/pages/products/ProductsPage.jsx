import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard, { ProductCardSkeleton } from "@/components/product/ProductCard";
import { sharedObserver } from "@/utils/sharedObserver";

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất" },
  { value: "bestseller", label: "Bán chạy" },
  { value: "price_asc",  label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "rating",     label: "Đánh giá cao" },
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
        transitionDelay: visible ? `${colIndex * 60}ms` : "0ms",
        transitionProperty: "opacity, transform",
        transitionDuration: "500ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.90)",
      }}
    >
      {children}
    </div>
  );
}

/* ── ScrollToTopButton ── */
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-28 right-4 z-30
                  w-9 h-9 rounded-full
                  bg-[var(--color-primary)] text-white
                  shadow-[0_4px_16px_rgba(0,0,0,0.18)]
                  flex items-center justify-center
                  transition-all duration-300
                  hover:bg-[var(--color-primary-hover)] hover:scale-110 active:scale-95
                  ${visible
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
      aria-label="Cuộn lên đầu trang"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

/* ── Filter Bottom Sheet (mobile) ── */
function FilterModal({ open, onClose, filter, categories, flavors, sizes, onChange, onReset }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 520);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          transition: "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
        className="fixed inset-0 z-40 bg-black/50"
      />

      {/* Bottom sheet */}
      <div
        style={{
          transition: visible
            ? "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "transform 460ms cubic-bezier(0.4, 0, 1, 1)",
          transform: visible ? "translateY(0%)" : "translateY(100%)",
          willChange: "transform",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        className="fixed bottom-0 left-0 right-0 z-50
                   max-h-[82vh] rounded-t-2xl overflow-hidden
                   bg-[var(--color-bg-surface)]
                   shadow-[0_-8px_40px_rgba(0,0,0,0.2)]
                   flex flex-col"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-default)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0
                        border-b border-[var(--color-border-subtle)]">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Bộ lọc
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-muted)] transition-colors"
          >
            <X size={16} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pt-2 pb-4">
          <FilterSidebar
            filter={filter}
            categories={categories}
            flavors={flavors}
            sizes={sizes}
            onChange={onChange}
            onReset={onReset}
          />
        </div>

        {/* Footer CTA */}
        <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border-subtle)]
                        bg-[var(--color-bg-surface)]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl
                       bg-[var(--color-primary)] text-white text-sm font-semibold
                       hover:bg-[var(--color-primary-hover)] active:scale-[0.98]
                       transition-all"
          >
            Xem kết quả
          </button>
        </div>
      </div>
    </>
  );
}

/* ── SortDropdown ── */
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm rounded-lg
            border transition-colors min-w-[110px] sm:min-w-[130px] justify-between
            ${open
              ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
              : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-muted)]"
            }`}
      >
        <span className="truncate">
          {SORT_OPTIONS.find(o => o.value === value)?.label ?? "Sắp xếp"}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50
                        w-44 py-1 rounded-xl
                        bg-[var(--color-bg-surface)]
                        border border-[var(--color-border-subtle)]
                        shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden
                        animate-in fade-in slide-in-from-top-2 duration-150">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors
                          flex items-center justify-between gap-2
                          ${value === o.value
                            ? "text-[var(--color-primary)] bg-[var(--color-primary-subtle)] font-medium"
                            : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                          }`}
            >
              {o.label}
              {value === o.value && (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── BottomFilterBar (mobile only) ── */
function BottomFilterBar({ onOpenFilter, activeFilterCount }) {
  return (
    <div
      className="fixed left-0 right-0 z-30 md:hidden flex justify-center pointer-events-none"
      style={{ bottom: "calc(56px + 12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <button
        onClick={onOpenFilter}
        className="pointer-events-auto
                   flex items-center gap-2 px-5 py-2.5
                   rounded-full
                   bg-[var(--color-primary)] text-white
                   shadow-[0_4px_20px_rgba(0,0,0,0.22)]
                   text-sm font-medium
                   active:scale-95 transition-transform"
      >
        <SlidersHorizontal size={15} />
        Bộ lọc
        {activeFilterCount > 0 && (
          <span className="w-5 h-5 rounded-full
                           bg-white text-[var(--color-primary)]
                           text-[10px] font-bold
                           flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

/* ── Helpers ── */
function countActiveFilters(filter) {
  let n = 0;
  if (filter.categoryId != null)          n++;
  if ((filter.flavorIds ?? []).length)    n++;
  if ((filter.sizeIds ?? []).length)      n++;
  if (filter.minRating != null)           n++;
  if (filter.inStock)                     n++;
  if (filter.onSale)                      n++;
  if (filter.minPrice)                    n++;
  if (filter.maxPrice)                    n++;
  if ((filter.tags ?? []).length)         n++;
  return n;
}

/* ── ProductsPage ── */
export default function ProductsPage() {
  const {
    filter, products, totalElements, hasMore, loading, loadingMore,
    categories, flavors, sizes, tags,
    updateFilter, loadMore, resetFilter,
  } = useProducts();

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  /* Desktop sidebar */
  const sidebarOpen = filter._sidebarOpen === true;
  const setSidebarOpen = (val) => updateFilter({ _sidebarOpen: val });
  const cols = sidebarOpen ? 3 : 4;

  /* Infinite scroll */
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
    updateFilter({ tags: cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag] });
  };

  const activeFilterCount = countActiveFilters(filter);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-0 py-0 pb-28 md:pb-4">

      {/* ── Toolbar sticky ── */}
      <div className="sticky top-[65px] z-10 -mx-4 sm:-mx-6 px-3 sm:px-6 mb-4
                      bg-[var(--color-bg-surface)]
                      border-b border-[var(--color-border-subtle)]
                      flex flex-col md:flex-row md:items-center md:flex-wrap md:gap-2">

        {/* ── Hàng 1: Title (mobile) / Filter toggle (desktop) + Tags ── */}
        <div className="flex items-center gap-2 py-2 w-full md:w-auto md:flex-1 min-w-0">

          {/* Desktop: sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                        border transition-colors shrink-0
                        ${sidebarOpen
                          ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)]"
                          : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
                        }`}
          >
            <SlidersHorizontal size={14} />
            Bộ lọc
          </button>

          {/* Mobile: page title */}
          <span className="md:hidden text-sm font-semibold text-[var(--color-text-primary)] shrink-0">
            Sản phẩm
          </span>

          {/* Tag chips — scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {tags.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleTag(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0
                            ${(filter.tags ?? []).includes(key)
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
                            }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: spacer */}
          <div className="hidden md:block flex-1" />

          {/* Desktop: price range */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <input
              type="number" placeholder="Từ đ"
              value={filter.minPrice ?? ""}
              onChange={e => updateFilter({ minPrice: e.target.value })}
              className="w-20 px-2 py-1.5 text-sm rounded-lg
                         border border-[var(--color-border-subtle)] bg-transparent
                         text-[var(--color-text-primary)]
                         focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <span className="text-[var(--color-text-muted)] text-xs">—</span>
            <input
              type="number" placeholder="Đến đ"
              value={filter.maxPrice ?? ""}
              onChange={e => updateFilter({ maxPrice: e.target.value })}
              className="w-20 px-2 py-1.5 text-sm rounded-lg
                         border border-[var(--color-border-subtle)] bg-transparent
                         text-[var(--color-text-primary)]
                         focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Desktop: Sort */}
          <div className="hidden md:block shrink-0">
            <SortDropdown value={filter.sortBy} onChange={(val) => updateFilter({ sortBy: val })} />
          </div>

          {/* Desktop: Reset */}
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilter}
              className="hidden md:flex items-center gap-1 text-xs text-[var(--color-text-muted)]
                         hover:text-[var(--color-text-primary)] transition-colors shrink-0"
            >
              <X size={13} /> Xoá lọc
            </button>
          )}
        </div>

        {/* ── Hàng 2 (mobile only): Số sp / Reset bên trái — Sort bên phải ── */}
        <div className="flex items-center justify-between pb-2 md:hidden">
          {activeFilterCount > 0 ? (
            <button
              onClick={resetFilter}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]
                         hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={13} />
              Xoá lọc
              <span className="ml-0.5 w-4 h-4 rounded-full
                               bg-[var(--color-primary)] text-white
                               text-[9px] font-bold
                               flex items-center justify-center">
                {activeFilterCount}
              </span>
            </button>
          ) : (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {totalElements} sản phẩm
            </span>
          )}

          {/* Sort dropdown — luôn bên phải trên mobile */}
          <SortDropdown value={filter.sortBy} onChange={(val) => updateFilter({ sortBy: val })} />
        </div>

      </div>

      {/* ── Body ── */}
      <div className="flex gap-5 items-start">

        {/* Desktop sidebar */}
        <div
          className={`hidden md:block transition-all duration-300 shrink-0 self-stretch
                      ${sidebarOpen
                        ? "w-[240px] lg:w-[260px] opacity-100"
                        : "w-0 opacity-0 overflow-hidden pointer-events-none"
                      }`}
        >
          <div className="sticky top-[calc(65px+52px+8px)] overflow-y-auto max-h-[calc(100vh-120px)]
                          scrollbar-thin scrollbar-thumb-[var(--color-border-subtle)] scrollbar-track-transparent">
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

        {/* Product grid */}
        <div className="flex-1 min-w-0 w-full">

          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-3">
            Tìm thấy{" "}
            <strong className="text-[var(--color-text-primary)]">{totalElements}</strong>{" "}
            sản phẩm
          </p>

          {loading ? (
            <div className={`grid gap-2.5 sm:gap-4 grid-cols-2
                            ${sidebarOpen ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>

          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-text-muted)]">
              <span className="text-5xl mb-4">🥤</span>
              <p className="text-base font-medium mb-1">Không tìm thấy sản phẩm nào</p>
              <p className="text-sm mb-4">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
              <button onClick={resetFilter} className="text-sm text-[var(--color-primary)] hover:underline">
                Xoá bộ lọc
              </button>
            </div>

          ) : (
            <>
              <div className={`grid gap-2.5 sm:gap-4 grid-cols-2
                              ${sidebarOpen ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
                {products.map((p, i) => (
                  <AnimatedCard key={p.id} colIndex={i % cols}>
                    <ProductCard product={p} />
                  </AnimatedCard>
                ))}
                {loadingMore && Array.from({ length: 4 }).map((_, i) => (
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

      {/* ── Mobile: nút bộ lọc nổi ── */}
      <BottomFilterBar
        onOpenFilter={() => setFilterModalOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* ── Mobile: filter bottom sheet ── */}
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filter={filter}
        categories={categories}
        flavors={flavors}
        sizes={sizes}
        onChange={updateFilter}
        onReset={resetFilter}
      />

      <ScrollToTopButton />
    </div>
  );
}