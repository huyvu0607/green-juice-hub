import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import policyApi from "@/api/policyApi";
import RichText from "@/components/common/RichText";

const POLICY_TABS = [
    { type: "SHIPPING", label: "Vận chuyển" },
    { type: "RETURN", label: "Đổi trả" },
    { type: "WARRANTY", label: "Bảo hành" },
    { type: "TERMS", label: "Điều khoản" },
];

function Skeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-7 w-1/3 bg-muted rounded-[var(--radius-md)]" />
            <div className="h-4 w-full bg-muted rounded-[var(--radius-md)]" />
            <div className="h-4 w-5/6 bg-muted rounded-[var(--radius-md)]" />
            <div className="h-4 w-4/6 bg-muted rounded-[var(--radius-md)]" />
            <div className="h-4 w-full bg-muted rounded-[var(--radius-md)]" />
            <div className="h-4 w-3/4 bg-muted rounded-[var(--radius-md)]" />
        </div>
    );
}

export default function PolicyPage() {
    const { type } = useParams();
    const activeType = type?.toUpperCase() ?? "SHIPPING";

    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");
        setPolicy(null);
        policyApi.getByType(activeType)
            .then(setPolicy)
            .catch(() => setError("Không tìm thấy nội dung chính sách."))
            .finally(() => setLoading(false));
    }, [activeType]);

    return (
        <main className="max-w-4xl mx-auto px-4 py-10 animate-fade-slide-up">

            {/* ── Header ── */}
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-primary mb-2">
                    Chính sách
                </h1>
                <p className="text-secondary text-sm">
                    Thông tin về các chính sách của Green Juice Hub
                </p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex justify-center border-b border-subtle mb-8">
                {POLICY_TABS.map((tab) => (
                    <Link
                        key={tab.type}
                        to={`/policies/${tab.type.toLowerCase()}`}
                        className={`
                            px-8 pb-3 pt-1 text-sm font-medium border-b-2 transition-all duration-150 -mb-px
                            ${activeType === tab.type
                                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "border-transparent text-secondary hover:text-primary"}
                        `}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* ── Content ── */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-surface border border-subtle">
                {loading ? (
                    <Skeleton />
                ) : error ? (
                    <p className="text-sm text-secondary text-center py-10">{error}</p>
                ) : policy ? (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display text-xl font-bold text-primary">
                                {policy.title}
                            </h2>
                            {policy.updatedAt && (
                                <span className="text-xs text-muted-fg">
                                    Cập nhật:{" "}
                                    {new Date(policy.updatedAt).toLocaleDateString("vi-VN", {
                                        day: "2-digit", month: "2-digit", year: "numeric"
                                    })}
                                </span>
                            )}
                        </div>
                        <RichText content={policy.content} />
                    </>
                ) : null}
            </div>
        </main>
    );
}