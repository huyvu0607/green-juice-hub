import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosConfig";

// ─────────────────────────────────────────────────────────
// AI Tư vấn — trang chat/form hỏi AI gợi ý sản phẩm
// Gọi API: POST /api/recommendation
// Response: { advice: string, suggestedProducts: [{ productId, name, imageUrl, slug, reason }] }
// ─────────────────────────────────────────────────────────

const AI_GRADIENT = "linear-gradient(135deg, #4285F4 0%, #9B72CB 50%, #D96570 100%)";

const SUGGESTED_PROMPTS = [
  "Tôi muốn detox cơ thể",
  "Tôi hay mất ngủ, khó tiêu",
  "Tôi muốn tăng đề kháng",
  "Tôi muốn giảm cân lành mạnh",
];

function SparkleIcon({ size = 20, gradientId = "sparkle-grad" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 L13.8 8.5 L20 10 L13.8 11.5 L12 18 L10.2 11.5 L4 10 L10.2 8.5 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M19 15 L19.6 17.2 L21.8 17.8 L19.6 18.4 L19 20.6 L18.4 18.4 L16.2 17.8 L18.4 17.2 Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: AI_GRADIENT,
            animation: `aiPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes aiPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function ProductSuggestionCard({ product, navigate }) {
  return (
    <button
      onClick={() => navigate(`/products/${product.slug}`)}
      className="group flex items-center gap-3 w-full p-3 rounded-[var(--radius-lg,16px)] text-left
                 border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]
                 hover:border-transparent transition-all duration-200"
      style={{ position: "relative" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(66,133,244,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="shrink-0 w-14 h-14 rounded-[var(--radius-md,10px)] overflow-hidden flex items-center justify-center"
        style={{ background: "var(--color-bg-muted)" }}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <SparkleIcon size={22} gradientId={`sparkle-empty-${product.productId}`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] truncate">
          {product.name}
        </p>
        <p className="text-[12px] text-[var(--color-text-muted)] line-clamp-2 mt-0.5">
          {product.reason}
        </p>
      </div>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="var(--color-text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

export default function AiConsultantPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { advice, suggestedProducts }
  const [hasAsked, setHasAsked] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const askAi = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    setHasAsked(true);
    setResult(null);

    try {
      const { data } = await api.post("/recommendation", { message: trimmed });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lấy gợi ý lúc này, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askAi(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAi(message);
    }
  };

  const handleSuggestedClick = (prompt) => {
    setMessage(prompt);
    askAi(prompt);
  };

  const handleReset = () => {
    setMessage("");
    setResult(null);
    setError(null);
    setHasAsked(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center px-4 sm:px-6 pb-28 sm:pb-16">
      <div className="w-full max-w-2xl flex-1 flex flex-col">

        {/* ── Hero (chỉ hiện khi chưa hỏi gì) ── */}
        {!hasAsked && (
          <div className="flex flex-col items-center text-center pt-14 sm:pt-20 pb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: AI_GRADIENT, boxShadow: "0 8px 24px rgba(155,114,203,0.35)" }}
            >
              <SparkleIcon size={30} gradientId="sparkle-hero-white" />
            </div>
            <h1
              className="font-display font-semibold text-[28px] sm:text-[32px] tracking-tight mb-2"
              style={{
                backgroundImage: AI_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI Tư vấn Green Juice Hub
            </h1>
            <p className="text-[var(--color-text-secondary)] text-[var(--text-sm)] max-w-md">
              Mô tả nhu cầu hoặc triệu chứng của bạn, AI sẽ gợi ý loại nước ép &amp; smoothie phù hợp nhất từ menu thật của cửa hàng.
            </p>
          </div>
        )}

        {/* ── Kết quả trò chuyện ── */}
        {hasAsked && (
          <div className="flex-1 pt-8 space-y-4">
            {/* Câu hỏi của người dùng */}
            <div className="flex justify-end">
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-[var(--radius-lg,16px)] rounded-tr-sm text-[var(--text-sm)]"
                style={{ background: "var(--color-bg-muted)", color: "var(--color-text-primary)" }}
              >
                {message}
              </div>
            </div>

            {/* Trả lời của AI */}
            <div className="flex gap-2.5">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: AI_GRADIENT }}
              >
                <SparkleIcon size={16} gradientId="sparkle-msg-white" />
              </div>

              <div className="flex-1 min-w-0">
                {isLoading && <LoadingDots />}

                {error && (
                  <div className="px-4 py-3 rounded-[var(--radius-lg,16px)] rounded-tl-sm bg-red-50 text-red-600 text-[var(--text-sm)] border border-red-100">
                    {error}
                  </div>
                )}

                {result && !isLoading && (
                  <div className="space-y-3">
                    <div
                      className="px-4 py-3 rounded-[var(--radius-lg,16px)] rounded-tl-sm text-[var(--text-sm)]"
                      style={{ background: "var(--color-bg-muted)", color: "var(--color-text-primary)" }}
                    >
                      {result.advice}
                    </div>

                    {result.suggestedProducts?.length > 0 && (
                      <div className="space-y-2">
                        {result.suggestedProducts.map((p) => (
                          <ProductSuggestionCard key={p.productId} product={p} navigate={navigate} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isLoading && (
              <div className="pt-2">
                <button
                  onClick={handleReset}
                  className="text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  ↺ Hỏi câu khác
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Gợi ý nhanh (chỉ hiện khi chưa hỏi) ── */}
        {!hasAsked && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggestedClick(prompt)}
                className="px-3.5 py-2 rounded-[var(--radius-pill)] text-[13px] font-medium
                           border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]
                           hover:border-transparent transition-all duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(0deg, var(--color-bg-base), var(--color-bg-base)) padding-box, " + AI_GRADIENT + " border-box";
                  e.currentTarget.style.border = "1px solid transparent";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.border = "1px solid var(--color-border-subtle)";
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* ── Form nhập (sticky bottom trên mobile, tĩnh trên desktop) ── */}
        <form
          onSubmit={handleSubmit}
          className="sm:relative fixed sm:bottom-auto bottom-16 left-0 right-0 sm:left-auto sm:right-auto
                     px-4 sm:px-0 pb-3 sm:pb-0 sm:mt-auto sm:pt-4"
          style={{
            background: "var(--color-bg-base)",
          }}
        >
          <div
            className="flex items-end gap-2 p-2 rounded-[var(--radius-lg,20px)] transition-all duration-200"
            style={{
              border: "1.5px solid transparent",
              backgroundImage:
                "linear-gradient(var(--color-bg-base), var(--color-bg-base)), " + AI_GRADIENT,
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              boxShadow: "0 4px 20px rgba(66,133,244,0.10)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mô tả nhu cầu của bạn, ví dụ: tôi muốn detox..."
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none text-[var(--text-sm)]
                         text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                         px-2 py-2 max-h-28"
              style={{ minHeight: 40 }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: AI_GRADIENT }}
              aria-label="Gửi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <p className="hidden sm:block text-center text-[11px] text-[var(--color-text-muted)] mt-2">
            AI có thể chưa hoàn toàn chính xác — tham khảo thêm ý kiến chuyên gia dinh dưỡng nếu cần.
          </p>
        </form>
      </div>
    </div>
  );
}