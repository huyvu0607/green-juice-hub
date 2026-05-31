import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import AuthShell from './AuthShell'

export default function LoginOptionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone } = location.state || {}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!phone) navigate('/login')
  }, [phone, navigate])

  const handleLoginWithOtp = async () => {
    setLoading(true)
    setError('')
    try {
      await authApi.sendOtp(phone, 'LOGIN')
      navigate('/verify-otp', { state: { phone, type: 'LOGIN' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Chọn cách đăng nhập"
      subtitle="Tài khoản của bạn đã có mật khẩu. Chọn cách đăng nhập phù hợp."
      heroQuote="Linh hoạt đăng nhập theo cách bạn thấy tiện nhất hôm nay."
      heroItems={[
        'Dùng OTP để vào nhanh mà không cần nhớ mật khẩu',
        'Dùng mật khẩu nếu bạn muốn đăng nhập quen thuộc',
        'Tài khoản và lịch sử đơn hàng vẫn được giữ an toàn'
      ]}
    >
      <div className="space-y-5">
        <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
          Tài khoản của bạn đã có mật khẩu. Chọn cách đăng nhập phù hợp.
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleLoginWithOtp}
          disabled={loading}
          className="group relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#73c892] px-5 text-[15px] font-bold text-white shadow-[0_18px_42px_rgba(73,178,112,.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#55b979] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Đang gửi OTP...' : 'Dùng OTP'}</span>
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

        <button
          type="button"
          onClick={() => navigate('/login-password', { state: { phone } })}
          className="flex h-[58px] w-full items-center justify-center rounded-[14px] border border-emerald-200 bg-white px-5 text-[15px] font-bold text-emerald-700 shadow-[0_18px_45px_rgba(15,23,42,.04)] transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        >
          Dùng mật khẩu
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-slate-400">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="transition hover:text-slate-600 hover:underline"
        >
          Quay lại
        </button>
      </div>
    </AuthShell>
  )
}