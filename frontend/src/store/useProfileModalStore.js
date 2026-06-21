import { create } from 'zustand'

const useProfileModalStore = create((set) => ({
  isOpen: false,
  initialTab: 'profile', // 'profile' | 'address'
  openProfileModal: (tab = 'profile') => set({ isOpen: true, initialTab: tab }),
  closeProfileModal: () => set({ isOpen: false }),
}))

export default useProfileModalStore