import { useEffect, useState, useRef, useCallback } from "react";
import adminPromotionApi from "@/api/adminPromotionApi";
import adminUserApi from "@/api/adminUserApi";

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
};

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ background: checked ? "#16a34a" : "#d1d5db" }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = (error) =>
  `w-full h-9 rounded-lg border px-3 text-sm focus:outline-none transition-colors ${
    error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-green-500"
  }`;

// ── User Search Combobox ──────────────────────────────────────────────────────
function UserSearchCombobox({ value, onChange, error }) {
  // value = { id, name, phone, email, username } | null
  const [inputVal, setInputVal]     = useState("");
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const debounceRef                 = useRef(null);
  const wrapRef                     = useRef(null);

  // Khi edit: hiển thị thông tin user đã chọn
  useEffect(() => {
    if (value) {
      setInputVal(value.phone || value.email || value.username || `#${value.id}`);
    } else {
      setInputVal("");
    }
  }, [value]);

  // Click outside → đóng dropdown
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    adminUserApi
      .getUsers({ keyword: q.trim(), role: "CUSTOMER", size: 8 })
      .then((res) => {
        setResults(res.data.content || []);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setInputVal(q);
    // Nếu user đang gõ lại → clear selection
    if (value) onChange(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (u) => {
    onChange(u);
    setInputVal(u.phone || u.email || u.username || `#${u.id}`);
    setOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onChange(null);
    setInputVal("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Input */}
      <div className={`flex h-9 items-center gap-2 rounded-lg border px-3 transition-colors ${
        error ? "border-red-400" : open ? "border-green-500 ring-1 ring-green-200" : "border-gray-200"
      } ${value ? "bg-green-50" : "bg-white"}`}>
        <span className="h-4 w-4 shrink-0 text-gray-400">{icons.search}</span>
        <input
          type="text"
          value={inputVal}
          onChange={handleInput}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Gõ SĐT, email hoặc tên..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
        />
        {loading && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin shrink-0" />
        )}
        {value && !loading && (
          <button onClick={handleClear} className="h-3.5 w-3.5 shrink-0 text-gray-400 hover:text-gray-600">
            {icons.x}
          </button>
        )}
      </div>

      {/* Selected user chip */}
      {value && (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
            <span className="h-4 w-4">{icons.user}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{value.name || "—"}</p>
            <p className="text-xs text-gray-500 truncate">
              {[value.phone, value.email, value.username ? `@${value.username}` : null]
                .filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className="h-4 w-4 shrink-0 text-green-600">{icons.check}</span>
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {(u.name || u.phone || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name || "—"}</p>
                <p className="text-xs text-gray-400 truncate">
                  {[u.phone, u.email, u.username ? `@${u.username}` : null]
                    .filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-xs text-gray-300 shrink-0">#{u.id}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && !loading && results.length === 0 && inputVal.trim() && (
        <div className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-gray-200 bg-white shadow-lg px-4 py-3">
          <p className="text-sm text-gray-400">Không tìm thấy khách hàng nào</p>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  code: "", name: "", type: "PERCENT", value: "",
  minOrderValue: "", freeShipping: false,
  target: "PUBLIC", selectedUser: null,
  maxUses: "", maxUsesPerUser: "",
  startsAt: "", endsAt: "", isActive: true,
};

function toLocalDatetimeValue(iso) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function toISOLike(local) {
  if (!local) return null;
  return local + ":00";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PromotionFormModal({ editTarget, onClose, onSaved }) {
  const isEdit = !!editTarget;
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTarget) {
      setForm({
        code:         editTarget.code ?? "",
        name:         editTarget.name ?? "",
        type:         editTarget.type ?? "PERCENT",
        value:        editTarget.value != null ? String(editTarget.value) : "",
        minOrderValue:editTarget.minOrderValue != null ? String(editTarget.minOrderValue) : "",
        freeShipping: editTarget.freeShipping ?? false,
        target:       editTarget.target ?? "PUBLIC",
        // Khi edit, dựng object user từ dữ liệu có sẵn trong response
        selectedUser: editTarget.targetUserId
          ? { id: editTarget.targetUserId, name: editTarget.targetUserName, phone: editTarget.targetUserPhone }
          : null,
        maxUses:      editTarget.maxUses != null ? String(editTarget.maxUses) : "",
        maxUsesPerUser: editTarget.maxUsesPerUser != null ? String(editTarget.maxUsesPerUser) : "",
        startsAt:     toLocalDatetimeValue(editTarget.startsAt),
        endsAt:       toLocalDatetimeValue(editTarget.endsAt),
        isActive:     editTarget.isActive ?? true,
      });
    }
  }, [editTarget]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Không được để trống";
    else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) e.code = "Chỉ gồm chữ, số, _ hoặc -";
    if (!form.name.trim()) e.name = "Không được để trống";
    const val = parseFloat(form.value);
    if (!form.value || isNaN(val) || val <= 0) e.value = "Phải > 0";
    else if (form.type === "PERCENT" && val > 100) e.value = "Không vượt quá 100%";
    if (!form.startsAt) e.startsAt = "Chọn thời gian bắt đầu";
    if (!form.endsAt)   e.endsAt   = "Chọn thời gian kết thúc";
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt) e.endsAt = "Phải sau thời gian bắt đầu";
    if (form.target === "PERSONAL" && !form.selectedUser) e.selectedUser = "Chọn khách hàng";
    if (form.maxUses && form.maxUsesPerUser) {
      if (parseInt(form.maxUsesPerUser) > parseInt(form.maxUses)) e.maxUsesPerUser = "Không vượt tổng lượt";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      code:           form.code.trim().toUpperCase(),
      name:           form.name.trim(),
      type:           form.type,
      value:          parseFloat(form.value),
      minOrderValue:  form.minOrderValue ? parseFloat(form.minOrderValue) : 0,
      freeShipping:   form.freeShipping,
      target:         form.target,
      userId:         form.target === "PERSONAL" && form.selectedUser ? form.selectedUser.id : null,
      maxUses:        form.maxUses ? parseInt(form.maxUses) : null,
      maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null,
      startsAt:       toISOLike(form.startsAt),
      endsAt:         toISOLike(form.endsAt),
      isActive:       form.isActive,
    };
    try {
      if (isEdit) {
        await adminPromotionApi.updatePromotion(editTarget.id, payload);
      } else {
        await adminPromotionApi.createPromotion(payload);
      }
      onSaved();
    } catch (err) {
      const msg = err?.response?.data?.message || "Có lỗi xảy ra";
      setErrors({ _global: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleBackdrop}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Chỉnh sửa mã khuyến mãi" : "Thêm mã khuyến mãi"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
            <span className="h-4 w-4 block">{icons.x}</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1 px-6 py-5 space-y-4">
          {errors._global && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg">
              <span className="h-4 w-4 flex-shrink-0">{icons.info}</span>
              {errors._global}
            </div>
          )}

          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã khuyến mãi *" error={errors.code}>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="VD: SUMMER20"
                className={inputCls(errors.code)}
                maxLength={50}
              />
            </Field>
            <Field label="Tên chương trình *" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Giảm giá hè 2026"
                className={inputCls(errors.name)}
              />
            </Field>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Loại giảm giá *">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls()}>
                <option value="PERCENT">Theo % (PERCENT)</option>
                <option value="FIXED">Số tiền cố định (FIXED)</option>
              </select>
            </Field>
            <Field label={form.type === "PERCENT" ? "Giá trị giảm (%) *" : "Số tiền giảm (đ) *"} error={errors.value}>
              <input
                type="number" value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "PERCENT" ? "VD: 20" : "VD: 30000"}
                min="0.01" step="any"
                className={inputCls(errors.value)}
              />
            </Field>
          </div>

          {/* Min order + Free shipping */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Đơn tối thiểu (đ)">
              <input
                type="number" value={form.minOrderValue}
                onChange={(e) => set("minOrderValue", e.target.value)}
                placeholder="0 = không yêu cầu"
                min="0" className={inputCls()}
              />
            </Field>
            <div className="flex items-center gap-3 pb-0.5">
              <Toggle checked={form.freeShipping} onChange={() => set("freeShipping", !form.freeShipping)} />
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 inline-block text-blue-500">{icons.truck}</span>
                  Miễn phí ship
                </p>
                <p className="text-xs text-gray-400">Áp dụng khi dùng mã này</p>
              </div>
            </div>
          </div>

          {/* Target */}
          <Field label="Đối tượng áp dụng *">
            <div className="flex gap-3">
              {[
                { value: "PUBLIC",   label: "Công khai", desc: "Tất cả người dùng" },
                { value: "PERSONAL", label: "Cá nhân",   desc: "Chỉ 1 khách cụ thể" },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex-1 flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-colors ${
                    form.target === opt.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input type="radio" name="target" value={opt.value}
                    checked={form.target === opt.value}
                    onChange={() => { set("target", opt.value); set("selectedUser", null); }}
                    className="mt-0.5 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Field>

          {/* User search — chỉ hiện khi PERSONAL */}
          {form.target === "PERSONAL" && (
            <Field label="Khách hàng *" error={errors.selectedUser}
              hint="Gõ SĐT, email hoặc tên để tìm kiếm">
              <UserSearchCombobox
                value={form.selectedUser}
                onChange={(u) => set("selectedUser", u)}
                error={errors.selectedUser}
              />
            </Field>
          )}

          {/* Max uses */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tổng lượt dùng" error={errors.maxUses} hint="Để trống = không giới hạn">
              <input type="number" value={form.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                placeholder="Không giới hạn" min="1"
                className={inputCls(errors.maxUses)}
              />
            </Field>
            <Field label="Tối đa / user" error={errors.maxUsesPerUser} hint="Để trống = không giới hạn">
              <input type="number" value={form.maxUsesPerUser}
                onChange={(e) => set("maxUsesPerUser", e.target.value)}
                placeholder="Không giới hạn" min="1"
                className={inputCls(errors.maxUsesPerUser)}
              />
            </Field>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bắt đầu *" error={errors.startsAt}>
              <input type="datetime-local" value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                className={inputCls(errors.startsAt)}
              />
            </Field>
            <Field label="Kết thúc *" error={errors.endsAt}>
              <input type="datetime-local" value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
                className={inputCls(errors.endsAt)}
              />
            </Field>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
            <p className="text-sm font-medium text-gray-700">
              {form.isActive ? "Mã đang được kích hoạt" : "Mã đang bị tắt"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
            {saving && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
            )}
            {isEdit ? "Lưu thay đổi" : "Tạo mã"}
          </button>
        </div>
      </div>
    </div>
  );
}