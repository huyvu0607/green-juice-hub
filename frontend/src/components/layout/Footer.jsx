import { Link } from "react-router-dom";

const QUICK_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Về chúng tôi", to: "/about" },
  { label: "Liên hệ", to: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "Chính sách vận chuyển", to: "/policies/shipping" },
  { label: "Đổi trả", to: "/policies/return" },
  { label: "Bảo hành", to: "/policies/warranty" },
  { label: "FAQ", to: "/policies/faq" },
];

const SOCIALS = [
  {
    label: "Facebook",
    to: "https://facebook.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    to: "https://instagram.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    to: "https://tiktok.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
      </svg>
    ),
  },
];

const PAYMENTS = ["COD", "VNPay", "Momo", "Bank"];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-brand-600)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8z"
                  fill="white" opacity="0.25" />
                <path d="M12 2C8 2 4 6 4 10c0 5 8 12 8 12s8-7 8-12c0-4-4-8-8-8zM9 10l2 2 4-4"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="font-display font-semibold text-[var(--text-lg)] tracking-tight">
                Green Juice Hub
              </span>
            </Link>
            <p className="text-white/60 text-[var(--text-sm)] italic">Sống xanh · Sống khoẻ</p>
            <p className="text-white/70 text-[var(--text-sm)] leading-relaxed">
              Nước ép tươi, smoothie và thực phẩm lành mạnh – ép trong ngày, giao tận nơi.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIALS.map(({ label, to, icon }) => (
                <a
                  key={label}
                  href={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors duration-[var(--duration-base)]"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-white/40 mb-4">
              Liên kết nhanh
            </p>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[var(--text-sm)] text-white/70 hover:text-white transition-colors duration-[var(--duration-base)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-white/40 mb-4">
              Hỗ trợ
            </p>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[var(--text-sm)] text-white/70 hover:text-white transition-colors duration-[var(--duration-base)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-white/40 mb-4">
              Liên hệ
            </p>
            <ul className="space-y-3 text-[var(--text-sm)] text-white/70">
              <li className="flex items-start gap-2">
                <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                123 Lê Lợi, Quận 1, TP. Hồ Chí Minh
              </li>
              <li className="flex items-center gap-2">
                <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
                </svg>
                1900 1234
              </li>
              <li className="flex items-center gap-2">
                <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                hello@greenjuicehub.vn
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-[var(--text-xs)]">
            © {new Date().getFullYear()} Green Juice Hub. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-2">
            {PAYMENTS.map((method) => (
              <span
                key={method}
                className="px-2.5 py-1 rounded-[var(--radius-sm)] text-[var(--text-xs)] font-medium bg-white/10 text-white/70"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}