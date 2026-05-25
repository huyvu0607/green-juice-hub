import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'
import useAuthStore from '../../store/authStore'

export default function LoginPasswordPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)

  const handleLogin = async () => {
    if (!identifier) return setError('Vui lòng nhập số điện thoại hoặc email')
    if (!password) return setError('Vui lòng nhập mật khẩu')
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(identifier, password)
      setAuth(res.data.accessToken, res.data.refreshToken)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra'
      setError(msg)
      if (err.response?.status === 403) {
        setRequiresCaptcha(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-2">Đăng nhập</h1>
        <p className="text-gray-500 mb-6">Nhập thông tin tài khoản</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại / Email
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="0901234567 hoặc email@gmail.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Nhập mật khẩu"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="text-right mb-4">
          <span
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-green-600 cursor-pointer hover:underline"
          >
            Quên mật khẩu?
          </span>
        </div>

        {requiresCaptcha && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            Bạn đã nhập sai quá nhiều lần, vui lòng xác minh captcha (tích hợp sau)
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          Đăng nhập bằng{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-green-600 font-medium cursor-pointer hover:underline"
          >
            mã OTP
          </span>
        </div>
      </div>
    </div>
  )
}