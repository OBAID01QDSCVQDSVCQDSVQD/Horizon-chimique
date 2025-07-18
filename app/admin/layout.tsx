'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiPackage, FiList, FiSettings, FiShoppingCart, FiMenu, FiX, FiTag, FiCalendar, FiShield, FiFileText, FiTool, FiUser } from 'react-icons/fi'
import { useEffect, useState, useRef } from 'react'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

// تعريف ثابت لقائمة لوحة التحكم
const menuItems = [
  {
    title: 'Produits',
    href: '/admin/products',
    icon: FiPackage
  },
  {
    title: 'Commandes',
    href: '/admin/orders',
    icon: FiShoppingCart
  },
  {
    title: 'Rendez-vous',
    href: '/admin/appointments',
    icon: FiCalendar
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: FiUser
  },
  {
    title: 'Catégories',
    href: '/admin/categories',
    icon: FiList
  },
  {
    title: 'Attributs',
    href: '/admin/attributes',
    icon: FiTag
  },
  {
    title: 'Garanties',
    href: '/admin/garanties',
    icon: FiShield
  },
  {
    title: 'Maintenance',
    href: '/admin/maintenance',
    icon: FiTool
  },
  {
    title: 'Paramètres',
    href: '/admin/settings',
    icon: FiSettings
  },
  {
    title: 'Fiche Technique',
    href: '/admin/catalogues',
    icon: FiFileText
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isRedirectingRef = useRef(false); // New ref to track redirect status

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session object:', session);
    console.log('User role:', session?.user?.role);

    if (status === 'loading') return // Do nothing while loading

    // If already redirecting, prevent further pushes
    if (isRedirectingRef.current) {
        return;
    }

    if (!session || session.user?.role?.toLowerCase() !== 'admin') {
      console.log('Redirecting due to no session or non-admin role.');
      isRedirectingRef.current = true; // Set ref to true before redirecting
      router.push('/') // Redirect to home or login page if not admin
    }
  }, [session, status, router])

  if (status === 'loading' || !session || session.user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
        <Toaster 
          position="bottom-right"
          toastOptions={{
            success: {
              style: {
                background: '#10b981',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#ef4444',
              },
            },
          }}
        />
        <main className="flex flex-row flex-1">
          {/* Sidebar */}
          <div className="relative md:w-40 w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="fixed top-35 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white shadow-lg md:hidden focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              aria-label="Ouvrir le menu"
            >
              {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <div className={`absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-10 w-64 bg-white dark:bg-gray-900 shadow-lg
              ${isSidebarOpen ? 'fixed left-0 h-screen z-50 overflow-y-auto mt-33 md:relative md:h-auto md:overflow-visible' : ''}
            `}>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow md:hidden"
                aria-label="Fermer le menu"
              >
                <FiX className="w-6 h-6" />
              </button>
              <div className="p-4 mt-12 md:mt-0">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tableau de Bord</h1>
              </div>
              <nav className="mt-4">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 dark:border-blue-400' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 ml-3 flex-shrink-0" />
                      <span className="ml-3">{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
            {isSidebarOpen && (
              <div
                className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-0 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </div>
          {/* Main Content */}
          <div className="flex-1 overflow-auto flex justify-center">
            <div className="w-full scale-[0.85] origin-top md:px-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
} 