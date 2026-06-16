// src/hooks/useAdminRole.js
import useAuthStore from '@/store/authStore'

export function useAdminRole() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.toUpperCase()

  return {
    isAdmin: role === 'ADMIN',
    isStaff: role === 'STAFF',
    canWrite: role === 'ADMIN', // chỉ ADMIN mới tạo/sửa/xóa
  }
}