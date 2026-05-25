import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../api/authApi'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    if (!phone) return setError('Vui lòng nhập số điện thoại')
    setLoading(true)
    setError('')
    try {
      const res = await authApi.sendOtp(phone, 'LOGIN')
      navigate('/verify-otp', {
        state: {
          phone,
          isNewUser: res.data.isNewUser,
          hasPassword: res.data.hasPassword,
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-2">Green Juice Hub 🥤</h1>
        <p className="text-gray-500 mb-6">Nhập số điện thoại để đăng nhập</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
            placeholder="0901234567"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          Hoặc{' '}
          <span
            onClick={() => navigate('/login-password')}
            className="text-green-600 font-medium cursor-pointer hover:underline"
          >
            đăng nhập bằng mật khẩu
          </span>
        </div>
      </div>
    </div>
  )
}