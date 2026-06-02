import { Link, NavLink } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/common/ThemeToggle";

/* ─────────────────────────────────────────────
   GooFilter – SVG filter engine cho metaball
   Render 1 lần duy nhất ở root, ẩn hoàn toàn.
   stdDeviation=8 → blur mềm
   values "... 20 -9" → ngưỡng merge (tăng số đầu
   để merge sớm hơn, giảm số sau để tách sắc hơn)
───────────────────────────────────────────── */
export function GooFilter() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="goo" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   NAV_LINKS – dùng chung Header + Nav pill
───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Blog", to: "/blog" },
  { label: "Liên hệ", to: "/contact" },
  { label: "Khuyến mãi", to: "/deals" },
];

/* ─────────────────────────────────────────────
   PHASE STATE MACHINE
   'closed' → 'opening' → 'open' → 'closing' → 'closed'
───────────────────────────────────────────── */
const OPEN_DURATION = 440;   // ms – tổng thời gian animation mở
const CLOSE_DURATION = 380;  // ms – tổng thời gian animation đóng

export default function Header() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [phase, setPhase] = useState("closed");
  // phase: 'closed' | 'opening' | 'open' | 'closing'

  const timerRef = useRef(null);

  const toggle = () => {
    // Chặn double-click trong lúc đang animate
    if (phase === "opening" || phase === "closing") return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (phase === "closed") {
      setPhase("opening");
      timerRef.current = setTimeout(() => setPhase("open"), OPEN_DURATION);
    } else {
      setPhase("closing");
      timerRef.current = setTimeout(() => setPhase("closed"), CLOSE_DURATION);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isOpen = phase === "open" || phase === "opening";
  const arrowVisible = phase === "open" || phase === "closed";
  const arrowRotated = phase === "open";

  /* ── Blob geometry ──────────────────────────────────
     Tất cả giá trị là % hoặc px tương đối viewport.
     Điều chỉnh tại đây nếu muốn blob to/nhỏ hơn.
  ─────────────────────────────────────────────────── */
  const HEADER_H = 64;          // px – chiều cao header
  const NAV_Y    = 78;          // px – top của nav blob
  const NAV_H    = 44;          // px – chiều cao nav blob
  const DROP_CY  = HEADER_H - 2; // px – tâm giọt nước (sát đáy header)
  const svgHeight = isOpen ? NAV_Y + NAV_H + 6 : HEADER_H + 4;

  // Giọt nước: chỉ hiện trong phase opening/closing
  const dropVisible = phase === "opening" || phase === "closing";
  const dropRy = dropVisible ? 14 : 0;
  const dropRx = dropVisible ? 16 : 0;

  return (
    <>
      {/* SVG filter engine – đặt ngoài sticky để không bị clip */}
      <GooFilter />

      <div className="sticky top-0 z-[var(--z-header)]">

        {/* ── Wrapper chứa blob + UI ───────────────────── */}
        <div className="relative bg-transparent">

          {/* ── BLOB LAYER ───────────────────────────────
              position: absolute, phía sau mọi UI (z-0)
              overflow: visible để drop không bị cắt
          ─────────────────────────────────────────────── */}
          <svg
            aria-hidden="true"
            className="absolute left-0 top-0 w-full pointer-events-none"
            style={{
              height: svgHeight,
              zIndex: 0,
              overflow: "visible",
              transition: `height ${isOpen ? OPEN_DURATION : CLOSE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
            }}
          >
            <g style={{ filter: "url(#goo)" }}>

              {/* Blob 1 – Header (luôn hiện) */}
              <rect
                x="0" y="0"
                width="100%" height={HEADER_H}
                rx="0"
                fill="var(--color-bg-base)"
              />

              {/* Blob 2 – Giọt nước connector (opening / closing) */}
              <ellipse
                cx="50%"
                cy={DROP_CY}
                rx={dropRx}
                ry={dropRy}
                fill="var(--color-bg-base)"
                style={{
                  transition: dropVisible
                    ? "rx 0.18s ease 0.05s, ry 0.22s ease 0.05s"
                    : "rx 0.16s ease, ry 0.18s ease",
                }}
              />

              {/* Blob 3 – Nav pill (trượt xuống khi opening/open) */}
              <rect
                x="10%" y={NAV_Y}
                width="80%" height={NAV_H}
                rx={NAV_H / 2}
                fill="var(--color-bg-base)"
                style={{
                  transform: isOpen ? "translateY(0)" : "translateY(-22px)",
                  opacity: isOpen ? 1 : 0,
                  transition: isOpen
                    ? `transform ${OPEN_DURATION}ms cubic-bezier(0.34,1.15,0.64,1), opacity 0.28s ease`
                    : `transform ${CLOSE_DURATION}ms cubic-bezier(0.4,0,0.8,1), opacity 0.22s ease`,
                }}
              />

            </g>
          </svg>

          {/* ── HEADER UI (z-10, trên blob) ─────────────── */}
          <header
            className="relative transition-theme"
            style={{ zIndex: 10 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">

              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 shrink-0 text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-[var(--duration-base)]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8z"
                    fill="currentColor" opacity="0.2"
                  />
                  <path
                    d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8zM9 10l2 2 4-4"
                    stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" fill="none"
                  />
                </svg>
                <span className="font-display font-semibold text-[var(--text-lg)] text-[var(--color-text-primary)] tracking-tight">
                  Green Juice Hub
                </span>
              </Link>

              {/* Search */}
              <div className="flex justify-center">
                <div
                  className={`relative transition-all duration-300 ease-in-out ${
                    isFocused ? "w-full max-w-xl" : "w-full max-w-sm"
                  }`}
                >
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Tìm nước ép, smoothie, granola..."
                    className={`w-full h-10 pl-9 pr-4 rounded-[var(--radius-pill)] text-[var(--text-sm)]
                      bg-[var(--color-bg-muted)] border text-[var(--color-text-primary)]
                      placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all duration-300
                      ${isFocused
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-brand-200)] bg-[var(--color-bg-base)]"
                        : "border-[var(--color-border-subtle)]"
                      }`}
                  />
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle />

                <Link
                  to="/cart"
                  className="relative w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] transition-colors duration-[var(--duration-base)]"
                  aria-label="Giỏ hàng"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[10px] font-semibold leading-none">
                    2
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="ml-1 flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-pill)] text-[var(--text-sm)] font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors duration-[var(--duration-base)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Đăng nhập
                </Link>
              </div>

            </div>
          </header>

          {/* ── ARROW + NAV (z-10) ──────────────────────── */}
          <div
            className="relative flex flex-col items-center"
            style={{ zIndex: 10 }}
          >

            {/* Arrow button */}
            <button
              onClick={toggle}
              aria-label={isOpen ? "Đóng điều hướng" : "Mở điều hướng"}
              aria-expanded={isOpen}
              style={{
                /* Opacity + pointer-events theo arrowVisible */
                opacity: arrowVisible ? 1 : 0,
                pointerEvents: arrowVisible ? "auto" : "none",
                transition: "opacity 0.18s ease",
              }}
              className={`
                mt-1 w-8 h-8 flex items-center justify-center
                rounded-full border border-[var(--color-border-subtle)]
                bg-[var(--color-bg-base)]
                text-[var(--color-text-muted)]
                /* hover */
                hover:text-[var(--color-primary)]
                hover:border-[var(--color-primary)]
                hover:bg-[var(--color-bg-muted)]
                hover:scale-110
                hover:shadow-[0_0_0_4px_var(--color-brand-100)]
                /* active / press */
                active:scale-90
                active:bg-[var(--color-brand-50)]
                active:shadow-[0_0_0_6px_var(--color-brand-200)]
                transition-all duration-150
              `}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transform: arrowRotated ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.38s cubic-bezier(0.34,1.4,0.64,1)",
                }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Nav pill – slide down */}
            <div
              className="w-full overflow-hidden"
              style={{
                maxHeight: isOpen ? "80px" : "0px",
                opacity: isOpen ? 1 : 0,
                transition: isOpen
                  ? `max-height ${OPEN_DURATION}ms cubic-bezier(0.34,1.1,0.64,1), opacity 0.28s ease`
                  : `max-height ${CLOSE_DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease`,
              }}
            >
              <nav
                aria-label="Điều hướng chính"
                className="flex items-center justify-center gap-2 px-3 py-2 mb-3"
              >
                {/* Glassmorphism pill – giữ nguyên style Nav.jsx gốc */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-pill)]"
                  style={{
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  {NAV_LINKS.map(({ label, to }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end
                      className={({ isActive }) =>
                        `shrink-0 px-5 h-9 flex items-center rounded-[var(--radius-pill)]
                        text-[var(--text-sm)] font-medium
                        transition-all duration-[var(--duration-base)] ${
                          isActive
                            ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/60"
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </nav>
            </div>

          </div>
          {/* ── END ARROW + NAV ─────────────────────────── */}

        </div>
        {/* ── END WRAPPER ─────────────────────────────── */}

      </div>
    </>
  );
}