'use client'
import { FaFacebook, FaInstagram, FaTwitter, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '@/lib/use-theme';

export default function TopHeader() {
  const { theme, toggleTheme, isMounted } = useTheme();

  if (!isMounted) return null;

  return (
    <div className="w-full bg-[#2d3442] text-white text-sm h-10 flex items-center justify-between px-6">
      {/* يسار */}
      <div className="flex items-center gap-3">
        <span className="bg-[#232936] text-xs font-bold px-3 py-1 rounded-full">HOT</span>
        <span>Free Express Shipping</span>
      </div>
      {/* يمين */}
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-1 cursor-pointer hover:text-yellow-400 focus:outline-none"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
        </button>
        <a href="#" className="hover:text-gray-300"><FaTwitter /></a>
        <a href="#" className="hover:text-gray-300"><FaFacebook /></a>
        <a href="#" className="hover:text-gray-300"><FaInstagram /></a>
      </div>
    </div>
  );
}
