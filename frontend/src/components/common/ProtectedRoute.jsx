import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn ? children : <Navigate to="/login" />
}

export function GuestRoute({ children }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn ? <Navigate to="/" /> : children
}