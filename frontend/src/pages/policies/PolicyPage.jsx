import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import policyApi from "@/api/policyApi";
import RichText from "@/components/common/RichText";

const POLICY_LABEL = {
    SHIPPING: "Vận chuyển",
    RETURN:   "Đổi trả",
    WARRANTY: "Bảo hành",
    TERMS:    "Điều khoản",
};

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
    const navigate  = useNavigate();
    const activeType = type?.toUpperCase() ?? "SHIPPING";

    // tabs = danh sách policy active từ API (chỉ hiện tab khi có nội dung)
    const [tabs, setTabs]       = useState([]);
    const [tabsLoaded, setTabsLoaded] = useState(false);

    const [policy, setPolicy]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    // Fetch danh sách tab (tất cả policy active)
    useEffect(() => {
        policyApi.getAll()
            .then((list) => {
                setTabs(list)
                // Nếu type hiện tại không có trong danh sách active → redirect sang tab đầu tiên
                const valid = list.some(p => p.type === activeType)
                if (!valid && list.length > 0) {
                    navigate(`/policies/${list[0].type.toLowerCase()}`, { replace: true })
                }
            })
            .catch(() => {})
            .finally(() => setTabsLoaded(true))
    }, [])

    // Fetch nội dung tab đang active
    useEffect(() => {
        if (!tabsLoaded) return
        setLoading(true);
        setError("");
        setPolicy(null);
        policyApi.getByType(activeType)
            .then(setPolicy)
            .catch(() => setError("Không tìm thấy nội dung chính sách."))
            .finally(() => setLoading(false));
    }, [activeType, tabsLoaded]);

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

            {/* ── Tabs — chỉ hiện tab khi có nội dung ── */}
            {tabs.length > 0 && (
                <div className="flex justify-center border-b border-subtle mb-8">
                    {tabs.map((tab) => (
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
                            {POLICY_LABEL[tab.type] ?? tab.title}
                        </Link>
                    ))}
                </div>
            )}

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