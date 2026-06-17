import { useState, useCallback, useEffect, useRef } from "react";
import StarRatingInput from "./StarRatingInput";
import reviewApi from "@/api/reviewApi";
import { uploadImage } from "@/api/cloudinaryApi";
import useCartStore from "@/store/useCartStore";

/* ── Helpers ── */
function Overlay({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", animation: "rv-fadeIn 0.2s ease" }}
    />
  );
}

function itemKey(item) {
  return `${item.productId}:${item.variantId ?? ""}`;
}

function buildInitialStates(items) {
  const map = {};
  for (const it of items) {
    map[itemKey(it)] = {
      rating: 0,
      comment: "",
      imageFile: null,
      imagePreview: null,
      uploading: false,
      status: "idle",   // "idle" | "submitting" | "done" | "error"
      errorMsg: null,
    };
  }
  return map;
}

/* ── Image Upload Area ── */
function ImageUploadArea({ imageFile, imagePreview, onSelect, onRemove, uploading }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
        Ảnh minh hoạ <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(tuỳ chọn)</span>
      </p>

      {imagePreview ? (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="preview"
            className="w-20 h-20 object-cover rounded-[var(--radius-md)]"
            style={{ border: "1px solid var(--color-border-subtle)" }}
          />
          {uploading && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)]"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                strokeLinecap="round" style={{ animation: "rv-spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          )}
          {!uploading && (
            <button
              onClick={onRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-white"
              style={{ background: "#ef4444", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
              title="Xoá ảnh"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-[var(--radius-md)] cursor-pointer transition-colors"
          style={{
            border: "1.5px dashed var(--color-border-subtle)",
            background: "var(--color-bg-muted)",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-subtle)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-muted)" }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Nhấn hoặc kéo thả ảnh vào đây
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)", opacity: 0.7 }}>
            JPG, PNG, WebP · Tối đa 5MB
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ── ReviewItemCard ── */
function ReviewItemCard({ item, state, onChange }) {
  const { rating, comment, imageFile, imagePreview, uploading, status, errorMsg } = state;
  const isDone = status === "done";

  const handleSelectImage = (file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      onChange({ errorMsg: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onChange({ errorMsg: "Ảnh không được vượt quá 5MB" });
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    onChange({ errorMsg: null, imageFile: file, imagePreview: URL.createObjectURL(file) });
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    onChange({ imageFile: null, imagePreview: null });
  };

  return (
    <div
      className="rounded-[var(--radius-md)] transition-all"
      style={{
        border: "1px solid var(--color-border-subtle)",
        background: isDone ? "var(--color-bg-muted)" : "var(--color-bg-elevated)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-11 h-11 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
            style={{ border: "1px solid var(--color-border-subtle)", opacity: isDone ? 0.7 : 1 }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
            {item.productName}
          </p>
          {item.variantName && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.variantName}</p>
          )}
        </div>
        {isDone && (
          <span className="flex items-center gap-1 text-xs font-medium flex-shrink-0" style={{ color: "#16a34a" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã gửi
          </span>
        )}
      </div>

      {!isDone && (
        <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="pt-3">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Chất lượng sản phẩm
            </p>
            <StarRatingInput value={rating} onChange={(v) => onChange({ rating: v, errorMsg: null })} />
          </div>

          <textarea
            value={comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] resize-none transition-colors"
            style={{
              border: "1px solid var(--color-border-subtle)",
              background: "var(--color-bg-muted)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
            onBlur={e => e.currentTarget.style.borderColor = "var(--color-border-subtle)"}
          />

          <ImageUploadArea
            imageFile={imageFile}
            imagePreview={imagePreview}
            onSelect={handleSelectImage}
            onRemove={handleRemoveImage}
            uploading={uploading}
          />

          {status === "submitting" && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" style={{ animation: "rv-spin 0.8s linear infinite", flexShrink: 0 }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {uploading ? "Đang tải ảnh lên..." : "Đang gửi đánh giá..."}
            </p>
          )}

          {errorMsg && (
            <p
              className="text-xs px-3 py-2 rounded-[var(--radius-md)]"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              {errorMsg}
            </p>
          )}

          {!errorMsg && status === "idle" && rating === 0 && (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Bỏ qua nếu bạn chưa muốn đánh giá sản phẩm này.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── SuccessScreen ── */
function SuccessScreen({ items, onClose }) {
  const { addItem } = useCartStore();
  const [addingKey, setAddingKey] = useState(null);

  const handleRebuy = async (item) => {
    if (!item?.productId || !item?.variantId) return;
    try {
      setAddingKey(itemKey(item));
      await addItem(item.productId, item.variantId, item.quantity ?? 1);
      window.dispatchEvent(new CustomEvent("cart:item-added", {
        detail: { imageUrl: item.imageUrl ?? null },
      }));
    } catch {
    } finally {
      setAddingKey(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-8" style={{ animation: "rv-fadeIn 0.35s ease" }}>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          position: "absolute", width: 72, height: 72, borderRadius: "50%",
          background: "#dcfce7",
          animation: "rv-ripple 1.2s ease-out 0.1s both",
        }} />
        <div style={{
          position: "relative", width: 60, height: 60, borderRadius: "50%",
          background: "#16a34a",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "rv-circleIn 0.4s cubic-bezier(0.34,1.3,0.64,1) both",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline className="rv-check" points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <div className="text-center flex flex-col gap-1.5">
        <p className="text-base font-bold" style={{ color: "#16a34a" }}>
          Cảm ơn bạn đã đánh giá{items.length > 1 ? ` ${items.length} sản phẩm` : ""}!
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Đánh giá sẽ hiển thị sau khi được kiểm duyệt.<br />
          Ý kiến của bạn giúp chúng tôi cải thiện sản phẩm.
        </p>
      </div>

      <div className="w-full flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 220 }}>
        {items.map((item) => (
          <div
            key={itemKey(item)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)]"
            style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border-subtle)" }}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-12 h-12 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
                style={{ border: "1px solid var(--color-border-subtle)" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                {item.productName}
              </p>
              {item.variantName && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.variantName}</p>
              )}
            </div>
            {item.productId && item.variantId && (
              <button
                onClick={() => handleRebuy(item)}
                disabled={addingKey === itemKey(item)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-[var(--radius-pill)] flex-shrink-0
                  disabled:opacity-50 transition-colors"
                style={{ background: "var(--color-primary-subtle)", color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}
              >
                {addingKey === itemKey(item) ? "Đang thêm..." : "Mua lại"}
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-[var(--radius-pill)] text-sm font-medium transition-colors"
        style={{
          background: "var(--color-bg-muted)",
          border: "1px solid var(--color-border-subtle)",
          color: "var(--color-text-secondary)",
        }}
      >
        Đóng
      </button>
    </div>
  );
}

/* ── Main Popup ── */
export default function ReviewFormPopup({ items: itemsProp, onClose, onSuccess }) {
  // ✅ FIX 1: Đóng băng danh sách items ngay khi mount — không bao giờ để prop
  //    thay đổi từ parent làm reset state nội bộ.
  const frozenItems = useRef(itemsProp);
  const items = frozenItems.current;
  const doneItemsRef = useRef([])


  const [itemStates, setItemStates] = useState(() => buildInitialStates(items));
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState(null);
  const [allDone, setAllDone] = useState(false);

  // Giữ ref để dọn dẹp URL.createObjectURL khi unmount
  const itemStatesRef = useRef(itemStates);
  useEffect(() => { itemStatesRef.current = itemStates; }, [itemStates]);

  // Giữ ref callback để tránh stale closure trong handleSubmit
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !allDone) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, allDone]);

  useEffect(() => {
    return () => {
      Object.values(itemStatesRef.current).forEach((s) => {
        if (s.imagePreview) URL.revokeObjectURL(s.imagePreview);
      });
    };
  }, []);

  const updateItemState = useCallback((key, patch) => {
    setItemStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const pendingRatedCount = items.filter((it) => {
    const s = itemStates[itemKey(it)];
    return s.status !== "done" && s.rating > 0;
  }).length;

  const handleSubmit = async () => {
    setTopError(null);

    const targets = items.filter((it) => {
      const s = itemStates[itemKey(it)];
      return s.status !== "done" && s.rating > 0;
    });

    if (targets.length === 0) {
      setTopError("Vui lòng chọn số sao cho ít nhất 1 sản phẩm bạn muốn đánh giá");
      return;
    }

    setSubmitting(true);
    let anyError = false;

    for (const it of targets) {
      const key = itemKey(it);
      // Đọc state mới nhất từ ref để tránh stale closure
      const s = itemStatesRef.current[key];
      updateItemState(key, { status: "submitting", errorMsg: null });

      let imageUrl = null;
      if (s.imageFile) {
        updateItemState(key, { uploading: true });
        try {
          imageUrl = await uploadImage(s.imageFile, "reviews");
        } catch {
          updateItemState(key, { status: "error", uploading: false, errorMsg: "Upload ảnh thất bại, vui lòng thử lại" });
          anyError = true;
          continue;
        }
        updateItemState(key, { uploading: false });
      }

      try {
        await reviewApi.createReview({
          productId: it.productId,
          orderId: it.orderId,
          rating: s.rating,
          comment: s.comment.trim() || null,
          imageUrl,
        });
        updateItemState(key, { status: "done" });
      } catch (err) {
        updateItemState(key, {
          status: "error",
          errorMsg: err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại",
        });
        anyError = true;
      }
    }

    setSubmitting(false);

    const justDone = items.filter(
      (it) => itemStatesRef.current[itemKey(it)]?.status === "done"
    )
    if (!anyError) {
      doneItemsRef.current = justDone  // ✅ snapshot trước khi set
      setAllDone(true)
      setTimeout(() => { onSuccessRef.current?.(justDone) }, 0)
    }
  };

  // items để hiện trong SuccessScreen: lấy từ danh sách đóng băng + lọc theo status done
  const doneItems = items.filter((it) => itemStates[itemKey(it)]?.status === "done")

  return (
    <>
      <Overlay onClick={allDone ? undefined : onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md rounded-[var(--radius-lg)] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
          style={{
            background: "var(--color-bg-elevated)",
            maxHeight: "85vh",
            animation: "rv-slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {allDone ? "Đánh giá thành công" : "Đánh giá sản phẩm"}
              </p>
              {!allDone && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {items.length} sản phẩm cần đánh giá
                </p>
              )}
            </div>

            {!allDone && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-colors cursor-pointer"
                style={{ background: "var(--color-bg-muted)", color: "var(--color-text-secondary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-border-subtle)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--color-bg-muted)"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Body */}
          {allDone ? (
            <div className="overflow-y-auto">
              <SuccessScreen items={doneItems} onClose={onClose} />
            </div>
          ) : (
            <>
              <div
                className="px-5 py-4 flex flex-col gap-3 overflow-y-auto"
                style={{ opacity: submitting ? 0.7 : 1, pointerEvents: submitting ? "none" : "auto" }}
              >
                {items.map((it) => (
                  <ReviewItemCard
                    key={itemKey(it)}
                    item={it}
                    state={itemStates[itemKey(it)]}
                    onChange={(patch) => updateItemState(itemKey(it), patch)}
                  />
                ))}

                {topError && (
                  <p
                    className="text-xs px-3 py-2 rounded-[var(--radius-md)]"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                  >
                    {topError}
                  </p>
                )}

                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Đánh giá sẽ hiển thị sau khi được kiểm duyệt.
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-[var(--radius-pill)] text-sm font-medium cursor-pointer transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--color-bg-muted)",
                    border: "1px solid var(--color-border-subtle)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Đóng
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || pendingRatedCount === 0}
                  className="flex-1 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold text-white
                    disabled:opacity-40 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                >
                  {submitting ? "Đang gửi..." : `Gửi đánh giá${pendingRatedCount > 0 ? ` (${pendingRatedCount})` : ""}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rv-fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rv-slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
        }
        @keyframes rv-ripple {
          0%   { transform: scale(0.8); opacity: 0.4 }
          100% { transform: scale(2.2); opacity: 0   }
        }
        @keyframes rv-circleIn {
          from { transform: scale(0) }
          to   { transform: scale(1) }
        }
        @keyframes rv-spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
        .rv-check {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: rv-checkDraw 0.4s ease 0.3s forwards;
        }
        @keyframes rv-checkDraw {
          from { stroke-dashoffset: 60 }
          to   { stroke-dashoffset: 0  }
        }
      `}</style>
    </>
  );
}