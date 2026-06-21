/**
 * Nav.jsx — component này hiện không được dùng trực tiếp trong layout chính.
 * Responsive navigation đã được tích hợp vào Header.jsx với:
 *   - Desktop (sm+): floating pill nav ở trên
 *   - Mobile (<sm): bottom tab bar với icon + label
 *
 * File này giữ nguyên nếu cần dùng Nav standalone ở nơi khác.
 */

import { NavLink, useLocation } from "react-router-dom";
import { useRef, useState, useEffect, useLayoutEffect } from "react";

const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Chính sách", to: "/policies/privacy" },
  { label: "Liên hệ", to: "/contact" },
];

export default function Nav() {
  const location = useLocation();
  const navRef = useRef(null);
  const itemRefs = useRef({});

  const [pill, setPill] = useState({ x: 0, width: 0, opacity: 0 });
  const [blob, setBlob] = useState({ x: 0, width: 0 });
  const animRef = useRef(null);

  const getActiveRect = () => {
    const activeLink = NAV_LINKS.find((l) =>
      l.to === "/" ? location.pathname === "/" : location.pathname.startsWith(l.to)
    );
    if (!activeLink) return null;
    const el = itemRefs.current[activeLink.to];
    const nav = navRef.current;
    if (!el || !nav) return null;
    const elRect = el.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    return { x: elRect.left - navRect.left, width: elRect.width };
  };

  useLayoutEffect(() => {
    const rect = getActiveRect();
    if (rect) {
      setPill({ x: rect.x, width: rect.width, opacity: 1 });
      setBlob({ x: rect.x, width: rect.width });
    }
  }, []);

  useEffect(() => {
    const target = getActiveRect();
    if (!target) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const startPill = { ...pill };
    const startBlob = { ...blob };
    const start = performance.now();
    const DURATION = 420;

    const easeOutBack = (t) => {
      const c1 = 1.4;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const animate = (now) => {
      const elapsed = now - start;
      const tRaw = Math.min(elapsed / DURATION, 1);
      const tPill = easeOutBack(tRaw);

      const stretchPhase = tRaw < 0.5 ? tRaw * 2 : 1;
      const shrinkPhase = tRaw < 0.5 ? 0 : (tRaw - 0.5) * 2;

      const blobX = startBlob.x + (target.x - startBlob.x) * stretchPhase;
      const blobRight =
        (startBlob.x + startBlob.width) +
        (target.x + target.width - startBlob.x - startBlob.width) * shrinkPhase;

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
  }, [location.pathname]);

  return (
    <nav
      ref={navRef}
      data-glass
      className="relative flex items-center gap-1 px-2 py-2 mb-4 rounded-[var(--radius-pill)] overflow-x-auto"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.4)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        /* Cho phép scroll ngang trên màn nhỏ nếu dùng standalone */
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Liquid blob layer */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 9999,
          overflow: "hidden",
          filter: "url(#goo)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: blob.x,
            width: blob.width,
            height: 36,
            borderRadius: 9999,
            background: "var(--color-primary)",
            transition: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            left: pill.x,
            width: pill.width,
            height: 36,
            borderRadius: 9999,
            background: "var(--color-primary)",
            opacity: pill.opacity,
            transition: "none",
          }}
        />
      </div>

      {NAV_LINKS.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          end
          ref={(el) => { if (el) itemRefs.current[to] = el; }}
          className={({ isActive }) =>
            `relative z-10 shrink-0 px-4 md:px-5 h-9 flex items-center rounded-[var(--radius-pill)]
             text-[var(--text-sm)] font-medium transition-colors duration-[var(--duration-base)]
             ${isActive
               ? "text-white"
               : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
             }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}