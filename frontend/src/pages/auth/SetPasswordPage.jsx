import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tempToken, isNewUser } = location.state || {}
  const { setAuth } = useAuthStore()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          {isNewUser ? 'Tạo mật khẩu' : 'Đặt lại mật khẩu'}
        </h1>
        <p className="text-gray-500 mb-6">Mật khẩu tối thiểu 8 ký tự</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Nhập lại mật khẩu"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Xác nhận'}
        </button>

        {isNewUser && (
          <button
            onClick={handleSkip}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm py-2 rounded-lg transition"
          >
            Để sau, dùng OTP mỗi lần đăng nhập
          </button>
        )}
      </div>
    </div>
  )
}