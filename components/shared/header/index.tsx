'use client'
import Image from 'next/image';
import Link from 'next/link';
import { FaMapMarkerAlt, FaUser, FaShoppingCart, FaGlobe } from 'react-icons/fa';
import Menu from './menu';

import { useState, useEffect } from 'react';
import { MoreVertical, User as UserIcon, Search } from 'lucide-react';
import { FaMoon, FaSun } from 'react-icons/fa';
import UserButton from './user-button';
import CartButton from './cart-button'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { IProduct } from '@/lib/db/models/product.model';

interface UserButtonProps {
  onClose?: () => void;
}

export default function Header() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('FR');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMounted, setIsMounted] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const user = null;
  const { data: session } = useSession();
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  // Ensure client-side only operations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearch) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedSearch)}&category=${selectedCategory}`
        );
        const data = await response.json();
        setSearchResults(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        setSearchResults([]);
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchProducts();
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories/list');
        if (!res.ok) {
          setCategories([]);
          return;
        }
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        setCategories([]);
        console.error('fetchCategories error:', error);
      }
    }
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`);
      setSearchOpen(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 bg-[#131921] text-white w-full">
        <div className="flex items-center justify-between px-2 md:px-4 py-1 w-full h-12 md:h-16">
          {/* Placeholder content for SSR */}
          <div className="flex items-center">
            <div className="w-[40px] h-[28px] md:w-[60px] md:h-[40px] bg-gray-600 rounded"></div>
          </div>
          <div className="hidden md:flex flex-1 mx-2 md:mx-4 h-8 md:h-10 max-w-xs md:max-w-2xl bg-gray-600 rounded"></div>
          <div className="flex items-center gap-1 md:gap-2 w-auto flex-shrink-0">
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-[#131921] text-white w-full">
      <div className="flex items-center justify-between px-2 md:px-4 py-1 w-full h-12 md:h-16">
        {/* يسار */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-1 mr-1 md:mr-2">
            <Image src="/icones/logo.svg" alt="Logo" width={40} height={28} className="object-contain md:w-[60px] md:h-[40px] w-[40px] h-[28px]" />
          </Link>
          <div className="hidden md:flex flex-col items-start justify-center px-2 cursor-pointer hover:underline">
            <span className="text-xs text-gray-300 leading-none flex items-center gap-1">
              <FaMapMarkerAlt className="inline-block mr-1 text-lg text-white" />
              Livraison à
            </span>
            <span className="font-bold text-sm text-white leading-none">Tunisie</span>
          </div>
        </div>
        {/* وسط */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-2 md:mx-4 h-8 md:h-10 max-w-xs md:max-w-2xl relative">
          <select 
            className="rounded-l-md bg-gray-100 text-gray-700 px-3 border-r border-gray-300 focus:outline-none text-xs w-32 md:w-40 h-full"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">Toutes les catégories</option>
            {Array.isArray(categories) && categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Rechercher des produits"
            className="px-2 md:px-4 py-1 bg-white text-black focus:outline-none text-xs md:text-sm h-full flex-1 min-w-[60px] max-w-[120px] md:min-w-0 md:max-w-2xl md:flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-[#febd69] hover:bg-yellow-400 text-black px-2 md:px-4 rounded-r-md flex items-center justify-center h-full"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* نتائج البحث */}
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-gray-500">Recherche en cours...</div>
              ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((product) => (
                    product.slug && (
                      <Link
                        key={product._id}
                        href={`/product/${product.slug}`}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100"
                        onClick={() => setSearchQuery('')}
                      >
                        <div className="w-12 h-12 relative">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.price} DT</div>
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              ) : (
                <div className="p-4 text-gray-500">Aucun résultat trouvé</div>
              )}
            </div>
          )}
        </form>

        {/* زر البحث للجوال فقط */}
        <button
          className="block md:hidden p-2 rounded-md bg-[#febd69]"
          aria-label="Recherche"
          onClick={() => setSearchOpen(true)}
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        {/* Returns & Orders بجانب البحث للموبايل فقط */}
        <Link href={session?.user?.id ? "/orders" : "/myorders2"} className="mx-2 text-yellow-400 flex-col items-start font-bold text-base hover:text-yellow-500 transition flex items-center md:hidden">
          <span className="text-xs">Retours</span>
          <span className="font-bold text-sm">& Commandes</span>
        </Link>
        {/* يمين */}
        <div className="flex items-center gap-1 md:gap-2 w-auto flex-shrink-0">
          {/* عناصر اليمين تظهر فقط في md وما فوق */}
          <div className="hidden md:flex items-center gap-1 px-2 cursor-pointer hover:underline">
            <FaGlobe className="text-xl" />
            <span className="text-xs font-bold">FR</span>
          </div>
          <div className="hidden md:flex items-center px-2">
            <UserButton />
          </div>
          <Link href={session?.user?.id ? "/orders" : "/myorders2"} className="hidden md:flex flex-col items-start px-2 cursor-pointer hover:underline">
            <span className="text-xs">Retours</span>
            <span className="font-bold text-sm">& Commandes</span>
          </Link>

          {/* أيقونة السلة للجوال */}
          <div className="md:hidden flex items-center">
            <CartButton />
          </div>
          {/* أيقونة السلة للشاشات الكبيرة */}
          <div className="hidden md:flex items-center">
            <CartButton />
          </div>

          {/* أيقونة الحساب للجوال في أقصى اليمين */}
          <div className="md:hidden flex items-center ml-auto">
            <UserButtonMobileIcon />
          </div>
          {/* أيقونة الثلاث نقاط للجوال */}
          <button className="block md:hidden ml-1 p-2" onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>
      <Menu />
      {/* نافذة البحث المنبثقة للجوال */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSearchOpen(false)} />
          <div className="relative bg-white rounded shadow-lg p-4 w-[90vw] max-w-xs flex flex-col gap-3 z-50">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSearchOpen(false)} aria-label="Fermer">
              &times;
            </button>
            <form
              className="flex flex-col gap-2"
              onSubmit={e => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value || '';
                const category = (e.currentTarget.elements.namedItem('category') as HTMLSelectElement)?.value || 'All';
                if (q.trim()) {
                  setSearchOpen(false);
                  router.push(`/search?q=${encodeURIComponent(q)}&category=${category}`);
                }
              }}
            >
              <select
                name="category"
                className="rounded bg-gray-100 text-gray-700 px-2 border border-gray-300 focus:outline-none text-xs h-10"
                defaultValue={selectedCategory}
              >
                <option value="All">Toutes les catégories</option>
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <input
                type="text"
                name="q"
                placeholder="Rechercher des produits"
                className="rounded bg-white text-black px-2 border border-gray-300 focus:outline-none text-sm h-10"
              />
              <button
                type="submit"
                className="bg-[#febd69] hover:bg-yellow-400 text-black rounded-md py-2 font-semibold"
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative bg-[#232F3E] w-64 h-full shadow-lg animate-slideInRight p-6 flex flex-col">
            <button className="absolute top-2 right-2 text-white" onClick={() => setDrawerOpen(false)} aria-label="Fermer">
              <span className="text-2xl">&times;</span>
            </button>
            <div className="mb-6 mt-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-white">Utilisateur</span>
                  <Link href="/sign-in" onClick={() => { }}>
                    Se déconnecter
                  </Link>
                </div>
              ) : (
                <button className="w-full bg-yellow-400 text-black font-bold py-2 rounded hover:bg-yellow-500 mb-2" onClick={() => { }}>
                  Se connecter
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mb-6">
              <button
                className="flex items-center gap-1 text-white hover:text-yellow-400 font-bold px-2 py-1 rounded transition border border-gray-600"
                onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
              >
                <FaGlobe />
                <span>{lang === 'FR' ? 'EN' : 'FR'}</span>
              </button>
              <button
                className="flex items-center gap-1 text-white hover:text-yellow-400 font-bold px-2 py-1 rounded transition border border-gray-600"
                onClick={toggleTheme}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
                <span>{darkMode ? 'Clair' : 'Sombre'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </header>
  );
}

export function UserButtonMobileIcon() {
  const [open, setOpen] = useState(false)
  const handleClose = () => setOpen(false)
  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-yellow-400/20 text-white"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
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
            <UserButton onClose={handleClose} />
          </div>
        </>
      )}
    </div>
  )
}