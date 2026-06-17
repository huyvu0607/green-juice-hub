import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

// Bezier curve cao cấp tạo cảm giác mượt mà và có độ nảy nhẹ nhàng
const SPRING_BEZIER = "cubic-bezier(.19,1,.22,1)";

export default function ImageGallery({ images = [] }) {
    // ── Main Gallery State ──────────────────────────────────────
    const [active, setActive] = useState(0);
    const [sliding, setSliding] = useState(null); 
    const imageRef = useRef(null);
    const timerRef = useRef(null);

    // ── Lightbox State ──────────────────────────────────────────
    const [lightbox, setLightbox] = useState(false); // Trạng thái mount Portal
    const [lbState, setLbState] = useState("idle");  // "idle" | "opening" | "open" | "closing"
    const [lbActive, setLbActive] = useState(0);
    const [startRect, setStartRect] = useState(null);

    // State riêng cho hiệu ứng chuyển ảnh bên trong Lightbox (không phụ thuộc gallery ngoài)
    const [lbSliding, setLbSliding] = useState(null); // { fromIdx, toIdx, phase }
    const lbTimerRef = useRef(null);

    // Ref lưu state hiện tại để dùng trong callbacks (ví dụ event listener)
    const stateRef = useRef({ active, lbActive });
    useEffect(() => {
        stateRef.current = { active, lbActive };
    }, [active, lbActive]);

    const imgs = images.map((img) => typeof img === "string" ? { url: img } : img);
    const getUrl = (img) => img?.imageUrl ?? img?.url ?? "";
    const total = imgs.length;

    useEffect(() => () => {
        clearTimeout(timerRef.current);
        clearTimeout(lbTimerRef.current);
    }, []);

    // ── Logic Main Gallery Slide ────────────────────────────────
    const goTo = useCallback((toIdx, dir) => {
        if (toIdx === active || sliding) return;
        clearTimeout(timerRef.current);
        setSliding({ fromIdx: active, toIdx, dir, phase: "enter" });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setSliding((s) => s ? { ...s, phase: "run" } : null);
            });
        });

        timerRef.current = setTimeout(() => {
            setActive(toIdx);
            setSliding(null);
        }, 400);
    }, [active, sliding]);

    const goPrev = useCallback(() => goTo((active - 1 + total) % total, "right"), [active, total, goTo]);
    const goNext = useCallback(() => goTo((active + 1) % total, "left"), [active, total, goTo]);

    // ── Logic Lightbox Navigation (Next/Prev Độc lập) ───────────
    const lbGoTo = useCallback((idx) => {
        if (lbSliding) return; // Chặn bấm liên tục gây loạn animation
        setLbActive((prev) => {
            if (idx === prev) return prev;
            
            // Bắt đầu phase chuẩn bị (enter)
            setLbSliding({ fromIdx: prev, toIdx: idx, phase: "enter" });
            clearTimeout(lbTimerRef.current);

            // Kích hoạt phase chạy (run) sau 1 frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setLbSliding((s) => s ? { ...s, phase: "run" } : null);
                });
            });

            // Kết thúc animation: 220ms
            lbTimerRef.current = setTimeout(() => {
                setLbSliding(null);
            }, 220);

            return idx; // Cập nhật state UI (counter, thumb) ngay lập tức
        });
    }, [lbSliding]);

    const lbGoPrev = useCallback(() => lbGoTo((lbActive - 1 + total) % total), [lbActive, total, lbGoTo]);
    const lbGoNext = useCallback(() => lbGoTo((lbActive + 1) % total), [lbActive, total, lbGoTo]);

    // ── Logic Mở / Đóng Lightbox ────────────────────────────────
    const openLightbox = useCallback(() => {
        if (imageRef.current) {
            setStartRect(imageRef.current.getBoundingClientRect());
        }
        setLbActive(active);
        setLightbox(true);
        setLbState("opening"); // Phase 1: Gắn DOM ở vị trí thumbnail

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setLbState("open"); // Phase 2: Kích hoạt CSS transition bay ra giữa
            });
        });
    }, [active]);

    const closeLightbox = useCallback(() => {
        const { active: currentActive, lbActive: currentLbActive } = stateRef.current;

        const triggerClose = () => {
            setLbState("closing"); // Bay về
            setTimeout(() => {
                setLightbox(false);
                setLbState("idle");
            }, 650); // Khớp với duration animation
        };

        // Nếu người dùng đã next/prev trong Lightbox, ta cần đồng bộ gallery ngoài trước
        if (currentActive !== currentLbActive) {
            setActive(currentLbActive);
            setSliding(null); // Huỷ mọi animation trượt đang dang dở ở ngoài
            
            // Đợi 2 frames để React render lại ảnh chính bên ngoài và DOM cập nhật vị trí mới
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (imageRef.current) {
                        setStartRect(imageRef.current.getBoundingClientRect()); // Tính lại toạ độ bay về
                    }
                    triggerClose();
                });
            });
        } else {
            if (imageRef.current) {
                setStartRect(imageRef.current.getBoundingClientRect());
            }
            triggerClose();
        }
    }, []);

    // Events và Scroll Lock
    useEffect(() => {
        if (!lightbox) return;
        const handleKey = (e) => {
            if (e.key === "ArrowLeft") lbGoPrev();
            if (e.key === "ArrowRight") lbGoNext();
            if (e.key === "Escape") closeLightbox();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightbox, lbGoPrev, lbGoNext, closeLightbox]);

    useEffect(() => {
        document.body.style.overflow = lightbox ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [lightbox]);

    if (!imgs.length) {
        return (
            <div className="aspect-square rounded-[var(--radius-lg)] bg-muted flex items-center justify-center">
                <svg className="w-16 h-16 opacity-30 text-muted-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }

    // ── Styles Main Gallery Slider ──────────────────────────────
    const TRANS = "transform 380ms cubic-bezier(0.4,0,0.2,1)";
    const getFromStyle = () => {
        if (!sliding) return null;
        const endX = sliding.dir === "left" ? "-100%" : "100%";
        return {
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transform: sliding.phase === "run" ? `translateX(${endX})` : "translateX(0%)",
            transition: sliding.phase === "run" ? TRANS : "none", zIndex: 1,
        };
    };
    const getToStyle = () => {
        if (!sliding) return null;
        const startX = sliding.dir === "left" ? "100%" : "-100%";
        return {
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transform: sliding.phase === "run" ? "translateX(0%)" : `translateX(${startX})`,
            transition: sliding.phase === "run" ? TRANS : "none", zIndex: 2,
        };
    };

    // ── Arrow Button UI ─────────────────────────────────────────
    const ArrowBtn = ({ onClickFn, direction, light = false, style = {} }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onClickFn(); }}
            style={{
                width: light ? 44 : 36, height: light ? 44 : 36,
                borderRadius: "50%",
                background: light ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.88)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: light ? "white" : "#374151",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "transform 150ms cubic-bezier(0.4,0,0.2,1), background 150ms",
                ...style
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
            {direction === "prev"
                ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            }
        </button>
    );

    // ── Lightbox Portal Renderer ────────────────────────────────
    const LightboxPortal = () => {
        const isFullscreen = lbState === "open";
        
        return createPortal(
            <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}>
                
                {/* CSS injection xử lý phần vật lý học (Scale Bounce) không thể dùng transition thường */}
                <style>{`
                    @keyframes lb-physics-open {
                        0% { transform: scale(0.95); }
                        60% { transform: scale(1.02); }
                        100% { transform: scale(1); }
                    }
                    @keyframes lb-physics-close {
                        0% { transform: scale(1); }
                        100% { transform: scale(0.97); }
                    }
                `}</style>

                {/* 1. Backdrop */}
                <div
                    onClick={closeLightbox}
                    style={{
                        position: "absolute", inset: 0,
                        background: isFullscreen ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)",
                        backdropFilter: isFullscreen ? "blur(14px)" : "blur(0px)",
                        WebkitBackdropFilter: isFullscreen ? "blur(14px)" : "blur(0px)",
                        transition: `background 650ms ${SPRING_BEZIER}, backdrop-filter 650ms ${SPRING_BEZIER}`
                    }}
                />

                {/* 2. Wrapper điều khiển toạ độ và kích thước bay (FLIP Animation) */}
                <div
                    style={{
                        position: "fixed",
                        zIndex: 2,
                        // Nếu đang fullscreen thì nằm giữa, ngược lại nằm đúng tọa độ thumbnail
                        left: isFullscreen ? "50%" : `${startRect?.left || 0}px`,
                        top: isFullscreen ? "50%" : `${startRect?.top || 0}px`,
                        width: isFullscreen ? "88vw" : `${startRect?.width || 0}px`,
                        height: isFullscreen ? "88vh" : `${startRect?.height || 0}px`,
                        transform: isFullscreen ? "translate(-50%, -50%)" : "translate(0, 0)",
                        transition: `all 650ms ${SPRING_BEZIER}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Inner điều khiển Scale Physics + Crossfade Navidation */}
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                        
                        {lbSliding ? (
                            <>
                                {/* Ảnh cũ đang fade và scale xuống nhẹ */}
                                <img
                                    src={getUrl(imgs[lbSliding.fromIdx])}
                                    alt=""
                                    style={{
                                        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain",
                                        opacity: lbSliding.phase === "run" ? 0 : 1,
                                        transform: lbSliding.phase === "run" ? "scale(0.95)" : "scale(1)",
                                        transition: "opacity 220ms ease, transform 220ms ease", zIndex: 1
                                    }}
                                />
                                {/* Ảnh mới đang fade và scale lên chuẩn */}
                                <img
                                    src={getUrl(imgs[lbSliding.toIdx])}
                                    alt=""
                                    style={{
                                        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain",
                                        opacity: lbSliding.phase === "run" ? 1 : 0,
                                        transform: lbSliding.phase === "run" ? "scale(1)" : "scale(1.05)",
                                        transition: "opacity 220ms ease, transform 220ms ease", zIndex: 2
                                    }}
                                />
                            </>
                        ) : (
                            <img
                                src={getUrl(imgs[lbActive])}
                                alt="Lightbox"
                                style={{
                                    width: "100%", height: "100%", objectFit: "contain", display: "block",
                                    // Áp dụng keyframe physics cảm giác vật lý thật lúc open/close
                                    animation: (lbState === "opening" || lbState === "open")
                                        ? `lb-physics-open 650ms ${SPRING_BEZIER} forwards`
                                        : lbState === "closing"
                                        ? `lb-physics-close 650ms ${SPRING_BEZIER} forwards`
                                        : "none"
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* 3. Các thành phần UI - Render độc lập với các mốc thời gian trễ riêng */}
                {total > 1 && (
                    <>
                        {/* Arrows fade-in sau 300ms */}
                        <div style={{ 
                            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 300ms", pointerEvents: isFullscreen ? "auto" : "none"
                        }}>
                            <ArrowBtn onClickFn={lbGoPrev} direction="prev" light />
                        </div>
                        <div style={{ 
                            position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 300ms", pointerEvents: isFullscreen ? "auto" : "none"
                        }}>
                            <ArrowBtn onClickFn={lbGoNext} direction="next" light />
                        </div>

                        {/* Counter fade-in sau 200ms */}
                        <div style={{
                            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                            zIndex: 4, padding: "4px 14px", borderRadius: 999, background: "rgba(0,0,0,0.5)",
                            color: "white", fontSize: 13, fontWeight: 500,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 200ms",
                        }}>
                            {lbActive + 1} / {total}
                        </div>

                        {/* Thumbnails slide-up & fade-in sau 250ms */}
                        <div style={{
                            position: "absolute", bottom: 52, left: "50%", zIndex: 4, display: "flex", gap: 8,
                            opacity: isFullscreen ? 1 : 0,
                            transform: isFullscreen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(20px)",
                            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1) 250ms",
                            pointerEvents: isFullscreen ? "auto" : "none"
                        }}>
                            {imgs.map((img, idx) => (
                                <button key={idx} onClick={(e) => { e.stopPropagation(); lbGoTo(idx); }}
                                    style={{
                                        width: 48, height: 48, borderRadius: 8, overflow: "hidden", padding: 0,
                                        border: `2px solid ${idx === lbActive ? "white" : "rgba(255,255,255,0.3)"}`,
                                        opacity: idx === lbActive ? 1 : 0.55, transform: idx === lbActive ? "scale(1.1)" : "scale(1)",
                                        transition: "all 200ms", cursor: "pointer", background: "none",
                                    }}
                                >
                                    <img src={getUrl(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Nút đóng fade-in sau 150ms */}
                <button
                    onClick={closeLightbox}
                    style={{
                        position: "absolute", top: 16, right: 16, zIndex: 4,
                        width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                        opacity: isFullscreen ? 1 : 0,
                        transition: "opacity 300ms ease 150ms",
                        pointerEvents: isFullscreen ? "auto" : "none"
                    }}
                >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>,
            document.body
        );
    };

    // ── Render Main Gallery ─────────────────────────────────────
    return (
        <>
            <div className="flex flex-col gap-3">
                <div
                    className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-muted shadow-[var(--shadow-md)] group"
                    style={{ cursor: "zoom-in" }}
                    onClick={openLightbox}
                >
                    {sliding && (
                        <img src={getUrl(imgs[sliding.fromIdx])} alt="" style={getFromStyle()} />
                    )}

                    {sliding ? (
                        <img src={getUrl(imgs[sliding.toIdx])} alt="Ảnh sản phẩm" style={getToStyle()} />
                    ) : (
                        <img
                            ref={imageRef} // Gắn ref để lấy vị trí thumbnail
                            src={getUrl(imgs[active])}
                            alt="Ảnh sản phẩm"
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    )}

                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ zIndex: 5 }}>
                        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0zM11 8v6M8 11h6" />
                            </svg>
                        </div>
                    </div>

                    {total > 1 && (
                        <>
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                                <ArrowBtn onClickFn={goPrev} direction="prev" />
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                                <ArrowBtn onClickFn={goNext} direction="next" />
                            </div>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 5 }} onClick={(e) => e.stopPropagation()}>
                                {imgs.map((_, i) => (
                                    <button key={i} onClick={() => goTo(i, i > active ? "left" : "right")}
                                        style={{
                                            borderRadius: 999, border: "none", cursor: "pointer", padding: 0,
                                            width: i === active ? 16 : 6, height: 6,
                                            background: i === active ? "white" : "rgba(255,255,255,0.5)",
                                            transition: "all 220ms",
                                        }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {total > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {imgs.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx, idx > active ? "left" : "right")}
                                className={`flex-shrink-0 w-16 h-16 rounded-[var(--radius-md)] overflow-hidden border-2 transition-all duration-200 ${idx === active ? "border-[var(--color-primary)] shadow-[var(--shadow-glow)] opacity-100" : "border-transparent opacity-60 hover:opacity-90"}`}
                            >
                                <img src={getUrl(img)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {lightbox && <LightboxPortal />}
        </>
    );
}