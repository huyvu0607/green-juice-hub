import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import LoginPasswordPage from './pages/auth/LoginPasswordPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import SetPasswordPage from './pages/auth/SetPasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LoginOptionPage from './pages/auth/LoginOptionPage'

function App() {
  return (
    <Routes>
      {/* Guest only — đã login thì redirect về / */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/login-password" element={<GuestRoute><LoginPasswordPage /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
      <Route path="/set-password" element={<GuestRoute><SetPasswordPage /></GuestRoute>} />
      <Route path="/login-option" element={<GuestRoute><LoginOptionPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      {/* Protected — chưa login thì redirect về /login */}
      <Route path="/" element={<ProtectedRoute><div>Trang chủ</div></ProtectedRoute>} />
    </Routes>
  )
}

export default App
