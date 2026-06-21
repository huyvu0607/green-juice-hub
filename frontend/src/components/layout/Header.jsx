import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import ThemeToggle from "@/components/common/ThemeToggle";
import useAuthStore from "@/store/authStore";
import useCartStore from "@/store/useCartStore";
import ProfileModal from '@/components/user/ProfileModal'
import { useCartAnimation } from '@/hooks/useCartAnimation'
import useProfileModalStore from '@/store/useProfileModalStore'
import { LOGO_URL } from "@/constants/assets";


const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Chính sách", to: "/policies" },
  { label: "Liên hệ", to: "/contact" },
];

const OPEN_DURATION = 440;
const CLOSE_DURATION = 340;
const NAV_HEIGHT = 52;

function useLiquidPill(isOpen) {
  const location = useLocation();
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const animRef = useRef(null);
  const [pill, setPill] = useState({ x: 0, width: 0, opacity: 0 });
  const [blob, setBlob] = useState({ x: 0, width: 0 });

  const getActiveRect = useCallback(() => {
    const active = NAV_LINKS.find((l) =>
      l.to === "/" ? location.pathname === "/" : location.pathname.startsWith(l.to)
    );
    if (!active) return null;
    const el = itemRefs.current[active.to];
    const nav = navRef.current;
    if (!el || !nav) return null;
    const er = el.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    return { x: er.left - nr.left, width: er.width };
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const rect = getActiveRect();
    if (rect) {
      setPill({ x: rect.x, width: rect.width, opacity: 1 });
      setBlob({ x: rect.x, width: rect.width });
    }
  }, [isOpen, getActiveRect]);

  useEffect(() => {
    if (!isOpen) return;
    const target = getActiveRect();
    if (!target) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const startPill = { ...pill };
    const startBlob = { ...blob };
    const start = performance.now();
    const DURATION = 420;

    const easeOutBack = (t) => {
      const c1 = 1.4, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const animate = (now) => {
      const tRaw = Math.min((now - start) / DURATION, 1);
      const tPill = easeOutBack(tRaw);
      const stretch = tRaw < 0.5 ? tRaw * 2 : 1;
      const shrink = tRaw < 0.5 ? 0 : (tRaw - 0.5) * 2;

      const blobX = startBlob.x + (target.x - startBlob.x) * stretch;
      const blobRight = (startBlob.x + startBlob.width)
        + (target.x + target.width - startBlob.x - startBlob.width) * shrink;

      setBlob({ x: blobX, width: blobRight - blobX });
      setPill({
        x: startPill.x + (target.x - startPill.x) * tPill,
        width: startPill.width + (target.width - startPill.width) * tPill,
        opacity: 1,
      });

      if (tRaw < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [location.pathname, isOpen, getActiveRect]);

  return { navRef, itemRefs, pill, blob };
}

function Avatar({ name, avatarUrl, size = 32 }) {
  const initials = name
    ? name.trim().split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
    : "?";

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: "2px solid var(--color-primary)"
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--color-primary)", color: "#fff", fontSize: size * 0.38,
      fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, userSelect: "none"
    }}>
      {initials}
    </div>
  );
}

