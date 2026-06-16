import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminProductApi } from "@/api/adminProductApi";
import { uploadImage } from "@/api/cloudinaryApi";
import RichTextEditor from "@/components/common/RichTextEditor";

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  arrowLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" /></svg>,
  starOut: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 6 6 1-4.5 4.5L17.5 20 12 17l-5.5 3 1-6.5L3 9l6-1 3-6Z" /></svg>,
  image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>,
};

const TAGS = ["bestseller", "organic", "new", "sugar-free"];
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none";

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, required, children, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Inline editable list (Flavor / Size) ──────────────────────────────────────
function InlineList({ title, items, onCreate, onUpdate, onToggle, onDelete }) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await onCreate(newName.trim()); setNewName(""); }
    finally { setAdding(false); }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setLoadingId(id);
    try { await onUpdate(id, editName.trim()); setEditId(null); }
    finally { setLoadingId(null); }
  };

  const handleToggle = async (id) => {
    setLoadingId(id);
    try { await onToggle(id); }
    finally { setLoadingId(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xoá mục này?")) return;
    setLoadingId(id);
    try { await onDelete(id); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>

      {/* List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-gray-400 py-1">Chưa có mục nào.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            {editId === item.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(item.id); if (e.key === "Escape") setEditId(null); }}
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
                />
                <button type="button" onClick={() => handleUpdate(item.id)} disabled={loadingId === item.id}
                  className="h-6 w-6 rounded text-green-600 hover:bg-green-50 flex items-center justify-center">
                  <span className="h-3.5 w-3.5">{icons.check}</span>
                </button>
                <button type="button" onClick={() => setEditId(null)}
                  className="h-6 w-6 rounded text-gray-400 hover:bg-gray-100 flex items-center justify-center">
                  <span className="h-3.5 w-3.5">{icons.x}</span>
                </button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-xs ${!item.isActive ? "text-gray-300 line-through" : "text-gray-700"}`}>
                  {item.name}
                </span>
                {/* Toggle active */}
                <button type="button" onClick={() => handleToggle(item.id)} disabled={loadingId === item.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {item.isActive ? "ON" : "OFF"}
                </button>
                {/* Edit */}
                <button type="button" onClick={() => { setEditId(item.id); setEditName(item.name); }}
                  className="h-6 w-6 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center">
                  <span className="h-3.5 w-3.5">{icons.edit}</span>
                </button>
                {/* Delete */}
                <button type="button" onClick={() => handleDelete(item.id)} disabled={loadingId === item.id}
                  className="h-6 w-6 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center">
                  <span className="h-3.5 w-3.5">{icons.trash}</span>
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
          placeholder={`Thêm ${title.toLowerCase()}...`}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-green-500 focus:outline-none"
        />
        <button type="button" onClick={handleCreate} disabled={adding || !newName.trim()}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40">
          {adding ? "..." : "Thêm"}
        </button>
      </div>
    </div>
  );
}

// ── Image Drop Zone ───────────────────────────────────────────────────────────
function ImageDropZone({ images, onFiles, onSetPrimary, onDelete, uploading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  }, [onFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className={`aspect-square overflow-hidden rounded-xl border-2 transition ${img.isPrimary ? "border-green-500" : "border-transparent"}`}>
                {img.uploading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-1 bg-gray-100">
                    {/* Progress spinner */}
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
                    <span className="text-[10px] text-gray-400">Đang tải...</span>
                  </div>
                ) : (
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              {/* Hover actions */}
              {!img.uploading && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => onSetPrimary(idx)}
                    className={`rounded-lg p-1.5 ${img.isPrimary ? "bg-yellow-400 text-white" : "bg-white text-gray-700 hover:bg-yellow-50"}`}
                    title="Đặt làm ảnh chính">
                    <span className="h-3.5 w-3.5 block">{img.isPrimary ? icons.star : icons.starOut}</span>
                  </button>
                  <button type="button" onClick={() => onDelete(idx)}
                    className="rounded-lg bg-white p-1.5 text-red-600 hover:bg-red-50" title="Xoá ảnh">
                    <span className="h-3.5 w-3.5 block">{icons.trash}</span>
                  </button>
                </div>
              )}

              {img.isPrimary && !img.uploading && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Ảnh chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition ${dragging ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-400 hover:bg-gray-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className={`h-8 w-8 ${dragging ? "text-green-500" : "text-gray-300"}`}>{icons.image}</span>
        <p className="text-sm font-medium text-gray-500">
          {dragging ? "Thả ảnh vào đây" : "Kéo thả ảnh hoặc click để chọn"}
        </p>
        <p className="text-xs text-gray-400">Hỗ trợ JPG, PNG, WEBP — nhiều ảnh cùng lúc</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleInputChange} />
      </div>
    </div>
  );
}

// ── Variant Row ───────────────────────────────────────────────────────────────
function VariantRow({ variant, index, flavors, sizes, onChange, onDelete }) {
  const calcDiscount = (orig, sale) => {
    if (!orig || !sale || +orig === 0) return "0";
    return Math.max(0, ((+orig - +sale) / +orig) * 100).toFixed(1);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Biến thể #{index + 1}</span>
        <button type="button" onClick={() => onDelete(index)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
          <span className="h-4 w-4 block">{icons.trash}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <FormField label="Hương vị">
          <select value={variant.flavorId || ""} onChange={(e) => onChange(index, "flavorId", e.target.value || null)} className={inputCls}>
            <option value="">-- Không có --</option>
            {flavors.map((f) => (
              <option key={f.id} value={f.id}>{f.name}{!f.isActive ? " (OFF)" : ""}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Kích cỡ">
          <select value={variant.sizeId || ""} onChange={(e) => onChange(index, "sizeId", e.target.value || null)} className={inputCls}>
            <option value="">-- Không có --</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{!s.isActive ? " (OFF)" : ""}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Giá gốc (đ)" required>
          <input type="number" min="0" value={variant.originalPrice || ""} onChange={(e) => onChange(index, "originalPrice", e.target.value)} className={inputCls} placeholder="0" />
        </FormField>

        <FormField label="Giá sale (đ)" required>
          <input type="number" min="0" value={variant.salePrice || ""} onChange={(e) => onChange(index, "salePrice", e.target.value)} className={inputCls} placeholder="0" />
        </FormField>

        <FormField label="Tồn kho" required>
          <input type="number" min="0" value={variant.stockQty ?? ""} onChange={(e) => onChange(index, "stockQty", e.target.value)} className={inputCls} placeholder="0" />
        </FormField>

        <FormField label="Trọng lượng (g)">
          <input type="number" min="1" value={variant.weightGram || ""} onChange={(e) => onChange(index, "weightGram", e.target.value)} className={inputCls} placeholder="500" />
        </FormField>

        <FormField label="Thứ tự">
          <input type="number" min="0" value={variant.sortOrder ?? 0} onChange={(e) => onChange(index, "sortOrder", e.target.value)} className={inputCls} />
        </FormField>

        <FormField label="Giảm giá">
          <div className="flex h-9 items-center rounded-lg border border-gray-100 bg-white px-3 text-sm font-medium text-green-600">
            -{calcDiscount(variant.originalPrice, variant.salePrice)}%
          </div>
        </FormField>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input type="checkbox" id={`active-${index}`} checked={variant.isActive !== false}
          onChange={(e) => onChange(index, "isActive", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-green-600" />
        <label htmlFor={`active-${index}`} className="text-xs text-gray-600">Hiển thị biến thể này</label>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Meta
  const [categories, setCategories] = useState([]);
  const [flavors, setFlavors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");



  // Form
  const [form, setForm] = useState({ name: "", categoryId: "", description: "", tags: [] });
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);


  // ── Load meta ──────────────────────────────────────────────────────────────
  const reloadFlavors = () => adminProductApi.getFlavors().then((r) => setFlavors(r.data));
  const reloadSizes = () => adminProductApi.getSizes().then((r) => setSizes(r.data));
  const reloadTags = () => adminProductApi.getTags().then((r) => setAvailableTags(r.data));


  useEffect(() => {
    Promise.all([
      adminProductApi.getCategories(),
      adminProductApi.getFlavors(),
      adminProductApi.getSizes(),
      adminProductApi.getTags(),        // ← thêm
    ]).then(([c, f, s, t]) => {
      setCategories(c.data);
      setFlavors(f.data);
      setSizes(s.data);
      setAvailableTags(t.data);         // ← thêm
    }).finally(() => setLoadingMeta(false));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminProductApi.getProduct(id).then((res) => {
      const p = res.data;
      setForm({
        name: p.name || "",
        categoryId: p.category?.id || "",
        description: p.description || "",
        tags: [...new Set(p.tags || [])],   // ← deduplicate tags cũ bị duplicate
      });
      setImages((p.images || []).map((img) => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary, sortOrder: img.sortOrder })));
      setVariants((p.variants || []).map((v) => ({
        id: v.id,
        flavorId: v.flavor?.id || null,
        sizeId: v.size?.id || null,
        originalPrice: v.originalPrice,
        salePrice: v.salePrice,
        stockQty: v.stockQty,
        weightGram: v.weightGram || 500,
        sortOrder: v.sortOrder || 0,
        isActive: v.isActive !== false,
      })));
    }).catch(() => alert("Không thể tải thông tin sản phẩm."));
  }, [id, isEdit]);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    setUploading(true);
    // Thêm placeholder cho từng file
    const startIdx = images.length;
    const placeholders = files.map((_, i) => ({
      imageUrl: "", isPrimary: startIdx === 0 && i === 0, sortOrder: startIdx + i, uploading: true,
    }));
    setImages((prev) => [...prev, ...placeholders]);

    // Upload song song
    const results = await Promise.allSettled(files.map((f) => uploadImage(f, "products")));

    setImages((prev) => {
      const next = [...prev];
      results.forEach((result, i) => {
        const idx = startIdx + i;
        if (result.status === "fulfilled") {
          next[idx] = { ...next[idx], imageUrl: result.value, uploading: false };
        } else {
          next[idx] = null; // đánh dấu xoá
        }
      });
      return next.filter(Boolean).map((img, i) => ({ ...img, sortOrder: i }));
    });
    setUploading(false);
  }, [images.length]);

  const handleSetPrimary = (idx) => setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));

  const handleDeleteImage = (idx) => setImages((prev) => {
    const next = prev.filter((_, i) => i !== idx);
    if (prev[idx].isPrimary && next.length > 0) next[0].isPrimary = true;
    return next.map((img, i) => ({ ...img, sortOrder: i }));
  });

  // ── Flavor/Size CRUD ───────────────────────────────────────────────────────
  const flavorHandlers = {
    onCreate: async (name) => { await adminProductApi.createFlavor({ name, isActive: true }); await reloadFlavors(); },
    onUpdate: async (flavorId, name) => { await adminProductApi.updateFlavor(flavorId, { name }); await reloadFlavors(); },
    onToggle: async (flavorId) => { await adminProductApi.toggleFlavorActive(flavorId); await reloadFlavors(); },
    onDelete: async (flavorId) => { await adminProductApi.toggleFlavorActive(flavorId); await reloadFlavors(); },
  };

  const sizeHandlers = {
    onCreate: async (name) => { await adminProductApi.createSize({ name, isActive: true }); await reloadSizes(); },
    onUpdate: async (sizeId, name) => { await adminProductApi.updateSize(sizeId, { name }); await reloadSizes(); },
    onToggle: async (sizeId) => { await adminProductApi.toggleSizeActive(sizeId); await reloadSizes(); },
    onDelete: async (sizeId) => { await adminProductApi.toggleSizeActive(sizeId); await reloadSizes(); },
  };

  // ── Variant handlers ───────────────────────────────────────────────────────
  const addVariant = () => setVariants((prev) => [...prev, {
    flavorId: null, sizeId: null, originalPrice: "", salePrice: "",
    stockQty: 0, weightGram: 500, sortOrder: prev.length, isActive: true,
  }]);

  const updateVariant = (idx, key, value) => setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [key]: value } : v));
  const deleteVariant = (idx) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  // ── Validate & Submit ──────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tên sản phẩm không được để trống";
    if (!form.categoryId) e.categoryId = "Vui lòng chọn danh mục";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        description: form.description.trim() || null,
        tags: form.tags,
        images: images.filter((img) => img.imageUrl).map((img) => ({
          imageUrl: img.imageUrl, isPrimary: img.isPrimary, sortOrder: img.sortOrder,
        })),
      };

      let productId;
      if (isEdit) {
        const res = await adminProductApi.updateProduct(id, payload);
        productId = res.data.id;
      } else {
        const res = await adminProductApi.createProduct(payload);
        productId = res.data.id;
      }

      for (const v of variants) {
        const vp = {
          flavorId: v.flavorId ? Number(v.flavorId) : null,
          sizeId: v.sizeId ? Number(v.sizeId) : null,
          originalPrice: Number(v.originalPrice),
          salePrice: Number(v.salePrice),
          stockQty: Number(v.stockQty),
          weightGram: Number(v.weightGram) || 500,
          sortOrder: Number(v.sortOrder) || 0,
          isActive: v.isActive !== false,
        };
        if (v.id) await adminProductApi.updateVariant(v.id, vp);
        else await adminProductApi.createVariant(productId, vp);
      }

      navigate("/admin/products");
    } catch (err) {
      alert(err?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingMeta) return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Đang tải...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/admin/products")} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <span className="h-5 w-5 block">{icons.arrowLeft}</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left col ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Thông tin cơ bản */}
          <SectionCard title="Thông tin cơ bản">
            <div className="space-y-4">
              <FormField label="Tên sản phẩm" required error={errors.name}>
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`${inputCls} ${errors.name ? "border-red-400" : ""}`}
                  placeholder="Ví dụ: Nước ép cam tươi" />
              </FormField>

              <FormField label="Danh mục" required error={errors.categoryId}>
                <select value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className={`${inputCls} ${errors.categoryId ? "border-red-400" : ""}`}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>

              <FormField label="Mô tả sản phẩm">
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Ảnh sản phẩm */}
          <SectionCard title="Ảnh sản phẩm">
            <ImageDropZone
              images={images}
              onFiles={handleFiles}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDeleteImage}
              uploading={uploading}
            />
          </SectionCard>

          {/* Biến thể */}
          <SectionCard title="Biến thể sản phẩm">
            <div className="space-y-3">
              {variants.length === 0 && (
                <p className="text-sm text-gray-400">Chưa có biến thể nào. Thêm ít nhất 1 biến thể.</p>
              )}
              {variants.map((v, idx) => (
                <VariantRow key={idx} index={idx} variant={v} flavors={flavors} sizes={sizes}
                  onChange={updateVariant} onDelete={deleteVariant} />
              ))}
              <button type="button" onClick={addVariant}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 hover:border-green-400 hover:text-green-600">
                <span className="h-4 w-4">{icons.plus}</span>
                Thêm biến thể
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ── Right col ── */}
        <div className="space-y-5">

          {/* Tags */}
          <SectionCard title="Tags">
            {/* Danh sách tag để chọn */}
            <div className="flex flex-wrap gap-2 mb-3">
              {availableTags.filter(t => t.isActive).map((tag) => (
                <button key={tag.id} type="button"
                  onClick={() => setForm((f) => ({
                    ...f,
                    tags: f.tags.includes(tag.name)
                      ? f.tags.filter((t) => t !== tag.name)
                      : [...f.tags, tag.name],
                  }))}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition
          ${form.tags.includes(tag.name)
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {tag.name}
                </button>
              ))}
              {availableTags.filter(t => t.isActive).length === 0 && (
                <p className="text-xs text-gray-400">Chưa có tag nào.</p>
              )}
            </div>

            {/* Quản lý tag — thêm/xóa */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quản lý tag</p>

              <div className="space-y-1 max-h-36 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5">
                    <span className={`flex-1 text-xs ${!tag.isActive ? "text-gray-300 line-through" : "text-gray-700"}`}>
                      {tag.name}
                    </span>
                    <button type="button"
                      onClick={async () => { await adminProductApi.toggleTag(tag.id); reloadTags(); }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium
              ${tag.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                    >
                      {tag.isActive ? "ON" : "OFF"}
                    </button>
                    <button type="button"
                      onClick={async () => {
                        if (!window.confirm(`Xoá tag "${tag.name}"?`)) return;
                        await adminProductApi.deleteTag(tag.id);
                        reloadTags();
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <span className="h-3.5 w-3.5 block">{icons.trash}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Thêm tag mới */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  placeholder="Tên tag mới..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-green-500 focus:outline-none"
                />
                <button type="button"
                  disabled={!newTagName.trim()}
                  onClick={async () => {
                    try {
                      await adminProductApi.createTag(newTagName.trim());
                      setNewTagName("");
                      reloadTags();
                    } catch (err) {
                      alert(err?.response?.data?.message || "Tag đã tồn tại");
                    }
                  }}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
                >
                  Thêm
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Flavors */}
          <SectionCard title="Hương vị (Flavors)">
            <InlineList
              title="Flavor"
              items={flavors}
              onCreate={flavorHandlers.onCreate}
              onUpdate={flavorHandlers.onUpdate}
              onToggle={flavorHandlers.onToggle}
              onDelete={flavorHandlers.onDelete}
            />
          </SectionCard>

          {/* Sizes */}
          <SectionCard title="Kích cỡ (Sizes)">
            <InlineList
              title="Size"
              items={sizes}
              onCreate={sizeHandlers.onCreate}
              onUpdate={sizeHandlers.onUpdate}
              onToggle={sizeHandlers.onToggle}
              onDelete={sizeHandlers.onDelete}
            />
          </SectionCard>

          {/* Submit */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <button type="submit" disabled={saving || uploading}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </button>
            <button type="button" onClick={() => navigate("/admin/products")}
              className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Huỷ
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}