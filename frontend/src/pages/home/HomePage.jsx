import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Flame,
  Leaf,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getProducts } from "@/api/productApi";
import bannerApi from "@/api/bannerApi";
import useAppStore from '@/store/useAppStore'


// ── Fallback Hero (khi chưa có banner hoặc fetch lỗi) ──────────────────────

const HERO_FALLBACK = {
  imageUrl: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1800&q=85",
  title: "Green Juice Hub",
  linkUrl: "/products",
};

const CATEGORY_ITEMS = [
  {
    title: "Nước ép tươi",
    text: "Ép trong ngày, vị trái cây rõ và nhẹ bụng.",
    image:
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=720&q=80",
    query: "nước ép",
  },
  {
    title: "Smoothie xanh",
    text: "Đặc hơn, no hơn, hợp cho bữa phụ lành mạnh.",
    image:
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=720&q=80",
    query: "smoothie",
  },
  {
    title: "Combo detox",
    text: "Lịch uống tiện theo ngày, dễ duy trì thói quen xanh.",
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=720&q=80",
    query: "detox",
  },
];

const FEATURED_PRODUCTS = [
  {
    name: "Green Reset",
    meta: "Cần tây, táo xanh, chanh",
    price: "49.000đ",
    badge: "Bán chạy",
    accent: "bg-emerald-500",
  },
  {
    name: "Sunny Citrus",
    meta: "Cam, cà rốt, gừng",
    price: "45.000đ",
    badge: "Vitamin C",
    accent: "bg-amber-400",
  },
  {
    name: "Berry Balance",
    meta: "Dâu, chuối, sữa hạt",
    price: "59.000đ",
    badge: "Smoothie",
    accent: "bg-rose-400",
  },
];

const PROMISES = [
  { icon: Leaf, title: "Nguyên liệu sạch", text: "Ưu tiên trái cây theo mùa và nguồn gốc rõ ràng." },
  { icon: ShieldCheck, title: "Không chất bảo quản", text: "Pha chế gọn trong ngày, giữ vị tươi tự nhiên." },
  { icon: Bike, title: "Giao nhanh", text: "Đóng chai chắc tay, giao đến nhà hoặc văn phòng." },
];

const STEPS = [
  { icon: Search, label: "Chọn vị yêu thích" },
  { icon: ShoppingBag, label: "Đặt combo hoặc từng chai" },
  { icon: Sparkles, label: "Nhận đồ uống tươi trong ngày" },
];

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "Liên hệ";
  return `${Number(price).toLocaleString("vi-VN")}đ`;
}

