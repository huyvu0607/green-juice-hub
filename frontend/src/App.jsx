import { Routes, Route, useLocation } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartSidebar from '@/components/cart/CartSidebar'
import { useEffect, useState, useRef } from 'react'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/useCartStore'
import useAppStore from '@/store/useAppStore'
import Preloader from '@/components/common/Preloader'

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
import CheckoutPage from '@/pages/checkout/CheckoutPage'                      // ← thêm
import OrderDetailPage from '@/pages/orders/OrderDetailPage'
import OrdersListPage from '@/pages/orders/OrdersListPage'
import ContactPage from '@/pages/contact/ContactPage'
import PolicyPage from '@/pages/policies/PolicyPage'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminOrdersPage from '@/pages/admin/order/AdminOrdersPage'
import AdminOrderDetailPage from '@/pages/admin/order/AdminOrderDetailPage'
import AdminProductsPage from '@/pages/admin/product/AdminProductsPage'
import AdminProductFormPage from '@/pages/admin/product/AdminProductFormPage'
import AdminPromotionsPage from '@/pages/admin/promotion/Adminpromotionspage'   // ← thêm
import AdminUsersPage from '@/pages/admin/user/AdminUsersPage'                       // ← thêm
import AdminReviewsPage from './pages/admin/reviews/AdminReviewsPage'
import AdminContactsPage from '@/pages/admin/contact/AdminContactsPage'
import AdminBannersPage from '@/pages/admin/banners/AdminBannersPage'
import AdminPoliciesPage from '@/pages/admin/policy/Adminpoliciespage'

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

const AUTH_PATHS = ['/login', '/login-password', '/verify-otp', '/set-password', '/forgot-password', '/reset-password', '/login-option']

function AppRoutes() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const minDisplayRef = useRef(2000)

  const [preloaderKey, setPreloaderKey] = useState(0)
  const [isLoading, setIsLoading] = useState(() => window.location.pathname === '/')
  const [showPreloader, setShowPreloader] = useState(() => window.location.pathname === '/')

  const { pageReady, setPageReady } = useAppStore()

  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  useEffect(() => {
    if (pageReady) setIsLoading(false)
  }, [pageReady])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (AUTH_PATHS.includes(location.pathname)) {
      setShowPreloader(false)
      return
    }

    // Chỉ show Preloader cho HomePage
    if (location.pathname !== '/') {
      setShowPreloader(false)
      setPageReady(false)
      return
    }

    setPageReady(false)
    setIsLoading(true)

    const showTimer = setTimeout(() => {
      if (!useAppStore.getState().pageReady) {
        minDisplayRef.current = 400
        setShowPreloader(true)
        setPreloaderKey(k => k + 1)
      }
    }, 500)

    const fallback = setTimeout(() => setIsLoading(false), 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(fallback)
    }
  }, [location.pathname])

  return (
    <>
      {showPreloader && (
        <Preloader
          key={preloaderKey}
          isLoading={isLoading}
          minDisplay={minDisplayRef.current}
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
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route path="/policies/:type" element={<MainLayout><PolicyPage /></MainLayout>} />

        {/* ── Customer only ── */}
        
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MainLayout><CheckoutPage /></MainLayout>   {/* ← sửa */}
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MainLayout><OrdersListPage /></MainLayout>  {/* ← sửa */}
          </ProtectedRoute>
        } />
        {/* ← thêm route mới */}
        <Route path="/orders/:orderId" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MainLayout><OrderDetailPage /></MainLayout>
          </ProtectedRoute>
        } />

        {/* ── Admin + Staff ── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />  {/* ← thêm route mới */}
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="contacts" element={<AdminContactsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="policies" element={<AdminPoliciesPage />} /> 



        </Route>
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