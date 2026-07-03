import { useState, useRef, useEffect, useCallback } from "react";
import RichText from "@/components/common/RichText";

/**
 * CollapsibleDescription
 * Bọc quanh RichText — tự động đo chiều cao nội dung thực tế.
 * Nếu vượt quá `maxHeight`, thu gọn lại với gradient mờ ở đáy + nút "Xem thêm".
 * Nếu nội dung ngắn hơn maxHeight thì hiển thị bình thường, không có nút.
 *
 * Props:
 *  - content: HTML string (giống RichText content)
 *  - maxHeight: chiều cao tối đa khi thu gọn (px), mặc định 300
 */
export default function CollapsibleDescription({ content, maxHeight = 300 }) {
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [measured, setMeasured] = useState(false);

  // Đo chiều cao thực tế sau khi RichText render xong
  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const fullHeight = el.scrollHeight;
    setNeedsCollapse(fullHeight > maxHeight + 1); // +1 tránh sai số làm tròn
    setMeasured(true);
  }, [maxHeight]);

  useEffect(() => {
    // Đo lần đầu
    measure();

    // Đo lại khi nội dung bên trong thay đổi kích thước (ảnh load xong, font load, v.v.)
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [content, measure]);

  const collapsed = needsCollapse && !expanded;

  return (
    <div className="flex flex-col">
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          maxHeight: collapsed ? `${maxHeight}px` : measured ? "2000px" : "none",
        }}
      >
        <div ref={contentRef}>
          <RichText content={content} />
        </div>

        {/* Gradient mờ dần ở đáy khi đang thu gọn */}
        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{
              background: "linear-gradient(to bottom, transparent, var(--color-bg-base, #fff))",
            }}
          />
        )}
      </div>

      {needsCollapse && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 self-center flex items-center gap-1.5 text-sm font-semibold
            text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
            transition-colors duration-150"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}