import { create } from 'zustand'

const useAppStore = create((set) => ({
  pageReady: false,
  setPageReady: (val) => set({ pageReady: val }),
}))

export default useAppStore