import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartSidebar from '@/components/cart/CartSidebar'
import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/useCartStore'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import LoginPasswordPage from './pages/auth/LoginPasswordPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import SetPasswordPage from './pages/auth/SetPasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LoginOptionPage from './pages/auth/LoginOptionPage'
import ProductsPage from '@/pages/products/ProductsPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'

// Layout wrapper cho các trang có Header + Footer
function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-surface)] transition-theme">
      <Header />
      <CartSidebar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  const { isLoggedIn, fetchMe } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe()
      fetchCart()
    }
  }, [])
  return (

    <Routes>
      {/* ── Guest only (không có Header/Nav) ── */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/login-password" element={<GuestRoute><LoginPasswordPage /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
      <Route path="/set-password" element={<GuestRoute><SetPasswordPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
      <Route path="/login-option" element={<GuestRoute><LoginOptionPage /></GuestRoute>} />

      {/* ── Public (có Header + Nav) ── */}
      <Route path="/" element={<MainLayout><div>Trang chủ</div></MainLayout>} />
      <Route path="/products" element={<MainLayout><ProductsPage /></MainLayout>} />
      <Route path="/products/:slug" element={<MainLayout><ProductDetailPage /></MainLayout>} />
      <Route path="/contact" element={<MainLayout><div>Liên hệ</div></MainLayout>} />
      <Route path="/policies/:type" element={<MainLayout><div>Chính sách</div></MainLayout>} />

      {/* ── Customer only ── */}
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
          <MainLayout><div>Giỏ hàng</div></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
          <MainLayout><div>Thanh toán</div></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
          <MainLayout><div>Đơn hàng</div></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
          <MainLayout><div>Tài khoản</div></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── Admin + Staff ── */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
          <div>Trang Admin</div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App