import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { dashboardApi } from "@/api/dashboardApi";
import { NAV_ITEMS } from "./AdminSidebar";

// ==================== ICONS ====================
const icons = {
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  externalLink: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
      <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" />
    </svg>
  ),
};

function findCurrentNavItem(pathname) {
  // Sắp xếp theo độ dài path giảm dần để match path con trước (ví dụ /admin/products/123)
  const sorted = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length);
  return sorted.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  );
}

export default function AdminTopbar({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ newOrdersCount: 0, pendingReviewsCount: 0 });

  const currentItem = findCurrentNavItem(location.pathname);
  const pageTitle = currentItem?.label || "Trang quản trị";

  useEffect(() => {
    let mounted = true;

    const fetchNotif = () => {
      dashboardApi
        .getSummary()
        .then((res) => {
          if (mounted) {
            setNotif({
              newOrdersCount: res.data?.newOrdersCount ?? 0,
              pendingReviewsCount: res.data?.pendingReviewsCount ?? 0,
            });
          }
        })
        .catch(() => {});
    };

    fetchNotif(); // Gọi ngay lần đầu

    const interval = setInterval(fetchNotif, 60_000); // Sau đó mỗi 60 giây

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []); // Chỉ chạy 1 lần khi mount AdminLayout

  const totalNotif = notif.newOrdersCount + notif.pendingReviewsCount;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Toggle sidebar - chỉ hiện trên mobile */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Mở menu"
        >
          <span className="h-5 w-5 block">{icons.menu}</span>
        </button>

        {/* Breadcrumb / page title */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Admin</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Xem trang web */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:flex"
        >
          <span className="h-4 w-4">{icons.externalLink}</span>
          <span>Xem trang web</span>
        </a>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 sm:hidden"
          aria-label="Xem trang web"
        >
          <span className="h-5 w-5 block">{icons.externalLink}</span>
        </a>

        {/* Thông báo */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Thông báo"
          >
            <span className="h-5 w-5 block">{icons.bell}</span>
            {totalNotif > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {totalNotif > 99 ? "99+" : totalNotif}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <Link
                  to="/admin/orders"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <span className="h-5 w-5">{icons.cart}</span>
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đơn hàng mới</p>
                    <p className="text-xs text-gray-500">Chờ xác nhận</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{notif.newOrdersCount}</span>
                </Link>
                <Link
                  to="/admin/reviews"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <span className="h-5 w-5">{icons.star}</span>
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đánh giá chờ duyệt</p>
                    <p className="text-xs text-gray-500">Cần kiểm duyệt</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{notif.pendingReviewsCount}</span>
                </Link>
                {totalNotif === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-gray-400">Không có thông báo mới</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* User info */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.name || "Quản trị viên"}</p>
          <p className="text-xs text-gray-500">{user?.role === "ADMIN" ? "Admin" : "Staff"}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
          <span className="h-5 w-5 block">{icons.user}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Đăng xuất"
        >
          <span className="h-4 w-4 block">{icons.logout}</span>
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}