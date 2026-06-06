import { Routes, Route, useLocation } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartSidebar from '@/components/cart/CartSidebar'
import { useEffect, useState, useRef } from 'react'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/useCartStore'
import Preloader from '@/components/common/Preloader'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import LoginPasswordPage from './pages/auth/LoginPasswordPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import SetPasswordPage from './pages/auth/SetPasswordPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import LoginOptionPage from './pages/auth/LoginOptionPage'
import HomePage from '@/pages/home/HomePage'
import ProductsPage from '@/pages/products/ProductsPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])
  return null
}

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

// ─── Tách ra để dùng useLocation bên trong Router ───
function AppRoutes() {
  const location = useLocation()
  const isFirstRender = useRef(true)

  // key để force re-mount Preloader mỗi lần đổi route
  const [preloaderKey, setPreloaderKey] = useState(0)
  // true = đang "loading", false = xong → Preloader bắt đầu đếm minDisplay
  const [isLoading, setIsLoading] = useState(true)
  // false = ẩn hẳn Preloader khỏi DOM
  const [showPreloader, setShowPreloader] = useState(true)

  // Lần đầu: giả lập init xong sau 200ms
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(t)
  }, [])

  // Mỗi lần đổi route (bỏ qua render đầu tiên)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Reset & hiện lại preloader
    setShowPreloader(true)
    setIsLoading(true)
    setPreloaderKey(k => k + 1)

    const t = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <>
      {showPreloader && (
        <Preloader
          key={preloaderKey}
          isLoading={isLoading}
          minDisplay={500}
          onDone={() => setShowPreloader(false)}
        />
      )}
      <ScrollToTop />
      <Routes>
        {/* ── Guest only ── */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/login-password" element={<GuestRoute><LoginPasswordPage /></GuestRoute>} />
        <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
        <Route path="/set-password" element={<GuestRoute><SetPasswordPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/login-option" element={<GuestRoute><LoginOptionPage /></GuestRoute>} />

        {/* ── Public ── */}
        <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
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
    </>
  )
}

function App() {
  const { isLoggedIn, fetchMe } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    if (isLoggedIn) { fetchMe(); fetchCart() }
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) { fetchMe(); fetchCart() }
  }, [])

  return <AppRoutes />
}

export default App