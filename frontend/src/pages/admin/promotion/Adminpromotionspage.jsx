import { useEffect, useState, useCallback, useRef } from "react";
import adminPromotionApi from "@/api/adminPromotionApi";
import PromotionFormModal from "./Promotionformmodal"; // ← tách ra rồi
import { useAdminRole } from "@/hooks/useAdminRole";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
};

const fmtDateShort = (iso) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(iso));
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  UPCOMING:  { label: "Sắp diễn ra", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  RUNNING:   { label: "Đang chạy",   color: "#14532d", bg: "#dcfce7", dot: "#16a34a" },
  EXHAUSTED: { label: "Hết lượt",    color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  EXPIRED:   { label: "Hết hạn",     color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  INACTIVE:  { label: "Đã tắt",      color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" /></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
};

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ background: checked ? "#16a34a" : "#d1d5db" }}
    >
      <span className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

// ── Read-only state dot (dùng cho STAFF, không cho tương tác) ──────────────────
function StatusDot({ active }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: active ? "#16a34a" : "#d1d5db" }}
      title={active ? "Đang kích hoạt" : "Đã tắt"}
    />
  );
}

// ── Usage History Modal ───────────────────────────────────────────────────────
const ORDER_STATUS_LABEL = {
  PENDING:   { label: "Chờ xác nhận", color: "#92400e", bg: "#fef3c7" },
  CONFIRMED: { label: "Đã xác nhận",  color: "#1e40af", bg: "#dbeafe" },
  SHIPPING:  { label: "Đang giao",    color: "#5b21b6", bg: "#ede9fe" },
  DELIVERED: { label: "Đã giao",      color: "#14532d", bg: "#dcfce7" },
  CANCELLED: { label: "Đã huỷ",       color: "#991b1b", bg: "#fee2e2" },
};

