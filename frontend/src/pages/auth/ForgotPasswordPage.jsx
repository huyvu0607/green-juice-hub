import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import AuthShell from './AuthShell'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    if (!phone) return setError('Vui lòng nhập số điện thoại')
    setLoading(true)
    setError('')
    try {
      await authApi.sendOtp(phone, 'RESET_PASSWORD')
      navigate('/verify-otp', { state: { phone, type: 'RESET_PASSWORD' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập số điện thoại để nhận mã OTP đặt lại mật khẩu."
      heroQuote="Lấy lại tài khoản thật nhanh để tiếp tục hành trình sống xanh."
      heroItems={[
        'Xác thực bằng OTP an toàn',
        'Đặt lại mật khẩu chỉ trong vài bước',
        'Thông tin tài khoản luôn được bảo vệ'
      ]}
    >
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
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
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
          onClick={handleSendOtp}
          disabled={loading}
          className="group relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#73c892] px-5 text-[15px] font-bold text-white shadow-[0_18px_42px_rgba(73,178,112,.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#55b979] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</span>
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

      <div className="mt-8 text-center text-[15px] text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/login-password')}
          className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </AuthShell>
  )
}
