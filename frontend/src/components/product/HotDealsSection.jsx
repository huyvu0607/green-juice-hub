import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronRight, Flame } from "lucide-react";
import { getProducts, getDealCategories } from "@/api/productApi";
import ProductCard, { ProductCardSkeleton } from "@/components/product/ProductCard";

const DEAL_SIZE = 10;
const CARD_GAP = 12; // px, phải khớp với gap-3 (12px) bên dưới

/* ── Category chip cuộn ngang ── */
function CategoryScroller({ categories, activeId, onSelect }) {
    const scrollerRef = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const checkArrows = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        checkArrows();
        const el = scrollerRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkArrows, { passive: true });
        window.addEventListener("resize", checkArrows);
        return () => {
            el.removeEventListener("scroll", checkArrows);
            window.removeEventListener("resize", checkArrows);
        };
    }, [checkArrows, categories]);

    const scrollBy = (dir) => {
        scrollerRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
    };

    if (categories.length === 0) return null;

    return (
        <div className="relative flex items-center">
            {canLeft && (
                <button
                    onClick={() => scrollBy(-1)}
                    className="absolute left-0 z-10 w-7 h-7 rounded-full
                     bg-[var(--color-bg-surface)] shadow-md
                     border border-[var(--color-primary)]/30 flex items-center justify-center
                     text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                    aria-label="Cuộn trái"
                >
                    <ChevronRight size={14} className="rotate-180" />
                </button>
            )}

            <div
                ref={scrollerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none px-1 py-1"
                style={{ scrollPaddingLeft: canLeft ? 32 : 0 }}
            >
                <button
                    onClick={() => onSelect(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                      ${activeId === null
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                            : "bg-[var(--color-bg-surface)] border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
                        }`}
                >
                    Tất cả
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => onSelect(c.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap
                        ${activeId === c.id
                                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                : "bg-[var(--color-bg-surface)] border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
                            }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {canRight && (
                <button
                    onClick={() => scrollBy(1)}
                    className="absolute right-0 z-10 w-7 h-7 rounded-full
                     bg-[var(--color-bg-surface)] shadow-md
                     border border-[var(--color-primary)]/30 flex items-center justify-center
                     text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                    aria-label="Cuộn phải"
                >
                    <ChevronRight size={14} />
                </button>
            )}
        </div>
    );
}

/* ── Hàng sản phẩm: auto-scroll phải → trái + kéo tay (drag/swipe) ──
   LƯU Ý QUAN TRỌNG VỀ WIDTH:
   Track bên trong dùng class "w-max" (width: max-content) để nhân đôi danh sách
   và scroll mượt bằng transform. Vì vậy KHÔNG được set width của từng card bằng
   % (vd calc(100%/visibleCount)) — điều đó tạo ra vòng lặp phụ thuộc kích thước
   (track chờ card để biết width, card lại chờ track để tính %), khiến trình
   duyệt không giải được và width card bị collapse, ảnh bên trong ProductCard
   phình to theo kích thước gốc.

   Giải pháp: đo chiều rộng container (div overflow-hidden, có width thật theo
   layout cha) bằng ResizeObserver, tự tính ra cardWidth dạng PX cụ thể.

   LƯU Ý VỀ visibleCount RESPONSIVE:
   Tự suy ra số card hiển thị dựa trên clientWidth vừa đo được, mô phỏng lại các
   breakpoint Tailwind (sm/md/lg/xl) đang dùng ở lưới sản phẩm chính, để card
   Deal sốc luôn có tỉ lệ tương đồng dù ở màn hình nào (tránh card bị "bự" trên
   desktop khi chia cho một số cố định nhỏ).

   LƯU Ý VỀ KÉO TAY (DRAG):
   Dùng Pointer Events (pointerdown/move/up) để gộp chung xử lý cho cả chuột và
   cảm ứng. Khi kéo: tạm dừng auto-scroll, tính vị trí mới theo khoảng cách kéo,
   và "gói" vị trí (modulo) trong khoảng [0, maxScroll) để khớp với cơ chế loop
   vô hạn (danh sách đã nhân đôi). Dùng touchAction: "pan-y" để trình duyệt vẫn
   cho phép cuộn dọc trang bình thường, chỉ có kéo ngang mới bị JS chặn lại. */
function getVisibleCount(containerWidth) {
    if (containerWidth >= 1280) return 5.2; // desktop rộng (xl)
    if (containerWidth >= 1024) return 4.2; // desktop (lg)
    if (containerWidth >= 640) return 3.2;  // tablet (sm/md)
    return 2.2;                              // mobile
}

function AutoScrollRow({ products, loading }) {
    const trackRef = useRef(null);
    const containerRef = useRef(null);
    const [cardWidth, setCardWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const pausedRef = useRef(false);
    const rafRef = useRef(null);
    const posRef = useRef(0);

    const draggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const dragStartPosRef = useRef(0);
    const pointerIdRef = useRef(null);
    const movedRef = useRef(false);


    // Đo chiều rộng container thật (px), từ đó tự chọn visibleCount phù hợp
    // rồi suy ra width từng card
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const calc = () => {
            const containerWidth = el.clientWidth;
            const visibleCount = getVisibleCount(containerWidth);
            const w = (containerWidth - CARD_GAP * (visibleCount - 1)) / visibleCount;
            setCardWidth(w > 0 ? w : 0);
        };

        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Auto-scroll loop
    useEffect(() => {
        const track = trackRef.current;
        if (!track || loading || products.length === 0 || cardWidth === 0) return;

        posRef.current = 0;
        track.style.transform = "translateX(0px)";

        const SPEED = 0.5; // px / frame

        const step = () => {
            if (!pausedRef.current && !draggingRef.current && track) {
                const maxScroll = track.scrollWidth / 2; // list nhân đôi để loop mượt
                posRef.current += SPEED;
                if (posRef.current >= maxScroll) posRef.current = 0;
                track.style.transform = `translateX(-${posRef.current}px)`;
            }
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);

        return () => cancelAnimationFrame(rafRef.current);
    }, [products, loading, cardWidth]);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    //chặn click nếu đã kéo tay (drag) — tránh click nhầm khi kéo ngang
    const handleClickCapture = (e) => {
        if (movedRef.current) {
            e.preventDefault();
            e.stopPropagation();

            // reset sau khi đã chặn click
            movedRef.current = false;
        }
    };
    const handlePointerDown = (e) => {
        const track = trackRef.current;
        if (!track) return;

        draggingRef.current = true;
        movedRef.current = false;

        setIsDragging(true);

        dragStartXRef.current = e.clientX;
        dragStartPosRef.current = posRef.current;

        pointerIdRef.current = e.pointerId;

        track.setPointerCapture?.(e.pointerId);
    };

    /* ── Kéo tay (drag/swipe) bằng Pointer Events ── */
    const handlePointerMove = (e) => {
        if (!draggingRef.current) return;

        const track = trackRef.current;
        if (!track) return;

        const maxScroll = track.scrollWidth / 2;
        if (maxScroll <= 0) return;

        const deltaX = e.clientX - dragStartXRef.current;

        // nếu kéo quá 6px thì coi là drag
        if (Math.abs(deltaX) > 6) {
            movedRef.current = true;
        }

        let next = dragStartPosRef.current - deltaX;

        next = ((next % maxScroll) + maxScroll) % maxScroll;

        posRef.current = next;

        track.style.transform = `translateX(-${next}px)`;
    };

    const endDrag = () => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        setIsDragging(false);

        const track = trackRef.current;

        if (track && pointerIdRef.current != null) {
            track.releasePointerCapture?.(pointerIdRef.current);
        }

        pointerIdRef.current = null;

        setTimeout(() => {
            movedRef.current = false;
        }, 0);
    };

    // Fallback width trong lúc chưa đo xong container (tránh flash width=0)
    const effectiveWidth = cardWidth || 160;

    if (loading) {
        return (
            <div ref={containerRef} className="flex gap-3 overflow-hidden pt-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ width: effectiveWidth }} className="shrink-0">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div ref={containerRef}>
                <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
                    Chưa có deal nào trong danh mục này
                </p>
            </div>
        );
    }

    const doubled = [...products, ...products];

    return (
        // pt-2.5 (10px) chừa chỗ cho ribbon "-top-2" của ProductCard không bị cắt bởi overflow-hidden
        <div
            ref={containerRef}
            className="overflow-hidden pt-3.5 -mt-2.5"
            onClickCapture={handleClickCapture}
            onMouseEnter={pause}
            onMouseLeave={(e) => {
                resume();
                endDrag(e);
            }}
        >
            <div
                ref={trackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`flex gap-3 w-max will-change-transform select-none
                    ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                style={{ touchAction: "pan-y" }}
            >
                {doubled.map((p, i) => (
                    <div
                        key={`${p.id}-${i}`}
                        style={{ width: effectiveWidth }}
                        className="shrink-0 pointer-events-none"
                    >
                        {/* pointer-events-none trên card để kéo không bị chặn bởi link/ảnh bên trong,
                nhưng vẫn cho phép click bình thường vì ta không preventDefault trên click
                (chỉ kích hoạt kéo khi có di chuyển thực sự) */}
                        <div className="pointer-events-auto">
                            <ProductCard product={p} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── HotDealsSection ──
   Giao diện dạng "folder": một tab nhô lên ở góc trên-trái ghi
   "DEAL SỐC MỖI NGÀY", gắn liền vào khung card lớn bên dưới — giống hệt hình
   phác thảo (tab hình chữ nhật bo góc trên, đáy tab nối liền cạnh trên của
   khung chính, khung chính chứa category chips + hàng sản phẩm). */
export default function HotDealsSection() {
    const [categories, setCategories] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDealCategories().then(setCategories).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = { sortBy: "discount_desc", size: DEAL_SIZE, page: 0 };
        if (activeCategoryId != null) params.categoryId = activeCategoryId;

        getProducts(params)
            .then((r) => setProducts(r.data.content))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [activeCategoryId]);

    if (!loading && products.length === 0 && activeCategoryId === null && categories.length === 0) {
        return null;
    }

    return (
        // mt-7 chừa chỗ cho tab nhô lên phía trên khung chính (không bị cắt bởi phần tử cha)
        <div className="relative mt-11 mb-5">
            {/* ── Tab nhô lên: "DEAL SỐC MỖI NGÀY" ── */}
            <div
                className="absolute left-0 z-0
                   flex items-center gap-1.5
                   px-3 sm:px-4 py-2 rounded-t-xl
                   bg-gradient-to-r from-green-600 to-emerald-500
                   text-white text-xs sm:text-sm font-extrabold tracking-wide
                   shadow-[0_-2px_10px_rgba(16,185,129,0.3)]"
                style={{ top: "-32px" }} // -33px để nhô lên, -1px để khớp với border khung chính
            >
                <Flame size={15} className="shrink-0 " />
                DEAL SỐC MỖI NGÀY
            </div>

            {/* ── Khung chính (thân "folder") ── */}
            <div
                className="relative rounded-2xl rounded-tl-none
                   border-2 border-[var(--color-primary)]
                   bg-[var(--color-primary-subtle)]
                   shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                   overflow-hidden pt-3"
            >
                {/* ── Category chips ── */}
                {categories.length > 0 && (
                    <div className="px-4 pb-2">
                        <CategoryScroller
                            categories={categories}
                            activeId={activeCategoryId}
                            onSelect={setActiveCategoryId}
                        />
                    </div>
                )}

                {/* ── Hàng sản phẩm ── */}
                <div className="px-4 pb-2 sm:pb-4">
                    <AutoScrollRow products={products} loading={loading} />
                </div>
            </div>
        </div>
    );
}