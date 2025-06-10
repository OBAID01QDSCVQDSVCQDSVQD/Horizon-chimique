import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/order.actions'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  deliveryDateIndex: undefined,
}


interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => Promise<void>
  clearCart: () => void
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const existItem = items.find(
          (x) => x.clientId === item.clientId
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.clientId === item.clientId
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })
        return updatedCartItems.find((x) => x.clientId === item.clientId)?.clientId!
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const exist = items.find((x) => x.clientId === item.clientId)
        if (!exist) return
        const updatedCartItems = items.map((x) =>
          x.clientId === item.clientId
            ? { ...exist, quantity: quantity }
            : x
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })
      },
      removeItem: async (item: OrderItem) => {
        const { items } = get().cart
        const updatedCartItems = items.filter((x) => x.clientId !== item.clientId)
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
            })),
          },
        })
      },
      init: () => set({ cart: initialState }),
      clearCart: () => set({
        cart: {
          items: [],
          itemsPrice: 0,
          taxPrice: undefined,
          shippingPrice: undefined,
          totalPrice: 0,
          paymentMethod: undefined,
          deliveryDateIndex: undefined,
        }
      }),
    }),
    {
      name: 'cart-store',
    }
  )
)
export default useCartStore