/* ─── Custom hook: scroll reveal ─── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    const elements = document.querySelectorAll(".sr");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Banner Carousel ─── */
function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const count = banners.length;

  const goTo = useCallback((index) => {
    if (animating || index === current) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, current]);

  const prev = useCallback(() => goTo((current - 1 + count) % count), [current, count, goTo]);
  const next = useCallback(() => goTo((current + 1) % count), [current, count, goTo]);

  // Auto-play mỗi 5 giây
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, count]);

  // Reset timer khi user click
  const handleManualNav = (fn) => {
    clearInterval(timerRef.current);
    fn();
  };

  const banner = banners[current];
  const WrapperEl = banner.linkUrl ? Link : "div";
  const wrapperProps = banner.linkUrl ? { to: banner.linkUrl } : {};

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-bg-base)]" style={{ minHeight: "min(calc(100svh - 64px), 860px)" }}>

      {/* Slides */}
      <div className="absolute inset-0">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <img
              src={b.imageUrl}
              alt={b.title}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, rgba(6,24,14,0.75) 0%, rgba(6,24,14,0.45) 50%, rgba(6,24,14,0.10) 100%)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-4 pt-20 pb-16 sm:px-6 lg:px-8" style={{ minHeight: "min(calc(100svh - 64px), 860px)" }}>
        <WrapperEl {...wrapperProps} className="max-w-2xl text-white">
          {/* Badge */}
          <div
            className="mb-5 inline-flex animate-fade-slide-up animate-float items-center gap-2 rounded-[var(--radius-pill)] border border-white/20 bg-white/10 px-4 py-2 text-[var(--text-sm)] font-medium backdrop-blur-md"
            style={{ animationDelay: "60ms" }}
          >
            <BadgeCheck size={16} />
            Ép tươi mỗi ngày
          </div>

          <h1
            key={`title-${current}`}
            className="animate-fade-slide-up font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "140ms" }}
          >
            {banner.title}
          </h1>

          {/* CTA — chỉ hiện nếu có linkUrl */}
          {banner.linkUrl && (
            <div
              className="mt-8 flex animate-fade-slide-up flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "300ms" }}
            >
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-6 text-[var(--text-sm)] font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--color-primary-hover)] hover:scale-[1.03] hover:shadow-[var(--shadow-lg)] active:scale-100">
                Xem ngay
                <ArrowRight size={17} />
              </span>
            </div>
          )}

          {/* Stats */}
          <div
            className="mt-10 grid max-w-xl animate-fade-slide-up grid-cols-3 gap-3"
            style={{ animationDelay: "380ms" }}
          >
            {[
              ["30+", "công thức"],
              ["2h", "giao nội thành"],
              ["4.8", "đánh giá"],
            ].map(([value, label]) => (
              <div key={label} className="group border-l border-white/25 pl-4 cursor-default">
                <p className="text-2xl font-semibold transition-transform duration-200 group-hover:translate-x-1">
                  {value}
                </p>
                <p className="mt-1 text-[var(--text-xs)] uppercase text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </WrapperEl>
      </div>

      {/* Nút prev / next — chỉ hiện khi có nhiều hơn 1 banner */}
      {count > 1 && (
        <>
          <button
            onClick={() => handleManualNav(prev)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Banner trước"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleManualNav(next)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Banner tiếp theo"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => handleManualNav(() => goTo(i))}
                aria-label={`Chuyển đến banner ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Scroll indicator — chỉ hiện khi 1 banner */}
      {count === 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60"
          aria-hidden
        >
          <span className="text-[10px] uppercase tracking-widest text-white/70">Cuộn xuống</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      )}
    </section>
  );
}

/* ─── Hero Fallback (dùng khi API chưa có banner) ─── */
function HeroFallback() {
  return (
    <section
      className="relative isolate flex overflow-hidden bg-[var(--color-bg-base)] px-4 pt-20 pb-16 sm:px-6 lg:px-8"
      style={{
        minHeight: "min(calc(100svh - 64px), 860px)",
        backgroundImage: `linear-gradient(90deg, rgba(6, 24, 14, 0.82) 0%, rgba(6, 24, 14, 0.58) 48%, rgba(6, 24, 14, 0.1) 100%), url(${HERO_FALLBACK.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 60% 60% at 15% 80%, rgba(26,155,94,0.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="max-w-2xl text-white">
          <div className="mb-5 inline-flex animate-fade-slide-up animate-float items-center gap-2 rounded-[var(--radius-pill)] border border-white/20 bg-white/10 px-4 py-2 text-[var(--text-sm)] font-medium backdrop-blur-md" style={{ animationDelay: "60ms" }}>
            <BadgeCheck size={16} />
            Ép tươi mỗi ngày
          </div>
          <h1 className="animate-fade-slide-up font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl" style={{ animationDelay: "140ms" }}>
            Green Juice Hub
          </h1>
          <p className="mt-5 max-w-xl animate-fade-slide-up text-[var(--text-lg)] leading-8 text-white/78" style={{ animationDelay: "220ms" }}>
            Nước ép, smoothie và combo detox được pha chế từ nguyên liệu tươi, đặt nhanh cho nhịp sống bận rộn mà vẫn muốn ăn uống tử tế.
          </p>
          <div className="mt-8 flex animate-fade-slide-up flex-col gap-3 sm:flex-row" style={{ animationDelay: "300ms" }}>
            <Link to="/products" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-6 text-[var(--text-sm)] font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:bg-[var(--color-primary-hover)] hover:scale-[1.03] hover:shadow-[var(--shadow-lg)] active:scale-100">
              Mua ngay <ArrowRight size={17} />
            </Link>
            <Link to="/products?keyword=detox" className="inline-flex h-12 items-center justify-center rounded-[var(--radius-pill)] border border-white/25 bg-white/10 px-6 text-[var(--text-sm)] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/18 hover:scale-[1.03] active:scale-100">
              Xem combo detox
            </Link>
          </div>
          <div className="mt-10 grid max-w-xl animate-fade-slide-up grid-cols-3 gap-3" style={{ animationDelay: "380ms" }}>
            {[["30+", "công thức"], ["2h", "giao nội thành"], ["4.8", "đánh giá"]].map(([value, label]) => (
              <div key={label} className="group border-l border-white/25 pl-4 cursor-default">
                <p className="text-2xl font-semibold transition-transform duration-200 group-hover:translate-x-1">{value}</p>
                <p className="mt-1 text-[var(--text-xs)] uppercase text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60" aria-hidden>
        <span className="text-[10px] uppercase tracking-widest text-white/70">Cuộn xuống</span>
        <div className="h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [banners, setBanners] = useState([])           // [] = chưa load xong
  const [bannerReady, setBannerReady] = useState(false) // true khi fetch xong (dù có hay không)
  const [featuredProducts, setFeaturedProducts] = useState(FEATURED_PRODUCTS);
  const { setPageReady } = useAppStore()

  useScrollReveal();

  // Fetch banners
  useEffect(() => {
    bannerApi.getActiveBanners()
      .then(res => {
        const data = res.data
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data)
        }
      })
      .catch(() => {})
      .finally(() => setBannerReady(true))
  }, [])

  // Fetch featured products
  useEffect(() => {
    let ignore = false;
    getProducts({ page: 0, size: 3, sortBy: "bestseller" })
      .then((res) => {
        const products = res.data?.content;
        if (!ignore && Array.isArray(products) && products.length > 0) {
          setFeaturedProducts(products);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setPageReady(true)
      });
    return () => { ignore = true; };
  }, []);

  return (
    <div className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] transition-theme">

      {/* ── HERO / BANNER CAROUSEL ── */}
      {!bannerReady ? (
        // Skeleton trong khi chờ fetch — giữ chiều cao để tránh layout shift
        <div
          className="relative bg-gray-900 animate-pulse"
          style={{ minHeight: "min(calc(100svh - 64px), 860px)" }}
        />
      ) : banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <HeroFallback />
      )}

      {/* ── STEPS BAR ── */}
      <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-4 py-5 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className={`sr sr-up sr-spring sr-delay-${i + 1} flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)] px-4 py-3 transition-shadow hover:shadow-[var(--shadow-sm)]`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <Icon size={18} />
              </span>
              <span className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="sr sr-left flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[var(--text-xs)] font-semibold uppercase text-[var(--color-primary)]">
                Danh mục
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)] section-title-line">
                Hôm nay uống gì?
              </h2>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-[var(--text-sm)] font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors group">
              Xem tất cả sản phẩm
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CATEGORY_ITEMS.map((item, i) => (
              <Link
                key={item.title}
                to={`/products?keyword=${encodeURIComponent(item.query)}`}
                className={`sr sr-up sr-spring sr-delay-${i + 1} group overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary-muted)]`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-muted)]">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">{item.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[var(--text-xs)] font-semibold text-[var(--color-primary)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    Xem thêm <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="bg-[var(--color-bg-base)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div className="sr sr-left">
            <p className="text-[var(--text-xs)] font-semibold uppercase text-[var(--color-primary)]">
              Gợi ý nổi bật
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)] section-title-line">
              Những vị dễ bắt đầu
            </h2>
            <p className="mt-4 max-w-md text-[var(--text-base)] leading-7 text-[var(--color-text-secondary)]">
              Các lựa chọn cân bằng giữa vị tươi, độ ngọt tự nhiên và cảm giác nhẹ sau khi uống.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              <Star size={17} className="fill-yellow-400 text-yellow-400" />
              Được khách hàng chọn nhiều trong tuần
            </div>
            <Link to="/products" className="mt-8 inline-flex h-11 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 text-[var(--text-sm)] font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-hover)] hover:scale-[1.03] hover:shadow-[var(--shadow-md)] active:scale-100">
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {featuredProducts.map((product, index) => {
              const accent = product.accent ?? ["bg-emerald-500", "bg-amber-400", "bg-rose-400"][index % 3];
              const badge = product.badge ?? product.categoryName ?? "Gợi ý";
              const price = product.price ?? formatPrice(product.minSalePrice);
              const meta = product.meta ?? product.tags?.slice(0, 3).join(", ") ?? product.categoryName ?? "Sản phẩm tươi trong ngày";
              const href = product.slug
                ? `/products/${product.slug}`
                : `/products?keyword=${encodeURIComponent(product.name)}`;

              return (
                <Link
                  key={product.slug ?? product.name}
                  to={href}
                  className={`sr sr-up sr-spring sr-delay-${index + 1} group overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary-muted)]`}
                >
                  {product.primaryImage && (
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-muted)]">
                      <img src={product.primaryImage} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className={`mb-5 h-2 w-14 rounded-[var(--radius-pill)] ${accent} transition-all duration-300 group-hover:w-20`} />
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-primary-subtle)] px-3 py-1 text-[var(--text-xs)] font-semibold text-[var(--color-primary)]">
                      <Flame size={13} />
                      {badge}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">{product.name}</h3>
                    <p className="mt-2 min-h-12 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">{meta}</p>
                    <p className="mt-5 text-lg font-bold text-[var(--color-primary)]">{price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROMISES ── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="sr sr-up mx-auto mb-10 max-w-7xl text-center">
          <p className="text-[var(--text-xs)] font-semibold uppercase text-[var(--color-primary)]">
            Cam kết của chúng mình
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)]">
            Tươi — Sạch — Nhanh
          </h2>
        </div>
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              className={`sr sr-scale sr-spring sr-delay-${i + 1} group rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 ease-out hover:shadow-[var(--shadow-md)] hover:-translate-y-1 hover:border-[var(--color-primary-muted)]`}
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--color-primary)] group-hover:text-white">
                <Icon size={21} />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">{title}</h3>
              <p className="mt-3 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className="sr sr-up mx-auto max-w-7xl overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-8 py-12 text-center shadow-[var(--shadow-lg)]"
          style={{ background: "linear-gradient(135deg, var(--color-brand-700) 0%, var(--color-brand-500) 60%, var(--color-brand-400) 100%)" }}
        >
          <p className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Bắt đầu ngày xanh hôm nay?
          </p>
          <p className="mt-3 text-white/75 text-[var(--text-base)]">
            Đặt đơn trước 10h sáng — nhận trong ngày.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-[var(--radius-pill)] bg-white px-7 text-[var(--text-sm)] font-semibold text-[var(--color-brand-700)] shadow-[var(--shadow-md)] transition-all hover:scale-105 hover:shadow-[var(--shadow-lg)] active:scale-100"
          >
            Mua ngay <ArrowRight size={17} />
          </Link>
        </div>
      </section>

    </div>
  );
}