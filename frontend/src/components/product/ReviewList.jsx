import { useState, useEffect, useCallback } from "react";
import reviewApi from "@/api/reviewApi";
import ReviewForm from "./ReviewForm";
import useAuthStore from "@/store/authStore";

/* ── Helpers ── */
const fmt = (d) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

function StarDisplay({ value = 0 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-3.5 h-3.5" viewBox="0 0 20 20">
                    <path
                        d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.26 6.62l5.35-.78z"
                        fill={value >= star ? "#f59e0b" : "#e5e7eb"}
                    />
                </svg>
            ))}
        </div>
    );
}

function RatingBar({ star, count, total }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2 text-xs text-secondary">
            <span className="w-4 text-right">{star}</span>
            <svg className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 20 20">
                <path
                    d="M10 1l2.39 4.84 5.35.78-3.87 3.77.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.26 6.62l5.35-.78z"
                    fill="#f59e0b"
                />
            </svg>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-6 text-right">{count}</span>
        </div>
    );
}

/* ── Admin Reply Block ── */
function AdminReply({ reply, repliedAt }) {
    if (!reply) return null;
    return (
        <div className="mt-2 ml-4 border-l-2 border-green-200 pl-3">
            <div className="rounded-[var(--radius-md)] bg-green-50 border border-green-100 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                    {/* Avatar Quản trị viên */}
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white-600 text-white">
                        <img
                            src="/LogoGreen.png"
                            alt="Green Juice Hub"
                            className="h-5 w-5 shrink-0 rounded-full object-cover"
                        />
                    </div>
                    <span className="text-xs font-semibold text-green-700">Quản trị viên</span>
                    {repliedAt && (
                        <span className="text-xs text-green-500 ml-auto">{fmt(repliedAt)}</span>
                    )}
                </div>
                <p className="text-sm text-green-800 leading-relaxed">{reply}</p>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function ReviewList({ productId, deliveredOrderId: propOrderId = null }) {
    const { isLoggedIn } = useAuthStore();

    const [rating, setRating] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loadingList, setLoadingList] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [filterRating, setFilterRating] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [deliveredOrderId, setDeliveredOrderId] = useState(propOrderId);

    /* ── Tự fetch deliveredOrderId nếu không được truyền vào ── */
    useEffect(() => {
        if (propOrderId || !isLoggedIn) return;
        import("@/api/orderApi").then(({ default: orderApi }) => {
            orderApi.getMyOrders(0, 50, "DELIVERED").then((res) => {
                const orders = res.data?.content ?? [];
                const matched = orders.find(o =>
                    o.items?.some(i => i.productId === productId)
                );
                setDeliveredOrderId(matched?.id ?? null);
            }).catch(() => { });
        });
    }, [propOrderId, isLoggedIn, productId]);

    /* ── Fetch rating summary ── */
    const fetchRating = useCallback(async () => {
        try {
            const data = await reviewApi.getProductRating(productId);
            setRating(data);
        } catch { }
    }, [productId]);

    /* ── Fetch review list ── */
    const fetchReviews = useCallback(async (p = 0, ratingFilter = filterRating) => {
        try {
            setLoadingList(true);
            const data = await reviewApi.getProductReviews(productId, p, 5, ratingFilter);
            setReviews(prev => p === 0 ? data.content : [...prev, ...data.content]);
            setTotalPages(data.totalPages);
            setPage(p);
        } catch { }
        finally { setLoadingList(false); }
    }, [productId, filterRating]);

    const handleFilterRating = (star) => {
        const newFilter = filterRating === star ? null : star;
        setFilterRating(newFilter);
        fetchReviews(0, newFilter);
    };

    /* ── Kiểm tra đã review chưa ── */
    const checkReviewed = useCallback(async () => {
        if (!isLoggedIn || !deliveredOrderId) return;
        try {
            const reviewed = await reviewApi.hasReviewed(deliveredOrderId, productId);
            setHasReviewed(reviewed);
        } catch { }
    }, [isLoggedIn, deliveredOrderId, productId]);

    useEffect(() => { fetchRating(); fetchReviews(0); }, [fetchRating, fetchReviews]);
    useEffect(() => { checkReviewed(); }, [checkReviewed]);

    const handleReviewSuccess = () => {
        setHasReviewed(true);
        setShowForm(false);
        fetchRating();
        fetchReviews(0);
    };

    const canWriteReview = isLoggedIn && !!deliveredOrderId && !hasReviewed;

    return (
        <div className="flex flex-col gap-6">

            {/* ── Rating summary ── */}
            {rating && (
                <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-[var(--radius-lg)] bg-surface border border-subtle">
                    <div className="flex flex-col items-center justify-center gap-1 min-w-[100px]">
                        <span className="text-4xl font-bold text-primary leading-none">
                            {rating.avgRating?.toFixed(1) ?? "0.0"}
                        </span>
                        <StarDisplay value={Math.round(rating.avgRating ?? 0)} />
                        <span className="text-xs text-secondary mt-1">
                            {rating.totalReviews} đánh giá
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-1.5">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <RatingBar
                                key={star}
                                star={star}
                                count={rating.distribution?.[star] ?? 0}
                                total={rating.totalReviews ?? 0}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Filter theo sao ── */}
            {rating && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleFilterRating(null)}
                        className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium border transition-all duration-150
                            ${filterRating === null
                                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                : "border-default text-secondary hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
                    >
                        Tất cả ({rating.totalReviews})
                    </button>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = rating.distribution?.[star] ?? 0;
                        if (count === 0) return null;
                        return (
                            <button
                                key={star}
                                onClick={() => handleFilterRating(star)}
                                className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium border transition-all duration-150
                                    ${filterRating === star
                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                        : "border-default text-secondary hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"}`}
                            >
                                ⭐ {star} sao ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Nút viết review ── */}
            {canWriteReview && !showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="self-start px-5 py-2.5 rounded-[var(--radius-pill)] text-sm font-semibold
                        border border-[var(--color-primary)] text-[var(--color-primary)]
                        hover:bg-[var(--color-primary-subtle)] transition-all duration-200"
                >
                    ✏️ Viết đánh giá
                </button>
            )}

            {canWriteReview && showForm && (
                <ReviewForm
                    productId={productId}
                    orderId={deliveredOrderId}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {hasReviewed && (
                <p className="text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-[var(--radius-md)] border border-green-200">
                    ✓ Bạn đã đánh giá sản phẩm này.
                </p>
            )}

            {/* ── Danh sách review ── */}
            {reviews.length === 0 && !loadingList ? (
                <p className="text-sm text-secondary text-center py-6">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {reviews.map((r) => (
                        <div
                            key={r.id}
                            className="p-4 rounded-[var(--radius-md)] bg-surface border border-subtle flex flex-col gap-2"
                        >
                            {/* User info + rating */}
                            <div className="flex items-center gap-3">
                                {r.userAvatar ? (
                                    <img
                                        src={r.userAvatar}
                                        alt={r.userName}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-secondary flex-shrink-0">
                                        {r.userName?.charAt(0)?.toUpperCase() ?? "U"}
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-primary">{r.userName}</span>
                                    <span className="text-xs text-muted-fg">{fmt(r.createdAt)}</span>
                                </div>
                                <div className="ml-auto">
                                    <StarDisplay value={r.rating} />
                                </div>
                            </div>

                            {/* Comment */}
                            {r.comment && (
                                <p className="text-sm text-secondary leading-relaxed">{r.comment}</p>
                            )}

                            {/* Ảnh đính kèm */}
                            {r.imageUrl && (
                                <img
                                    src={r.imageUrl}
                                    alt="Ảnh đánh giá"
                                    className="w-20 h-20 rounded-[var(--radius-md)] object-cover border border-subtle"
                                />
                            )}

                            {/* ── Reply của Quản trị viên ── */}
                            <AdminReply reply={r.reply} repliedAt={r.repliedAt} />
                        </div>
                    ))}

                    {page + 1 < totalPages && (
                        <button
                            onClick={() => fetchReviews(page + 1)}
                            disabled={loadingList}
                            className="self-center mt-2 px-5 py-2 rounded-[var(--radius-pill)] text-sm
                                border border-default text-secondary hover:border-[var(--color-primary)]
                                hover:text-[var(--color-primary)] disabled:opacity-50 transition-all duration-200"
                        >
                            {loadingList ? "Đang tải..." : "Xem thêm đánh giá"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}