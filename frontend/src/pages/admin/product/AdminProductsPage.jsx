import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminProductApi } from "@/api/adminProductApi";
import { useAdminRole } from "@/hooks/useAdminRole";

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
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
};

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
}

function Badge({ active }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Hiển thị" : "Ẩn"}
    </span>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Huỷ</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { canWrite } = useAdminRole(); // ← thêm

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [inputKeyword, setInputKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    adminProductApi
      .getProducts({ keyword: keyword || undefined, categoryId: categoryId || undefined, page, size: PAGE_SIZE })
      .then((res) => {
        setProducts(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError("Không thể tải danh sách sản phẩm."))
      .finally(() => setLoading(false));
  }, [keyword, categoryId, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    adminProductApi.getCategories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeyword(inputKeyword.trim());
  };

  const handleToggleActive = async (id) => {
    if (!canWrite) return; // ← guard
    try {
      await adminProductApi.toggleActive(id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      alert("Có lỗi xảy ra.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !canWrite) return; // ← guard
    try {
      await adminProductApi.deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      fetchProducts();
    } catch {
      alert("Có lỗi xảy ra khi xoá sản phẩm.");
    }
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Quản lý sản phẩm</h1>
        {/* ← chỉ ADMIN thấy nút Thêm */}
        {canWrite && (
          <button
            onClick={() => navigate("/admin/products/new")}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <span className="h-4 w-4">{icons.plus}</span>
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">{icons.search}</span>
            <input
              type="text"
              value={inputKeyword}
              onChange={(e) => setInputKeyword(e.target.value)}
              placeholder="Tìm tên sản phẩm..."
              className="h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700">
            Tìm
          </button>
        </form>

        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
          className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Không có sản phẩm nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3 text-right">Giá từ</th>
                  <th className="px-4 py-3 text-right">Tồn kho</th>
                  <th className="px-4 py-3 text-right">Biến thể</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  {/* ← chỉ render cột actions nếu ADMIN */}
                  {canWrite && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.primaryImage ? (
                          <img src={p.primaryImage} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">No img</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.categoryName}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(p.minSalePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.totalStock <= 10 ? "font-semibold text-red-600" : "text-gray-700"}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.variantCount}</td>
                    <td className="px-4 py-3">
                      {/* Badge chỉ clickable với ADMIN */}
                      {canWrite ? (
                        <button onClick={() => handleToggleActive(p.id)}>
                          <Badge active={p.isActive} />
                        </button>
                      ) : (
                        <Badge active={p.isActive} />
                      )}
                    </td>
                    {/* ← nút Sửa/Xoá chỉ ADMIN thấy */}
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Chỉnh sửa"
                          >
                            <span className="h-4 w-4 block">{icons.edit}</span>
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Xoá"
                          >
                            <span className="h-4 w-4 block">{icons.trash}</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <span className="h-4 w-4 block">{icons.chevronLeft}</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${i === page ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <span className="h-4 w-4 block">{icons.chevronRight}</span>
          </button>
        </div>
      )}

      {confirmDelete && canWrite && ( // ← guard thêm canWrite
        <ConfirmModal
          message={`Bạn có chắc muốn xoá sản phẩm "${confirmDelete.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}