function OrderStatusMini({ status }) {
  const cfg = ORDER_STATUS_LABEL[status] || { label: status, color: "#374151", bg: "#f3f4f6" };
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function UsageHistoryModal({ promotion, onClose }) {
  const [usages, setUsages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 15;

  const fetchUsages = useCallback((p) => {
    setLoading(true);
    adminPromotionApi
      .getUsageHistory(promotion.id, { page: p, size: PAGE_SIZE })
      .then((res) => {
        setUsages(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [promotion.id]);

  useEffect(() => { fetchUsages(0); }, [fetchUsages]);

  const handlePage = (p) => { setPage(p); fetchUsages(p); };
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const discountLabel = promotion.type === "PERCENT"
    ? `Giảm ${promotion.value}%`
    : `Giảm ${fmt(promotion.value)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleBackdrop}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 font-mono text-sm font-bold bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-lg">
                {promotion.code}
              </span>
              <StatusBadge status={promotion.status} />
            </div>
            <p className="text-base font-semibold text-gray-900">{promotion.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{discountLabel}</span>
              {promotion.freeShipping && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <span className="h-3 w-3 inline-block">{icons.truck}</span>Miễn ship
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex-shrink-0">
            <span className="h-4 w-4 block">{icons.x}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: "Đã dùng",  value: promotion.usedCount ?? 0 },
            { label: "Tổng lượt", value: promotion.maxUses != null ? promotion.maxUses : "∞" },
            { label: "Còn lại",  value: promotion.maxUses != null ? Math.max(0, promotion.maxUses - (promotion.usedCount ?? 0)) : "∞" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-3 text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Đang tải...</div>
          ) : usages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-32">
              <span className="h-8 w-8 text-gray-300 block">{icons.history}</span>
              <p className="text-sm text-gray-400">Chưa có lượt sử dụng nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Khách hàng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Mã đơn</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Giá trị đơn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Trạng thái đơn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usages.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{u.userName || "—"}</p>
                      <p className="text-xs text-gray-400">{u.userPhone || ""}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">#{u.orderCode}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{fmt(u.orderTotalAmount)}</td>
                    <td className="px-5 py-3"><OrderStatusMini status={u.orderStatus} /></td>
                    <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(u.usedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination — kiểu "Trang X / Y" */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100">
            <button onClick={() => handlePage(Math.max(0, page - 1))} disabled={page === 0}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
              <span className="h-4 w-4 block">{icons.chevronLeft}</span>
            </button>
            <span className="text-sm text-gray-500">
              Trang <strong className="text-gray-800">{page + 1}</strong> / {totalPages}
            </span>
            <button onClick={() => handlePage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
              <span className="h-4 w-4 block">{icons.chevronRight}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "",      label: "Tất cả" },
  { key: "true",  label: "Đang kích hoạt" },
  { key: "false", label: "Đã tắt" },
];

const TARGET_OPTIONS = [
  { value: "",         label: "Tất cả đối tượng" },
  { value: "PUBLIC",   label: "Công khai" },
  { value: "PERSONAL", label: "Cá nhân" },
];

export default function AdminPromotionsPage() {
  const { canWrite } = useAdminRole(); // STAFF → false, ADMIN → true

  const [promotions, setPromotions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [inputKeyword, setInputKeyword] = useState("");
  const [keyword, setKeyword]           = useState("");
  const [target, setTarget]             = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 20;

  const debounceRef = useRef(null);

  const [formModal, setFormModal]       = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [toggling, setToggling]         = useState(null);

  const fetchPromotions = useCallback(() => {
    setLoading(true);
    setError(null);
    adminPromotionApi
      .getPromotions({
        keyword: keyword || undefined,
        target: target || undefined,
        isActive: activeFilter !== "" ? activeFilter : undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((res) => {
        setPromotions(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Không thể tải danh sách khuyến mãi."))
      .finally(() => setLoading(false));
  }, [keyword, target, activeFilter, page]);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleInputChange = (e) => {
    setInputKeyword(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setKeyword(e.target.value.trim());
    }, 350);
  };

  const handleClearSearch = () => { setInputKeyword(""); setKeyword(""); setPage(0); };

  const handleToggle = async (id) => {
    if (!canWrite) return; // STAFF không có quyền bật/tắt
    setToggling(id);
    try {
      await adminPromotionApi.toggleActive(id);
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isActive: !p.isActive, status: !p.isActive ? "RUNNING" : "INACTIVE" } : p
        )
      );
    } catch {
      alert("Có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setToggling(null);
    }
  };

  const handleSaved = () => { setFormModal(null); fetchPromotions(); };

  const hasFilters = keyword || target || activeFilter;
  const clearFilters = () => {
    setInputKeyword(""); setKeyword("");
    setTarget(""); setActiveFilter(""); setPage(0);
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Quản lý khuyến mãi</h1>
        {canWrite && (
          <button
            onClick={() => setFormModal("new")}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <span className="h-4 w-4">{icons.plus}</span>
            Thêm mã
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 px-3 focus-within:border-green-500 transition-colors bg-white"
          style={{ width: 260 }}>
          <span className="h-4 w-4 text-gray-400 flex-shrink-0">{icons.search}</span>
          <input
            type="text" value={inputKeyword} onChange={handleInputChange}
            placeholder="Tìm mã, tên chương trình..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
          />
          {inputKeyword && (
            <button onClick={handleClearSearch} className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600">{icons.x}</button>
          )}
        </div>

        <select value={target} onChange={(e) => { setTarget(e.target.value); setPage(0); }}
          className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:border-green-500 focus:outline-none">
          {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setPage(0); }}
              className="h-9 px-3 text-sm font-medium transition-colors"
              style={{
                background: activeFilter === tab.key ? "#16a34a" : "transparent",
                color: activeFilter === tab.key ? "#fff" : "#6b7280",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50">
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Đang tải...</div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span className="h-8 w-8 text-gray-300">{icons.tag}</span>
            <p className="text-sm text-gray-400">Không có mã khuyến mãi nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Mã / Tên</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Giảm giá</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3 text-center">Lượt dùng</th>
                  <th className="px-4 py-3">Thời hạn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Kích hoạt</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                        {p.freeShipping && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            <span className="h-2.5 w-2.5 inline-block">{icons.truck}</span>Ship
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-[180px]">{p.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.type === "PERCENT" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"
                      }`}>
                        {p.type === "PERCENT" ? "%" : "₫"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.type === "PERCENT" ? `${p.value}%` : fmt(p.value)}
                      {p.minOrderValue > 0 && (
                        <p className="text-xs text-gray-400 font-normal">từ {fmt(p.minOrderValue)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.target === "PERSONAL" ? (
                        <div>
                          <span className="inline-flex items-center text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Cá nhân</span>
                          {p.targetUserName && <p className="text-xs text-gray-400 mt-0.5">{p.targetUserName}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">Công khai</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-800">{p.usedCount ?? 0}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-500">{p.maxUses != null ? p.maxUses : "∞"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{fmtDateShort(p.startsAt)}</p>
                      <p className="text-gray-400">→ {fmtDateShort(p.endsAt)}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-center">
                      {canWrite ? (
                        <Toggle checked={p.isActive} onChange={() => handleToggle(p.id)} disabled={toggling === p.id} />
                      ) : (
                        <StatusDot active={p.isActive} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && (
                          <button onClick={() => setFormModal(p)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Chỉnh sửa">
                            <span className="h-4 w-4 block">{icons.edit}</span>
                          </button>
                        )}
                        <button onClick={() => setHistoryModal(p)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600" title="Lịch sử sử dụng">
                          <span className="h-4 w-4 block">{icons.history}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination — kiểu "Trang X / Y" */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <span className="h-4 w-4 block">{icons.chevronLeft}</span>
          </button>
          <span className="text-sm text-gray-500">
            Trang <strong className="text-gray-800">{page + 1}</strong> / {totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <span className="h-4 w-4 block">{icons.chevronRight}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {formModal && canWrite && (
        <PromotionFormModal
          editTarget={formModal === "new" ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
      {historyModal && (
        <UsageHistoryModal
          promotion={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}