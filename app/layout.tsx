'use client'
import TopHeader from '@/components/shared/header/header1'
import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'
import '@/app/globals.css'
import { SessionProvider } from "next-auth/react"
import { signIn } from 'next-auth/react'

import ClientProviders from '@/components/shared/client-providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="w-full overflow-x-hidden">
      <body className="w-full min-h-screen flex flex-col">
        <SessionProvider>
        <TopHeader />
        <Header />
          <main className="flex-1 w-full">
          {children}
          </main>
        <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}