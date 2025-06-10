import ClientProviders from '@/components/shared/client-providers'
import React from 'react'





export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      
      <main className='flex-1 flex flex-col p-4'>
      
      <ClientProviders>{children}</ClientProviders>
     
      </main>
      
    </div>
  )
}