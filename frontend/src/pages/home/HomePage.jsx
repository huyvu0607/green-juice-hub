import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getProducts } from "@/api/productApi";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1800&q=85";

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

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState(FEATURED_PRODUCTS);

  useEffect(() => {
    let ignore = false;

    getProducts({ page: 0, size: 3, sortBy: "bestseller" })
      .then((res) => {
        const products = res.data?.content;
        if (!ignore && Array.isArray(products) && products.length > 0) {
          setFeaturedProducts(products);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] transition-theme">
      <section
        className="relative isolate flex min-h-[calc(100svh-10rem)] overflow-hidden bg-[var(--color-bg-base)] px-4 pt-32 pb-14 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(6, 24, 14, 0.82) 0%, rgba(6, 24, 14, 0.58) 48%, rgba(6, 24, 14, 0.1) 100%), url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
          <div className="max-w-2xl text-white">
            <div
              className="mb-5 inline-flex animate-fade-slide-up items-center gap-2 rounded-[var(--radius-pill)] border border-white/20 bg-white/10 px-4 py-2 text-[var(--text-sm)] font-medium backdrop-blur-md"
              style={{ animationDelay: "60ms" }}
            >
              <BadgeCheck size={16} />
              Ép tươi mỗi ngày
            </div>

            <h1
              className="animate-fade-slide-up font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "140ms" }}
            >
              Green Juice Hub
            </h1>
            <p
              className="mt-5 max-w-xl animate-fade-slide-up text-[var(--text-lg)] leading-8 text-white/78"
              style={{ animationDelay: "220ms" }}
            >
              Nước ép, smoothie và combo detox được pha chế từ nguyên liệu tươi,
              đặt nhanh cho nhịp sống bận rộn mà vẫn muốn ăn uống tử tế.
            </p>

            <div
              className="mt-8 flex animate-fade-slide-up flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                to="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-6 text-[var(--text-sm)] font-semibold text-white shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                Mua ngay
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/products?keyword=detox"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-pill)] border border-white/25 bg-white/10 px-6 text-[var(--text-sm)] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/18"
              >
                Xem combo detox
              </Link>
            </div>

            <div
              className="mt-10 grid max-w-xl animate-fade-slide-up grid-cols-3 gap-3"
              style={{ animationDelay: "380ms" }}
            >
              {[
                ["30+", "công thức"],
                ["2h", "giao nội thành"],
                ["4.8", "đánh giá"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-white/25 pl-4">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-[var(--text-xs)] uppercase text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-4 py-5 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-muted)] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <Icon size={18} />
              </span>
              <span className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[var(--text-xs)] font-semibold uppercase text-[var(--color-primary)]">
                Danh mục
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)]">
                Hôm nay uống gì?
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-[var(--text-sm)] font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              Xem tất cả sản phẩm
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {CATEGORY_ITEMS.map((item) => (
              <Link
                key={item.title}
                to={`/products?keyword=${encodeURIComponent(item.query)}`}
                className="group overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-muted)]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">
                    {item.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-bg-base)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <div>
            <p className="text-[var(--text-xs)] font-semibold uppercase text-[var(--color-primary)]">
              Gợi ý nổi bật
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)]">
              Những vị dễ bắt đầu
            </h2>
            <p className="mt-4 max-w-md text-[var(--text-base)] leading-7 text-[var(--color-text-secondary)]">
              Các lựa chọn cân bằng giữa vị tươi, độ ngọt tự nhiên và cảm giác nhẹ sau khi uống.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              <Star size={17} className="fill-yellow-400 text-yellow-400" />
              Được khách hàng chọn nhiều trong tuần
            </div>
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
                  className="group overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  {product.primaryImage && (
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--color-bg-muted)]">
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className={`mb-5 h-2 w-14 rounded-[var(--radius-pill)] ${accent}`} />
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-primary-subtle)] px-3 py-1 text-[var(--text-xs)] font-semibold text-[var(--color-primary)]">
                      <Flame size={13} />
                      {badge}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                      {product.name}
                    </h3>
                    <p className="mt-2 min-h-12 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">
                      {meta}
                    </p>
                    <p className="mt-5 text-lg font-bold text-[var(--color-primary)]">{price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <Icon size={21} />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
                {title}
              </h3>
              <p className="mt-3 text-[var(--text-sm)] leading-6 text-[var(--color-text-secondary)]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
