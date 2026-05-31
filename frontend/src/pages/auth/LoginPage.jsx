import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'

const heroImage =
  'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1400&q=85'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await authApi.loginWithGoogle(credentialResponse.credential)
      setAuth(res.data.accessToken, res.data.refreshToken)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại')
    }
  }

  const handleNext = async () => {
  if (!phone) return setError('Vui lòng nhập số điện thoại')
  setLoading(true)
  setError('')
  try {
    const res = await authApi.checkAccount(phone)
    const { isNewUser, hasPassword } = res.data

    if (isNewUser || !hasPassword) {
      await authApi.sendOtp(phone, 'LOGIN')
      navigate('/verify-otp', { state: { phone, type: 'LOGIN' } })
    } else {
      // Có mật khẩu → cho chọn trước khi gửi OTP
      navigate('/login-option', { state: { phone } })
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Có lỗi xảy ra')
  } finally {
    setLoading(false)
  }
}

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

          .google-login-button iframe {
            display: block !important;
            margin: 0 !important;
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
                "Nước ép tươi mỗi sáng - năng lượng tự nhiên cho cả ngày dài."
              </p>
              <div className="my-7 h-px w-full bg-white/35" />
              <ul className="space-y-4 text-base text-white/95">
                <li>- Nguyên liệu hữu cơ, ép lạnh trong ngày</li>
                <li>- Giao tận nơi trong vòng 2 giờ tại TP.HCM</li>
                <li>- Hơn 12.000 khách hàng tin dùng</li>
              </ul>
            </div>

            <p className="text-sm text-white/80">© 2026 Green Juice Hub</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-10">
          <div className="auth-fade-up w-full max-w-[560px] [animation-delay:120ms]">
            <div className="mb-7 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-600">
                Green Juice Hub
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-[30px]">
                Đăng nhập
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-500">
                Nhập số điện thoại để nhận mã xác thực.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-[15px] font-semibold text-slate-900">
                  Số điện thoại
                </label>
                <div className="group flex h-[60px] items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-5 shadow-[0_18px_45px_rgba(15,23,42,.04)] transition duration-300 focus-within:border-emerald-400 focus-within:shadow-[0_20px_60px_rgba(16,185,129,.16)]">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-slate-500 transition group-focus-within:text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106a1.125 1.125 0 0 0-1.173.417l-.97 1.293a1.125 1.125 0 0 1-1.21.38 12.035 12.035 0 0 1-7.143-7.143 1.125 1.125 0 0 1 .38-1.21l1.293-.97c.36-.27.527-.734.417-1.173L6.963 3.102A1.125 1.125 0 0 0 5.872 2.25H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                    />
                  </svg>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="0901 234 567"
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    autoComplete="tel"
                  />
                </div>
                {error && (
                  <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="group relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#73c892] px-5 text-[15px] font-bold text-white shadow-[0_18px_42px_rgba(73,178,112,.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#55b979] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? 'Đang kiểm tra...' : 'Tiếp tục'}</span>

                <svg
                  aria-hidden="true"
                  className="ml-3 h-5 w-5 transition duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            <div className="my-8 flex items-center gap-5">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm uppercase tracking-[.18em] text-slate-400">Hoặc</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="google-login-button flex w-full justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError('Đăng nhập Google thất bại')}
                shape="rectangular"
                theme="outline"
                text="continue_with"
                size="large"
                width="400"
              />
            </div>

            <div className="mt-8 text-center text-[15px] text-slate-500">
              Đăng nhập bằng mật khẩu?{' '}
              <button
                type="button"
                onClick={() => navigate('/login-password')}
                className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline"
              >
                Tại đây
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
