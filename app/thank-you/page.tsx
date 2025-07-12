// app/thank-you/page.tsx

'use client'

import Link from "next/link";
import { useEffect } from 'react'
import useCartStore from '@/hooks/use-cart-store'

const ThankYouPage = () => {
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart() // تصفير السلة عند الدخول للصفحة
  }, [clearCart])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">🎉 Merci !</h1>
      <p className="text-lg text-gray-700 mb-6">
        Votre commande a été passée avec succès.
      </p>

      <Link
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Retourner à l'accueil
      </Link>
    </div>
  );
};

export default ThankYouPage;
