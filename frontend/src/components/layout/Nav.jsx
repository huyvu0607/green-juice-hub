import { NavLink } from "react-router-dom";

const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Blog", to: "/blog" },
  { label: "Liên hệ", to: "/contact" },
];

export default function Nav() {
  return (
    <div className="flex flex-col items-center bg-[var(--color-bg-surface)] transition-theme">

      {/* Mũi tên ^ */}
      {/* <svg
  width="40"
  height="20"
  viewBox="0 0 24 12"
  fill="none"
  className="text-[var(--color-border-default)] my-2"
>
  <path
    d="M2 10L12 2L22 10"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
      </svg> */}

      {/* Nav glassmorphism */}
      <nav data-glass
        className="flex items-center gap-2 px-3 py-2 mb-4 rounded-[var(--radius-pill)]"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `shrink-0 px-5 h-9 flex items-center rounded-[var(--radius-pill)] text-[var(--text-sm)] font-medium transition-all duration-[var(--duration-base)] ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/60"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}