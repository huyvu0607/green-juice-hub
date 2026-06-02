import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) return <Navigate to="/login" />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // CUSTOMER vào admin → về trang chủ
    // ADMIN/STAFF vào customer page → về admin
    return user.role === 'CUSTOMER'
      ? <Navigate to="/" />
      : <Navigate to="/admin" />
  }

  return children
}

export function GuestRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) return children

  // Đã login → redirect theo role
  if (user?.role === 'CUSTOMER') return <Navigate to="/" />
  return <Navigate to="/admin" />
}