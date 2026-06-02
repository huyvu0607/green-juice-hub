import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import AuthShell from './AuthShell'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, type } = location.state || {}

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef([])
  const { setAuth } = useAuthStore()

  useEffect(() => {
    if (!phone) navigate('/login')
  }, [phone, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
  const otpCode = otp.join('')
  if (otpCode.length < 6) return setError('Vui lòng nhập đủ 6 số')
  setLoading(true)
  setError('')
  try {
    const res = await authApi.verifyOtp(phone, otpCode, type)
    const { tempToken, isNewUser, newUser } = res.data
    const isNew = isNewUser ?? newUser

    if (type === 'RESET_PASSWORD') {
      navigate('/reset-password', { state: { tempToken } })
      return
    }

    if (isNew) {
      navigate('/set-password', { state: { tempToken, isNewUser: true } })
      return
    }

    // Có tài khoản, không có mật khẩu → login luôn
    const loginRes = await authApi.loginWithOtp(tempToken)
    const { accessToken, refreshToken, role } = loginRes.data
    setAuth(accessToken, refreshToken, role)
    navigate(role === 'CUSTOMER' ? '/' : '/admin')
  } catch (err) {
    setError(err.response?.data?.message || 'OTP không đúng')
  } finally {
    setLoading(false)
  }
}

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await authApi.sendOtp(phone, type)
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      setError('')
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <AuthShell
      title="Xác nhận OTP"
      subtitle={
        <>
          Nhập mã 6 số đã gửi đến{' '}
          <span className="font-semibold text-slate-700">{phone}</span>.
        </>
      }
      heroQuote="Mã OTP giúp xác nhận đúng chủ tài khoản chỉ trong vài giây."
      heroItems={[
        'Mỗi mã xác thực chỉ dùng một lần',
        'Không chia sẻ OTP với bất kỳ ai',
        'Có thể gửi lại mã nếu bạn chưa nhận được'
      ]}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="aspect-square min-w-0 rounded-[14px] border border-slate-200 bg-white text-center text-xl font-bold text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,.04)] outline-none transition duration-300 focus:border-emerald-400 focus:shadow-[0_20px_60px_rgba(16,185,129,.16)]"
            />
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="group relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#73c892] px-5 text-[15px] font-bold text-white shadow-[0_18px_42px_rgba(73,178,112,.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#55b979] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Đang xác nhận...' : 'Xác nhận'}</span>
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
        {countdown > 0 ? (
          <span>
            Gửi lại sau <span className="font-semibold text-emerald-600">{countdown}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline"
          >
            Gửi lại OTP
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-slate-400">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="transition hover:text-slate-600 hover:underline"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </AuthShell>
  )
}