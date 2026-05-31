const heroImage =
  'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1400&q=85'

export default function AuthShell({ title, subtitle, heroQuote, heroItems, children }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f7] text-slate-950">
      <style>
        {`
          @keyframes authFadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes authFloat {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            50% { transform: translate3d(10px, -14px, 0) rotate(3deg); }
          }

          @keyframes authShimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(120%); }
          }

          .auth-fade-up {
            animation: authFadeUp 700ms ease both;
          }

          .auth-float {
            animation: authFloat 5.5s ease-in-out infinite;
          }

          .auth-hero-shimmer::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,.14) 45%, transparent 62%);
            animation: authShimmer 5.5s ease-in-out infinite;
          }
        `}
      </style>

      <div className="mx-auto grid min-h-screen max-w-[1900px] grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <section
          className="auth-hero-shimmer relative isolate flex min-h-[400px] overflow-hidden px-7 py-9 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-16"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(9, 70, 35, .82), rgba(21, 92, 52, .78)), url(${heroImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_85%,rgba(123,205,134,.36),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,.14),transparent_26%)]" />
          <span className="auth-float absolute left-[12%] top-[15%] h-16 w-16 rounded-full border border-white/25 bg-white/10 blur-[1px]" />
          <span className="auth-float absolute bottom-[14%] right-[10%] h-24 w-24 rounded-full border border-lime-100/25 bg-lime-200/10 blur-[1px] [animation-delay:1.2s]" />

          <div className="auth-fade-up flex w-full max-w-[620px] flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-normal sm:text-4xl lg:text-[34px]">
                Green Juice Hub
              </h1>
              <p className="mt-4 text-base text-white/90">Sống xanh · Sống khỏe</p>
            </div>

            <div className="my-12 max-w-[560px] lg:my-0">
              <p className="text-xl font-semibold leading-relaxed sm:text-2xl">
                "{heroQuote}"
              </p>
              <div className="my-7 h-px w-full bg-white/35" />
              <ul className="space-y-4 text-base text-white/95">
                {heroItems.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-white/80">© 2026 Green Juice Hub</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
          <div className="auth-fade-up w-full max-w-[520px] [animation-delay:120ms]">
            <div className="mb-7 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-600">
                Green Juice Hub
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-[30px]">
                {title}
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-500">{subtitle}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
