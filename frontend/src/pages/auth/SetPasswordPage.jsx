import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import AuthShell from './AuthShell'

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tempToken, isNewUser } = location.state || {}
  const { setAuth } = useAuthStore()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tempToken) navigate('/login')
  }, [tempToken, navigate])

  const handleSubmit = async () => {
    if (password.length < 8) return setError('Mật khẩu tối thiểu 8 ký tự')
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp')
    setLoading(true)
    setError('')
    try {
      const res = await authApi.setPassword(tempToken, password)
      setAuth(res.data.accessToken, res.data.refreshToken)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    try {
      const res = await authApi.loginWithOtp(tempToken)
      setAuth(res.data.accessToken, res.data.refreshToken)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <AuthShell
      title={isNewUser ? 'Tạo mật khẩu' : 'Đặt lại mật khẩu'}
      subtitle="Mật khẩu tối thiểu 8 ký tự, nên kết hợp chữ và số."
      heroQuote="Tạo mật khẩu để lần sau vào lại nhanh hơn, không cần chờ OTP."
      heroItems={[
        'Bảo vệ thông tin tài khoản tốt hơn',
        'Dễ dàng quản lý đơn hàng định kỳ',
        'Có thể bỏ qua và dùng OTP nếu bạn muốn'
      ]}
    >
      <div className="space-y-5">
        <PasswordField
          label="Mật khẩu"
          value={password}
          onChange={setPassword}
          placeholder="Nhập mật khẩu"
        />
        <PasswordField
          label="Xác nhận mật khẩu"
          value={confirm}
          onChange={setConfirm}
          onEnter={handleSubmit}
          placeholder="Nhập lại mật khẩu"
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="group relative flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#73c892] px-5 text-[15px] font-bold text-white shadow-[0_18px_42px_rgba(73,178,112,.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#55b979] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Đang lưu...' : 'Xác nhận'}</span>
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

        {isNewUser && (
          <button
            onClick={handleSkip}
            className="flex h-11 w-full items-center justify-center rounded-[14px] border border-slate-300 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 active:translate-y-0"
          >
            Để sau, dùng OTP mỗi lần đăng nhập
          </button>
        )}
      </div>
    </AuthShell>
  )
}

function PasswordField({ label, value, onChange, onEnter, placeholder }) {
  return (
    <div>
      <label className="mb-3 block text-[15px] font-semibold text-slate-900">
        {label}
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
            d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5A2.25 2.25 0 0 0 19.5 19.5v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete="new-password"
        />
      </div>
    </div>
  )
}
