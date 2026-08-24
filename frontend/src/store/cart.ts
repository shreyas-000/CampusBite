import { create } from 'zustand'
import type { Cart } from '@/types'

type CartStore = {
  cart: Cart | null
  setCart: (cart: Cart) => void
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),
  itemCount: () => get().cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
}))
