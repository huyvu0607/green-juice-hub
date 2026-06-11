import { useState, useEffect, useRef } from "react";
import StarRatingInput from "./StarRatingInput";
import reviewApi from "@/api/reviewApi";
import { uploadImage } from "@/api/cloudinaryApi";
import useCartStore from "@/store/useCartStore";
import { useNavigate } from "react-router-dom";

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
        /* Preview */
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="preview"
            className="w-20 h-20 object-cover rounded-[var(--radius-md)]"
            style={{ border: "1px solid var(--color-border-subtle)" }}
          />
          {/* Uploading spinner overlay */}
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
          {/* Remove button */}
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
        /* Drop zone */
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
          e.target.value = ""; // reset để chọn lại cùng file
        }}
      />
    </div>
  );
}

/* ── Success Screen ── */
function SuccessScreen({ item, onClose }) {
  const navigate   = useNavigate();
  const { addItem } = useCartStore();
  const [adding, setAdding] = useState(false);

  const handleRebuy = async () => {
    if (!item?.productId || !item?.variantId) return;
    try {
      setAdding(true);
      await addItem(item.productId, item.variantId, item.quantity ?? 1);
      window.dispatchEvent(new CustomEvent("cart:item-added", {
        detail: { imageUrl: item.imageUrl ?? null },
      }));
      onClose();
      navigate("/checkout");
    } catch {
      // cart store tự handle error
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-8" style={{ animation: "rv-fadeIn 0.35s ease" }}>
      {/* Checkmark */}
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

      {/* Text */}
      <div className="text-center flex flex-col gap-1.5">
        <p className="text-base font-bold" style={{ color: "#16a34a" }}>Cảm ơn bạn đã đánh giá!</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Đánh giá sẽ hiển thị sau khi được kiểm duyệt.<br />
          Ý kiến của bạn giúp chúng tôi cải thiện sản phẩm.
        </p>
      </div>

      {/* Product rebuy card */}
      {item && (
        <div
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
        </div>
      )}

      {/* Actions */}
      <div className="w-full flex flex-col gap-2">
        {item?.productId && item?.variantId && (
          <button
            onClick={handleRebuy}
            disabled={adding}
            className="w-full py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold text-white
              disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--color-primary)" }}
          >
            {adding ? "Đang thêm vào giỏ..." : "🛒 Mua lại sản phẩm"}
          </button>
        )}
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
    </div>
  );
}

/* ── Main Popup ── */
/**
 * Props:
 *   item: {
 *     productId, variantId, orderId,
 *     productName, variantName, imageUrl,
 *     quantity
 *   }
 *   onClose: () => void
 *   onSuccess?: () => void
 */
export default function ReviewFormPopup({ item, onClose, onSuccess }) {
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState("");
  const [imageFile,    setImageFile]    = useState(null);   // File object
  const [imagePreview, setImagePreview] = useState(null);   // blob URL
  const [uploading,    setUploading]    = useState(false);  // đang upload lên Cloudinary
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);
  const [done,         setDone]         = useState(false);

  /* Khoá scroll body khi popup mở */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Đóng bằng Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Cleanup blob URL khi unmount */
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleSelectImage = (file) => {
    // Validate loại file
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP");
      return;
    }
    // Validate dung lượng (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError("Vui lòng chọn số sao"); return; }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Upload ảnh lên Cloudinary nếu có
      let imageUrl = null;
      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile, "reviews");
        } catch {
          setError("Upload ảnh thất bại, vui lòng thử lại");
          return;
        } finally {
          setUploading(false);
        }
      }

      // 2. Gửi review lên backend (imageUrl là URL string hoặc null)
      await reviewApi.createReview({
        productId: item.productId,
        orderId:   item.orderId,
        rating,
        comment:   comment.trim() || null,
        imageUrl,
      });

      onSuccess?.();
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || uploading;

  return (
    <>
      <Overlay onClick={done ? undefined : onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-sm rounded-[var(--radius-lg)] overflow-hidden shadow-2xl pointer-events-auto"
          style={{
            background: "var(--color-bg-elevated)",
            animation: "rv-slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex items-center gap-2.5">
              {item?.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-9 h-9 rounded-[var(--radius-sm)] object-cover flex-shrink-0"
                  style={{ border: "1px solid var(--color-border-subtle)" }}
                />
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {done ? "Đánh giá thành công" : "Đánh giá sản phẩm"}
                </p>
                {!done && item?.productName && (
                  <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "var(--color-text-muted)" }}>
                    {item.productName}
                  </p>
                )}
              </div>
            </div>

            {!done && (
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

          {/* ── Body ── */}
          {done ? (
            <SuccessScreen item={item} onClose={onClose} />
          ) : (
            <div className="px-5 py-5 flex flex-col gap-4">

              {/* Stars */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Chất lượng sản phẩm
                </p>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Nhận xét <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(tuỳ chọn)</span>
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] resize-none transition-colors"
                  style={{
                    border: "1px solid var(--color-border-subtle)",
                    background: "var(--color-bg-muted)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--color-border-subtle)"}
                />
              </div>

              {/* Image Upload */}
              <ImageUploadArea
                imageFile={imageFile}
                imagePreview={imagePreview}
                onSelect={handleSelectImage}
                onRemove={handleRemoveImage}
                uploading={uploading}
              />

              {/* Upload progress note */}
              {uploading && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" style={{ animation: "rv-spin 0.8s linear infinite", flexShrink: 0 }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Đang tải ảnh lên...
                </p>
              )}

              {/* Error */}
              {error && (
                <p
                  className="text-xs px-3 py-2 rounded-[var(--radius-md)]"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  {error}
                </p>
              )}

              {/* Note */}
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Đánh giá sẽ hiển thị sau khi được kiểm duyệt.
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  disabled={isBusy}
                  className="flex-1 py-2.5 rounded-[var(--radius-pill)] text-sm font-medium cursor-pointer transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--color-bg-muted)",
                    border: "1px solid var(--color-border-subtle)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isBusy || rating === 0}
                  className="flex-1 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold text-white
                    disabled:opacity-40 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  style={{ background: "var(--color-primary)" }}
                >
                  {uploading ? "Đang tải ảnh..." : submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
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