import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'

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
  }, [phone])

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
    const { tempToken, isNewUser, hasPassword } = res.data

    if (type === 'RESET_PASSWORD') {
      navigate('/reset-password', { state: { tempToken } })
    } else if (isNewUser || !hasPassword) {
      navigate('/set-password', { state: { tempToken, isNewUser } })
    } else {
      const loginRes = await authApi.loginWithOtp(tempToken)
      setAuth(loginRes.data.accessToken, loginRes.data.refreshToken)
      navigate('/')
    }
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
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-2">Xác nhận OTP</h1>
        <p className="text-gray-500 mb-6">
          Nhập mã 6 số đã gửi đến <span className="font-medium text-gray-700">{phone}</span>
        </p>

        <div className="flex gap-2 justify-center mb-4">
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
              className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          {countdown > 0 ? (
            <span>Gửi lại sau <span className="text-green-600 font-medium">{countdown}s</span></span>
          ) : (
            <span
              onClick={handleResend}
              className="text-green-600 font-medium cursor-pointer hover:underline"
            >
              Gửi lại OTP
            </span>
          )}
        </div>

        <div className="mt-3 text-center">
          <span
            onClick={() => navigate('/login')}
            className="text-sm text-gray-400 cursor-pointer hover:underline"
          >
            ← Quay lại
          </span>
        </div>
      </div>
    </div>
  )
}