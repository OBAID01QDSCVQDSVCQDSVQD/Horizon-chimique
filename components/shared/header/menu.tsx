'use client'

import Link from 'next/link'
import data from '@/lib/data'
import { MenuIcon, X, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import UserButton from './user-button'
import { useSession } from 'next-auth/react'


export default function Menu() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession();

  return (
    <>
      {/* شريط المينيو */}
      <div className="w-full bg-[#232F3E] h-10 flex items-center px-4">
        {/* زر Menu للشاشات الصغيرة */}
        <button
          className="flex items-center gap-1 text-white font-bold px-2 py-1 hover:text-yellow-400 transition h-full md:hidden"
          onClick={() => setOpen(true)}
        >
          <MenuIcon className="w-5 h-5" />
          <span>Menu</span>
        </button>
        {/* نص Hello واسم المستخدم للجوال */}
        <HelloUser />
        {/* القائمة الأفقية للشاشات المتوسطة وما فوق */}
        <nav className="gap-2 items-center h-full hidden md:flex">
          <Link href="/" className="flex items-center gap-1 text-white font-bold px-2 py-1 hover:text-yellow-400 transition h-full">
            <MenuIcon className="w-5 h-5" />
            <span>Accueil</span>
          </Link>
          {data.headerMenus.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-white hover:text-yellow-400 font-medium px-2 py-1 transition h-full"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      {/* النافذة الجانبية (Drawer) */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* خلفية شفافة لإغلاق النافذة */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {/* محتوى النافذة */}
          <div className="relative bg-[#232F3E] w-64 h-full shadow-lg animate-slideInLeft p-6 flex flex-col">
            <button className="absolute top-2 right-2 text-white" onClick={() => setOpen(false)} aria-label="Fermer">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MenuIcon className="w-5 h-5" />
              Menu
            </h2>
            <nav className="flex flex-col gap-3">
              {data.headerMenus.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-yellow-400 font-medium px-2 py-2 rounded transition"
                  onClick={() => setOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      {/* أنيميشن للنافذة */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </>
  )
}

// مكون أيقونة الحساب للجوال
function UserButtonMobileIcon() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-yellow-400/20 text-white"
        onClick={() => setOpen((v) => !v)}
        aria-label="Compte"
        type="button"
      >
        <UserIcon className="w-6 h-6" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded shadow-lg z-50 border border-gray-200 py-2 min-w-[180px]">
          <UserButton />
        </div>
      )}
    </div>
  )
}

function HelloUser() {
  'use client'
  const { data: session } = useSession();
  return (
    <div className="md:hidden flex items-center ml-2 text-white font-bold text-sm">
      Bonjour{session && session.user?.name ? `, ${session.user.name}` : ''}
    </div>
  );
}



