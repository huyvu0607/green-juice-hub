import { useState } from "react";
import contactApi from "@/api/contactApi";

const SUBJECTS = [
    "Hỏi về sản phẩm",
    "Khiếu nại đơn hàng",
    "Góp ý dịch vụ",
    "Hợp tác kinh doanh",
    "Khác",
];

const STORE_INFO = {
    address: "559 Vườn Lài, Phường An Phú Đông, TP. Hồ Chí Minh",  // ← đổi
    phone: "0901 234 567",
    email: "greenjuicehub@gmail.com",
    hours: "Thứ 2 – Thứ 7: 7:00 – 21:00 | Chủ nhật: 8:00 – 18:00",
};

export default function ContactPage() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        subject: SUBJECTS[0],
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await contactApi.createContact(form);
            setSuccess(true);
            setForm({ fullName: "", email: "", phone: "", subject: SUBJECTS[0], message: "" });
        } catch {
            setError("Gửi liên hệ thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 animate-fade-slide-up">

            {/* ── Header ── */}
            <div className="text-center mb-10">
                <h1 className="font-display text-3xl font-bold text-primary mb-2">
                    Liên hệ với chúng tôi
                </h1>
                <p className="text-secondary text-sm">
                    Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* ── Left: Form ── */}
                <div className="flex flex-col gap-5 p-6 rounded-[var(--radius-lg)] bg-surface border border-subtle">
                    <h2 className="text-lg font-semibold text-primary">Gửi tin nhắn</h2>

                    {success && (
                        <div className="px-4 py-3 rounded-[var(--radius-md)] bg-green-50 border border-green-200 text-green-700 text-sm">
                            ✓ Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Họ tên */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-primary">
                                Họ tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                                placeholder="Nguyễn Văn A"
                                className="px-3.5 py-2.5 rounded-[var(--radius-md)] border border-default bg-base
                                    text-sm text-primary placeholder:text-muted-fg
                                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                    transition-all duration-150"
                            />
                        </div>

                        {/* Email + SĐT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-primary">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="example@gmail.com"
                                    className="px-3.5 py-2.5 rounded-[var(--radius-md)] border border-default bg-base
                                        text-sm text-primary placeholder:text-muted-fg
                                        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                        transition-all duration-150"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-primary">Số điện thoại</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="0901 234 567"
                                    className="px-3.5 py-2.5 rounded-[var(--radius-md)] border border-default bg-base
                                        text-sm text-primary placeholder:text-muted-fg
                                        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                        transition-all duration-150"
                                />
                            </div>
                        </div>

                        {/* Chủ đề */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-primary">
                                Chủ đề <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="subject"
                                value={form.subject}
                                onChange={handleChange}
                                className="px-3.5 py-2.5 rounded-[var(--radius-md)] border border-default bg-base
                                    text-sm text-primary
                                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                    transition-all duration-150"
                            >
                                {SUBJECTS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Nội dung */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-primary">
                                Nội dung <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                placeholder="Nhập nội dung liên hệ..."
                                className="px-3.5 py-2.5 rounded-[var(--radius-md)] border border-default bg-base
                                    text-sm text-primary placeholder:text-muted-fg resize-none
                                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                                    transition-all duration-150"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-[var(--radius-pill)] text-sm font-semibold
                                bg-[var(--color-primary)] text-white
                                hover:bg-[var(--color-primary-hover)] active:scale-[0.98]
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200"
                        >
                            {loading ? "Đang gửi..." : "Gửi liên hệ"}
                        </button>
                    </form>
                </div>

                {/* ── Right: Thông tin + Google Maps ── */}
                <div className="flex flex-col gap-5">

                    {/* Thông tin liên hệ */}
                    <div className="p-6 rounded-[var(--radius-lg)] bg-surface border border-subtle flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-primary">Thông tin liên hệ</h2>

                        {[
                            {
                                icon: <svg className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>,
                                label: "Địa chỉ", value: STORE_INFO.address
                            },
                            {
                                icon: <svg className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>,
                                label: "Điện thoại", value: STORE_INFO.phone
                            },
                            {
                                icon: <svg className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>,
                                label: "Email", value: STORE_INFO.email
                            },
                            {
                                icon: <svg className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>,
                                label: "Giờ mở cửa", value: STORE_INFO.hours
                            },
                        ].map((item) => (
                            <div key={item.label} className="flex items-start gap-3">
                                {item.icon}
                                <div>
                                    <p className="text-xs text-secondary font-medium">{item.label}</p>
                                    <p className="text-sm text-primary">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Google Maps */}
                    <div className="rounded-[var(--radius-lg)] overflow-hidden border border-subtle shadow-sm">
                        <iframe
                            title="Green Juice Hub location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0!2d106.6888!3d10.8172!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528e0b5c5b5b5%3A0x0!2zNTU5IFbGsOG7nW4gTMOgaSwgQW4gUGjDuiDEkMO0bmcsIFRQLiBIQ00!5e0!3m2!1svi!2svn!4v1620000000000!5m2!1svi!2svn"
                            width="100%"
                            height="280"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}