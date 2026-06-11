import { useState } from "react";
import StarRatingInput from "./StarRatingInput";
import reviewApi from "@/api/reviewApi";

export default function ReviewForm({ productId, orderId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Vui lòng chọn số sao");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await reviewApi.createReview({ productId, orderId, rating, comment });
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 rounded-[var(--radius-lg)] border border-subtle bg-surface flex flex-col gap-4">
      <h4 className="text-sm font-semibold text-primary">Viết đánh giá của bạn</h4>

      {/* Star input */}
      <div>
        <p className="text-xs text-secondary mb-2">Đánh giá chất lượng</p>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      {/* Comment */}
      <div>
        <p className="text-xs text-secondary mb-2">Nhận xét (tuỳ chọn)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] border border-default
            bg-base text-primary placeholder:text-muted-fg resize-none
            focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius-md)]">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="self-start px-5 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold
          bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
      >
        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>

      <p className="text-xs text-muted-fg">
        Đánh giá sẽ hiển thị sau khi được kiểm duyệt.
      </p>
    </div>
  );
}