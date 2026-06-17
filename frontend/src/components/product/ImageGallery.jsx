import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export default function ImageGallery({ images = [] }) {
    // ── Main Gallery State ──────────────────────────────────────
    const [active, setActive] = useState(0);
    const [sliding, setSliding] = useState(null); 
    const timerRef = useRef(null);

    // ── Lightbox State ──────────────────────────────────────────
    const [lightbox, setLightbox] = useState(false); // Trạng thái mount Portal
    const [lbState, setLbState] = useState("idle");  // "idle" | "opening" | "open" | "closing"
    const [lbActive, setLbActive] = useState(0);

    // State riêng cho hiệu ứng chuyển ảnh bên trong Lightbox
    const [lbSliding, setLbSliding] = useState(null); 
    const lbTimerRef = useRef(null);

    // Ref lưu state hiện tại
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

    // ── Logic Lightbox Navigation ───────────────────────────────
    const lbGoTo = useCallback((idx) => {
        if (lbSliding) return;
        setLbActive((prev) => {
            if (idx === prev) return prev;
            
            setLbSliding({ fromIdx: prev, toIdx: idx, phase: "enter" });
            clearTimeout(lbTimerRef.current);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setLbSliding((s) => s ? { ...s, phase: "run" } : null);
                });
            });

            lbTimerRef.current = setTimeout(() => {
                setLbSliding(null);
            }, 220);

            return idx;
        });
    }, [lbSliding]);

    const lbGoPrev = useCallback(() => lbGoTo((lbActive - 1 + total) % total), [lbActive, total, lbGoTo]);
    const lbGoNext = useCallback(() => lbGoTo((lbActive + 1) % total), [lbActive, total, lbGoTo]);

    // ── Logic Mở / Đóng Lightbox (Đã tối giản) ──────────────────
    const openLightbox = useCallback(() => {
        setLbActive(active);
        setLightbox(true);
        setLbState("opening"); 

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setLbState("open"); // Kích hoạt Fade In & Scale Up
            });
        });
    }, [active]);

    const closeLightbox = useCallback(() => {
        const { active: currentActive, lbActive: currentLbActive } = stateRef.current;

        const triggerClose = () => {
            setLbState("closing"); // Kích hoạt Fade Out & Scale Down
            setTimeout(() => {
                setLightbox(false);
                setLbState("idle");
            }, 300); // Khớp với duration transition mới (300ms)
        };

        if (currentActive !== currentLbActive) {
            setActive(currentLbActive);
            setSliding(null);
        }
        
        triggerClose();
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
                
                {/* 1. Backdrop */}
                <div
                    onClick={closeLightbox}
                    style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        opacity: isFullscreen ? 1 : 0,
                        transition: "opacity 300ms ease"
                    }}
                />

                {/* 2. Wrapper điều khiển Popup & Fade */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        width: "88vw",
                        height: "88vh",
                        opacity: isFullscreen ? 1 : 0,
                        transform: isFullscreen ? "scale(1)" : "scale(0.95)",
                        transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                        {lbSliding ? (
                            <>
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
                                    width: "100%", height: "100%", objectFit: "contain", display: "block"
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* 3. Các thành phần UI - Trễ nhẹ 1 chút để tạo cảm giác mượt */}
                {total > 1 && (
                    <>
                        <div style={{ 
                            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 150ms", pointerEvents: isFullscreen ? "auto" : "none"
                        }}>
                            <ArrowBtn onClickFn={lbGoPrev} direction="prev" light />
                        </div>
                        <div style={{ 
                            position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 150ms", pointerEvents: isFullscreen ? "auto" : "none"
                        }}>
                            <ArrowBtn onClickFn={lbGoNext} direction="next" light />
                        </div>

                        <div style={{
                            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                            zIndex: 4, padding: "4px 14px", borderRadius: 999, background: "rgba(0,0,0,0.5)",
                            color: "white", fontSize: 13, fontWeight: 500,
                            opacity: isFullscreen ? 1 : 0, transition: "opacity 300ms ease 100ms",
                        }}>
                            {lbActive + 1} / {total}
                        </div>

                        <div style={{
                            position: "absolute", bottom: 52, left: "50%", zIndex: 4, display: "flex", gap: 8,
                            opacity: isFullscreen ? 1 : 0,
                            transform: isFullscreen ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(10px)",
                            transition: "all 300ms ease 150ms",
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

                <button
                    onClick={closeLightbox}
                    style={{
                        position: "absolute", top: 16, right: 16, zIndex: 4,
                        width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                        opacity: isFullscreen ? 1 : 0,
                        transition: "opacity 300ms ease 100ms",
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