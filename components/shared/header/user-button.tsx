'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, UserIcon } from 'lucide-react'
import { FaUserShield } from 'react-icons/fa'

interface UserButtonProps {
  onClose?: () => void;
  isMobileOverlay?: boolean;
}

export default function UserButton({ onClose, isMobileOverlay }: UserButtonProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  // إذا كان overlay للجوال، القائمة تظهر دائماً (يتم التحكم بها من الخارج)
  const showDropdown = isMobileOverlay ? true : open;

  // دالة إغلاق موحدة
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div className={isMobileOverlay ? '' : 'relative'}>
      {!isMobileOverlay && (
        <button
          className="flex flex-col items-start px-2 cursor-pointer hover:underline focus:outline-none"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          type="button"
        >
          <span className="text-xs">
            Bonjour, {session ? session.user?.name || session.user?.email : 'se connecter'}
          </span>
          <span className="font-bold text-sm flex items-center gap-1">
            Compte & Listes <ChevronDown className="w-4 h-4 inline" />
          </span>
        </button>
      )}
      {showDropdown && (
        <div
          className={
            isMobileOverlay
              ? 'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xs bg-white text-black rounded shadow-lg border border-gray-200 py-4 min-w-[180px] flex flex-col items-center'
              : 'absolute right-0 mt-2 w-56 bg-white text-black rounded shadow-lg z-50 border border-gray-200 py-2 min-w-[180px]'
          }
        >
        {session ? (
            <>
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="font-bold flex items-center gap-2">
                  {session.user?.name}
                  {(session.user?.role === 'APPLICATEUR' || session.user?.role === 'ADMIN') && (
                    <FaUserShield className="text-blue-500" title={session.user?.role} />
                  )}
                </div>
                <div className="text-xs text-gray-500">{session.user?.email}</div>
              </div>
              <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100" onClick={handleClose}>Mon profil</Link>
              <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100" onClick={handleClose}>Mes commandes</Link>
              <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100" onClick={handleClose}>Mes commandes</Link>
              {session.user?.role === 'Admin' && (
                <Link href="/admin/overview" className="block px-4 py-2 hover:bg-gray-100" onClick={handleClose}>Administration</Link>
              )}
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); handleClose(); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  Se déconnecter
              </button>
            </>
        ) : (
            <>
              <Link href="/sign-in" className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600" onClick={handleClose}>Se connecter</Link>
              <div className="px-4 py-2 text-xs text-gray-500">Nouveau client ?</div>
              <Link href="/sign-up" className="block px-4 py-2 hover:bg-gray-100" onClick={handleClose}>Créer un compte</Link>
            </>
          )}
              </div>
        )}
    </div>
  )
}

export function UserButtonMobileIcon() {
  const [open, setOpen] = useState(false)
  const handleClose = () => setOpen(false)
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
        <>
          {/* خلفية شفافة تغطي الشاشة لإغلاق القائمة عند النقر خارجها */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleClose}
          />
          <div
            className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xs bg-white text-black rounded shadow-lg border border-gray-200 py-4 min-w-[180px] flex flex-col items-center"
          >
            <UserButton onClose={handleClose} isMobileOverlay={true} />
          </div>
        </>
      )}
    </div>
  )
}
