import { NavLink } from "react-router-dom";

// ==================== ICONS (outline SVG, 20x20) ====================
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  product: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7l-8-4-8 4 8 4 8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </svg>
  ),
  order: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  ),
  promotion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 11 23l-9-9 9.59-9.59A2 2 0 0 1 13 4h6a1 1 0 0 1 1 1v6a2 2 0 0 1-.41 1.41Z" />
      <circle cx="15" cy="8" r="1.5" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" />
    </svg>
  ),
  contact: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  banner: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M3 14l5-4 4 3 5-5 4 3" />
    </svg>
  ),
  policy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13a13 13 0 0 1 13-9 7 7 0 0 1-1 13c-1.6 1.6-3.4 2.7-5 3Z" />
      <path d="M11 13a8 8 0 0 1 6-6" />
    </svg>
  ),
};

export const NAV_ITEMS = [
  { to: "/admin", label: "Tổng quan", icon: icons.dashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: icons.product },
  { to: "/admin/orders", label: "Đơn hàng", icon: icons.order },
  { to: "/admin/promotions", label: "Khuyến mãi", icon: icons.promotion },
  { to: "/admin/users", label: "Người dùng", icon: icons.user },
  { to: "/admin/reviews", label: "Đánh giá", icon: icons.review },
  { to: "/admin/contacts", label: "Liên hệ", icon: icons.contact },
  { to: "/admin/banners", label: "Banner", icon: icons.banner },
  { to: "/admin/policies", label: "Chính sách", icon: icons.policy },
];

export default function AdminSidebar({ onNavigate, collapsed = false, onToggleCollapse }) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <NavLink
        to="/admin"
        className={`flex h-16 items-center border-b border-gray-200 ${
          collapsed ? "justify-center px-0" : "gap-2 px-6"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <span className="h-5 w-5">{icons.leaf}</span>
        </span>
        {!collapsed && (
          <span className="truncate text-lg font-semibold text-green-600">Green Juice Hub</span>
        )}
      </NavLink>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                collapsed ? "justify-center px-2" : ""
              } ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <span className="h-5 w-5 shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle - chỉ hiện ở sidebar desktop (có onToggleCollapse) */}
      {onToggleCollapse && (
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={onToggleCollapse}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <span className="h-5 w-5 shrink-0">
              {collapsed ? icons.chevronRight : icons.chevronLeft}
            </span>
            {!collapsed && <span>Thu gọn</span>}
          </button>
        </div>
      )}
    </div>
  );
}