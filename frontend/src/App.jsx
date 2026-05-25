import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import SetPasswordPage from './pages/auth/SetPasswordPage'
import LoginPasswordPage from './pages/auth/LoginPasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Trang chủ</div>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/login-password" element={<LoginPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  )
}

export default App