function UserDropdown({ user, onLogout, onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const isAdminOrStaff = ["ADMIN", "STAFF"].includes(user?.role?.toUpperCase());

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = user?.name || user?.phone || user?.email || "Tài khoản";

  const menuItems = [
    {
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
      label: "Hồ sơ",
      onClick: () => { onOpenProfile(); setOpen(false) },
    },
    {
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" ry="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>),
      label: "Lịch sử giao dịch",
      onClick: () => { navigate("/orders"); setOpen(false); },
    },
    {
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>),
      label: "Cài đặt",
      onClick: () => { navigate("/profile?tab=settings"); setOpen(false); },
    },
    ...(isAdminOrStaff ? [
      { divider: true },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        label: "Trang quản lý",
        onClick: () => { navigate("/admin"); setOpen(false); },
        admin: true,
      }
    ] : []),
    { divider: true },
    {
      icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
      label: "Đăng xuất",
      onClick: () => { onLogout(); setOpen(false); },
      danger: true,
    },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8, height: 36,
          padding: "0 10px 0 6px", borderRadius: 9999,
          border: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-muted)", cursor: "pointer", transition: "all 0.15s ease"
        }}
        className="hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
      >
        <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size={26} />
        {/* Ẩn tên & chevron trên mobile */}
        <span className="hidden sm:block" style={{
          fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)",
          maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {displayName}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="hidden sm:block"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 180,
          borderRadius: 12, border: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-elevated)", boxShadow: "var(--shadow-lg)",
          overflow: "hidden", zIndex: 50
        }}>
          <div style={{
            padding: "12px 14px", borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size={36} />
            <div style={{ overflow: "hidden" }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>{displayName}</div>
              <div style={{
                fontSize: 11, color: "var(--color-text-muted)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>
                {user?.phone || user?.email || ""}
              </div>
            </div>
          </div>
          <div style={{ padding: "6px 0" }}>
            {menuItems.map((item, idx) =>
              item.divider ? (
                <div key={`divider-${idx}`} style={{
                  height: 1, background: "var(--color-border-subtle)", margin: "4px 0"
                }} />
              ) : (
                <button key={item.label} onClick={item.onClick}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 450,
                    color: item.danger ? "var(--color-brand-600)" : "var(--color-text-primary)",
                    transition: "background 0.12s ease", textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = (item.danger || item.admin)
                      ? "var(--color-primary-subtle)"
                      : "var(--color-bg-muted)";
                  }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <span style={{
                    color: item.danger ? "var(--color-primary)" : item.admin ? "var(--color-primary)" : "var(--color-text-muted)",
                    display: "flex"
                  }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Search box — dùng chung cho desktop và mobile overlay ──────
function SearchBox({ onClose, initialQuery = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // FIX: Đọc keyword từ URL để đồng bộ khi mở overlay
  const [query, setQuery] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("keyword") ?? initialQuery;
  });
  const [isFocused, setIsFocused] = useState(false);

  // Sync query với URL khi search param thay đổi từ bên ngoài
  useEffect(() => {
    if (!location.pathname.startsWith("/products")) {
      setQuery("");
    } else {
      const p = new URLSearchParams(location.search);
      const kw = p.get("keyword") ?? "";
      setQuery(kw);
    }
  }, [location.pathname, location.search]);

  const doSearch = useCallback((value) => {
    const trimmed = value.trim();
    if (trimmed) {
      const params = location.pathname.startsWith("/products")
        ? new URLSearchParams(location.search)
        : new URLSearchParams();
      params.set("keyword", trimmed);
      params.delete("page");
      navigate(`/products?${params.toString()}`);
    } else {
      if (location.pathname.startsWith("/products")) {
        const params = new URLSearchParams(location.search);
        params.delete("keyword");
        params.delete("page");
        const qs = params.toString();
        navigate(`/products${qs ? `?${qs}` : ""}`);
      }
    }
    onClose?.();
  }, [navigate, location, onClose]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current);
      doSearch(query);
    }
    if (e.key === "Escape") {
      setQuery("");
      clearTimeout(debounceRef.current);
      doSearch("");
      e.target.blur();
      onClose?.();
    }
  };

  const handleClear = () => {
    setQuery("");
    clearTimeout(debounceRef.current);
    doSearch("");
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Auto-focus khi dùng trong mobile overlay
  useEffect(() => {
    if (onClose) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [onClose]);

  return (
    <div className="flex justify-center w-full">
      <div className={`relative transition-all duration-300 ease-in-out w-full ${isFocused ? "max-w-xl" : "max-w-sm"}`}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Tìm nước ép, smoothie, granola..."
          className={`w-full h-10 pl-9 pr-8 rounded-[var(--radius-pill)] text-[var(--text-sm)]
            bg-[var(--color-bg-muted)] border text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all duration-300
            ${isFocused
              ? "border-[var(--color-primary)] ring-2 ring-[var(--color-brand-200)] bg-[var(--color-bg-base)]"
              : "border-[var(--color-border-subtle)]"
            }`}
        />

        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                       transition-colors"
            aria-label="Xoá tìm kiếm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const [phase, setPhase] = useState("open");
  const [navTop, setNavTop] = useState(64);
  const headerRef = useRef(null);
  const timerRef = useRef(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { isOpen: profileOpen, openProfileModal, closeProfileModal } = useProfileModalStore();
  const cartBtnRef = useRef(null);
  useCartAnimation(cartBtnRef);

  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { totalQuantity, toggleCart } = useCartStore();

  // FIX: Lấy keyword hiện tại từ URL để truyền vào overlay
  const currentKeyword = (() => {
    const p = new URLSearchParams(location.search);
    return p.get("keyword") ?? "";
  })();

  // Search bar mobile hiện khi: đang gõ (mobileSearchOpen) HOẶC đã có keyword trong URL
  const mobileSearchActive = mobileSearchOpen || currentKeyword !== "";

  // Đóng search input (không xoá keyword) — dùng khi blur ra ngoài
  const closeMobileSearch = () => setMobileSearchOpen(false);

  // Xoá keyword và ẩn search bar
  const clearMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    if (location.pathname.startsWith("/products")) {
      const params = new URLSearchParams(location.search);
      params.delete("keyword");
      params.delete("page");
      const qs = params.toString();
      navigate(`/products${qs ? `?${qs}` : ""}`);
    }
  }, [navigate, location]);

  // Đóng overlay khi chuyển route
  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateNavTop = () => {
      if (headerRef.current) {
        setNavTop(headerRef.current.getBoundingClientRect().bottom);
      }
    };
    updateNavTop();
    window.addEventListener("scroll", updateNavTop, { passive: true });
    window.addEventListener("resize", updateNavTop, { passive: true });
    const ro = new ResizeObserver(updateNavTop);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => {
      window.removeEventListener("scroll", updateNavTop);
      window.removeEventListener("resize", updateNavTop);
      ro.disconnect();
    };
  }, []);

  const toggle = () => {
    if (phase === "opening" || phase === "closing") return;
    clearTimeout(timerRef.current);
    if (phase === "closed") {
      setPhase("opening");
      timerRef.current = setTimeout(() => setPhase("open"), OPEN_DURATION);
    } else {
      setPhase("closing");
      timerRef.current = setTimeout(() => setPhase("closed"), CLOSE_DURATION);
    }
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isOpen = phase === "open" || phase === "opening";
  const arrowRotated = phase === "open";
  const { navRef, itemRefs, pill, blob } = useLiquidPill(isOpen);

  const BTN_SIZE = 24;
  const btnTop = isOpen
    ? navTop + 8 + NAV_HEIGHT - BTN_SIZE / 2
    : navTop - 10;

  // Icons cho bottom nav
  const NAV_ICONS = {
    "/": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    "/products": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    "/policies": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    "/contact": (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
      </svg>
    ),
  };

  return (
    <>
      {/* Định nghĩa filter "goo" dùng cho hiệu ứng liquid pill (trước đây bị thiếu,
          khiến lớp blob nền pill không merge mượt giữa các lần chuyển active) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* ── HEADER sticky ── */}
      <div
        ref={headerRef}
        className="sticky top-0 transition-theme"
        style={{
          zIndex: "var(--z-header)",
          backgroundColor: "var(--color-bg-base)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

            {/* ── MOBILE: search bar thay thế toàn bộ header row khi active ── */}
            {mobileSearchActive && (
              <div className="flex sm:hidden items-center gap-2 w-full">
                {/* Nút back — bấm để xoá keyword và ẩn search */}
                <button
                  onClick={clearMobileSearch}
                  style={{
                    flexShrink: 0,
                    width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--radius-md)",
                    border: "none", background: "none", cursor: "pointer",
                    color: "var(--color-text-secondary)",
                  }}
                  aria-label="Quay lại"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                </button>
                {/* SearchBox chiếm phần còn lại */}
                <div style={{ flex: 1 }}>
                  <SearchBox onClose={closeMobileSearch} initialQuery={currentKeyword} />
                </div>
              </div>
            )}

            {/* ── Logo — ẩn khi mobile search active ── */}
            <Link to="/"
              className={`items-center gap-2 shrink-0 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-[var(--duration-base)]
                ${mobileSearchActive ? "hidden sm:flex" : "flex"}`}>
              <img src={LOGO_URL} alt="Green Juice Hub" className="w-8 h-8 object-contain" />
              <span
                className="font-display font-semibold text-[var(--text-lg)] text-[var(--color-text-primary)] tracking-tight"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "clamp(80px, 30vw, 200px)",
                }}
              >
                Green Juice Hub
              </span>
            </Link>

            {/* Search — chỉ desktop (sm+) */}
            <div className="hidden sm:flex flex-1 justify-center">
              <SearchBox />
            </div>

            {/* Spacer mobile — ẩn khi search active (search box đã chiếm flex-1) */}
            {!mobileSearchActive && <div className="flex-1 sm:hidden" />}

            {/* Right actions — ẩn khi mobile search active */}
            <div className={`items-center gap-1 sm:gap-2 shrink-0 ${mobileSearchActive ? "hidden sm:flex" : "flex"}`}>
              {/* Theme toggle — chỉ desktop */}
              <span className="hidden sm:block">
                <ThemeToggle />
              </span>

              {/* Search icon — chỉ mobile, chỉ hiện khi search KHÔNG active */}
              <button
                className="sm:hidden relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)]
                           text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                           hover:bg-[var(--color-bg-muted)] transition-colors duration-[var(--duration-base)]"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Tìm kiếm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>

              {/* Cart */}
              <button
                ref={cartBtnRef}
                onClick={toggleCart}
                className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)]
                           text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                           hover:bg-[var(--color-bg-muted)] transition-colors duration-[var(--duration-base)]"
                aria-label="Giỏ hàng"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {totalQuantity > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                )}
              </button>

              {/* Auth */}
              {isLoggedIn && user ? (
                <UserDropdown user={user} onLogout={handleLogout} onOpenProfile={() => openProfileModal('profile')} />
              ) : (
                <>
                  {/* Mobile: icon only */}
                  <Link to="/login"
                    className="sm:hidden w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)]
                               text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                               hover:bg-[var(--color-bg-muted)] transition-colors duration-[var(--duration-base)]"
                    aria-label="Đăng nhập"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>
                  {/* Desktop: full button */}
                  <Link to="/login"
                    className="hidden sm:flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-pill)]
                               text-[var(--text-sm)] font-medium bg-[var(--color-primary)] text-white
                               hover:bg-[var(--color-primary-hover)] transition-colors duration-[var(--duration-base)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ── Desktop: Floating pill nav (sm+) ── */}
      <div
        className="hidden sm:block"
        style={{
          position: "fixed",
          top: navTop + 8,
          left: "50%",
          transform: isOpen
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(-12px)",
          width: "fit-content",
          zIndex: "calc(var(--z-header) - 1)",
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          transition: isOpen
            ? `opacity ${OPEN_DURATION}ms ease, transform ${OPEN_DURATION}ms cubic-bezier(0.34,1.1,0.64,1)`
            : `opacity ${CLOSE_DURATION}ms ease, transform ${CLOSE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
        }}
      >
        <nav
          ref={navRef}
          aria-label="Điều hướng chính"
          className="relative flex items-center justify-center gap-1 px-2 py-2 transition-theme"
          style={{
            // FIX: width tường minh để nền pill luôn ôm sát đúng nội dung
            // (trước đây thiếu width khiến flex container đôi khi đo hẹp hơn
            // nội dung thật, làm item đầu/cuối "Trang chủ"/"Liên hệ" tràn ra
            // ngoài phần nền bo tròn).
            width: "max-content",
            borderRadius: 9999,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, borderRadius: 9999,
            overflow: "hidden", filter: "url(#goo)", pointerEvents: "none"
          }}>
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: blob.x, width: blob.width, height: 36, borderRadius: 9999,
              background: "var(--color-primary)"
            }} />
            <div style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              left: pill.x, width: pill.width, height: 36, borderRadius: 9999,
              background: "var(--color-primary)", opacity: pill.opacity
            }} />
          </div>

          {NAV_LINKS.map(({ label, to }) => {
            const isActive = to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to === "/policies" ? "/policies/shipping" : to}
                end={to === "/"}
                ref={(el) => { if (el) itemRefs.current[to] = el; }}
                className={
                  `relative z-10 shrink-0 px-4 md:px-5 h-9 flex items-center rounded-[var(--radius-pill)]
                   text-[var(--text-sm)] font-medium transition-colors duration-[var(--duration-base)]
                   ${isActive
                    ? "text-white"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                  }`
                }
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ── Mobile: Bottom Tab Bar (<sm) ──
          FIX: display giờ nằm trong className ("flex sm:hidden") thay vì
          inline style, vì inline style luôn thắng tuyệt đối so với class CSS
          (kể cả class có media query) — trước đây style={{display:"flex"}}
          khiến sm:hidden không bao giờ ăn được, làm thanh tab hiện ở mọi
          kích thước màn hình (tablet/desktop) chứ không riêng gì mobile. */}
      <nav
        aria-label="Điều hướng chính"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: "stretch",
          borderTop: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-elevated)",
          zIndex: "var(--z-header)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        }}
        className="flex sm:hidden"
      >
        {NAV_LINKS.map(({ label, to }) => {
          const isActive = to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(to);
          const navTo = to === "/policies" ? "/policies/shipping" : to;

          return (
            <NavLink
              key={to}
              to={navTo}
              end={to === "/"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 4px",
                color: isActive ? "#fff" : "var(--color-text-muted)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              {/* Pill background cho item active — theo mẫu: pill rõ ràng,
                  rộng rãi, icon/text giữ nguyên cỡ (không thu nhỏ icon như
                  bản trước), bo tròn đều, nổi bật hẳn so với tab thường. */}
              <span style={{
                display: "flex",
                flexDirection: isActive ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isActive ? 7 : 3,
                padding: isActive ? "9px 16px" : "2px 6px",
                borderRadius: 9999,
                background: isActive ? "var(--color-primary)" : "transparent",
                boxShadow: isActive ? "0 4px 10px color-mix(in srgb, var(--color-primary) 40%, transparent)" : "none",
                transition: "background 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease",
              }}>
                <span style={{
                  color: isActive ? "#fff" : "currentColor",
                  display: "flex",
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                }}>
                  {NAV_ICONS[to]}
                </span>
                <span style={{
                  fontSize: isActive ? 13 : 10,
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: isActive ? "#fff" : "currentColor",
                }}>
                  {label}
                </span>
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Toggle button — chỉ desktop ── */}
      <div
        className="hidden sm:block"
        style={{
          position: "fixed",
          top: btnTop,
          left: "50%",
          transform: "translateX(-50%)",
          width: "fit-content",
          zIndex: "calc(var(--z-header) + 1)",
          transition: `top ${isOpen ? OPEN_DURATION : CLOSE_DURATION}ms cubic-bezier(0.34,1.1,0.64,1)`,
        }}
      >
        <button
          onClick={toggle}
          aria-label={isOpen ? "Đóng điều hướng" : "Mở điều hướng"}
          aria-expanded={isOpen}
          className="flex items-center justify-center rounded-full transition-all duration-150 hover:scale-110 active:scale-90"
          style={{
            width: BTN_SIZE, height: BTN_SIZE,
            border: "1px solid var(--color-primary)",
            background: "var(--color-primary)",
            color: "#fff", cursor: "pointer",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: arrowRotated ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.35s cubic-bezier(0.34,1.3,0.64,1)",
            }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={closeProfileModal} />
    </>
  );
}