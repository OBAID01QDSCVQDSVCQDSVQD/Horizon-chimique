'use client'
import React, { useEffect, useState } from 'react'
import CartSidebar from './cart-sidebar'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsSidebarOpen(true)
    window.addEventListener('openCartSidebar', handler)
    return () => window.removeEventListener('openCartSidebar', handler)
  }, [])

  return (
    <SessionProvider>
      <>
        {isSidebarOpen ? (
          <div className='flex min-h-screen'>
            <div className='flex-1 overflow-hidden'>{children}</div>
            <CartSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        ) : (
          <div>{children}</div>
        )}
        <Toaster />
      </>
    </SessionProvider>
  )
}