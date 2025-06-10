'use client'

import { ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import useIsMounted from '@/hooks/use-is-mounted'
import { cn } from '@/lib/utils'
import useCartStore from '@/hooks/use-cart-store'
import useDeviceType from '@/hooks/use-device-type'
import CartSidebar from '../cart-sidebar'
import { useRef, useState, useEffect } from 'react'

export default function CartButton() {
  const isMounted = useIsMounted()
  const deviceType = useDeviceType()
  const {
    cart: { items },
  } = useCartStore()
  const cartItemsCount = items.reduce((a, c) => a + c.quantity, 0)
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // إغلاق النافذة عند الضغط خارجها
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Handle close with animation
  function handleClose() {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
    }, 250)
  }

  if (deviceType === 'desktop') {
    return (
      <div className='relative' ref={popoverRef}>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='px-1 header-button'
        >
          <div className='flex items-end text-xs relative'>
            <ShoppingCartIcon className='h-8 w-8' />
            {isMounted && (
              <span
                className={cn(
                  `bg-black px-1 rounded-full text-primary text-base font-bold absolute right-[30px] top-[-4px] z-10`,
                  cartItemsCount >= 10 && 'text-sm px-0 p-[1px]'
                )}
              >
                {cartItemsCount}
              </span>
            )}
            <span className='font-bold'>Cart</span>
          </div>
        </button>
        {open && (
          <div
            className={cn(
              'absolute right-0 mt-2 z-50 shadow-2xl rounded-xl border bg-white',
              isClosing ? 'animate-popover-out' : 'animate-popover'
            )}
            style={{ minWidth: 320, maxWidth: 360 }}
          >
            <CartSidebar onClose={handleClose} />
          </div>
        )}
        <style jsx global>{`
          @keyframes popover {
            0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes popover-out {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
          }
          .animate-popover {
            animation: popover 0.25s cubic-bezier(0.4,0,0.2,1);
          }
          .animate-popover-out {
            animation: popover-out 0.25s cubic-bezier(0.4,0,0.2,1);
          }
        `}</style>
      </div>
    )
  }
  // موبايل: رابط لصفحة الكارت
  return (
    <Link href='/cart' className='px-1 header-button'>
      <div className='flex items-end text-xs relative'>
        <ShoppingCartIcon className='h-8 w-8' />
        {isMounted && (
          <span
            className={cn(
              `bg-black px-1 rounded-full text-primary text-base font-bold absolute right-[30px] top-[-4px] z-10`,
              cartItemsCount >= 10 && 'text-sm px-0 p-[1px]'
            )}
          >
            {cartItemsCount}
          </span>
        )}
        <span className='font-bold'>Cart</span>
      </div>
    </Link>
  )
}
