'use client'

import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaGoogle, FaCog } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <footer className="bg-[#2d3442] text-white pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Logo & Description */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image src="/icones/logo.svg" alt="bazaar logo" width={60} height={60} />
            <span className="text-2xl font-bold">SI OBAID</span>
          </div>
          <p className="text-gray-300 mb-6 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Auctor libero id et, in gravida. Sit diam duis mauris nulla cursus. Erat et lectus vel ut sollicitudin elit at amet.
          </p>
          <div className="flex gap-3">
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Image src="/google-play-badge.png" alt="Google Play" width={140} height={40} />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Image src="/app-store-dma-apple.png" alt="App Store" width={140} height={40} />
            </a>
          </div>
        </div>
        {/* À propos de nous */}
        <div>
          <h3 className="font-bold text-lg mb-4">À propos de nous</h3>
          <ul className="space-y-2 text-gray-300">
            <li><Link href="#">Carrières</Link></li>
            <li><Link href="#">Nos magasins</Link></li>
            <li><Link href="#">Nos engagements</Link></li>
            <li><Link href="#">Termes & Conditions</Link></li>
            <li><Link href="#">Politique de confidentialité</Link></li>
          </ul>
        </div>
        {/* Service client */}
        <div>
          <h3 className="font-bold text-lg mb-4">Service client</h3>
          <ul className="space-y-2 text-gray-300">
            <li><Link href="#">Centre d'aide</Link></li>
            <li><Link href="#">Suivre votre commande</Link></li>
            <li><Link href="#">Achats en gros & entreprises</Link></li>
            <li><Link href="#">Retours & Remboursements</Link></li>
          </ul>
        </div>
        {/* Contact */}
        <div>
          <h3 className="font-bold text-lg mb-4">Contact</h3>
          <p className="text-gray-300 text-sm mb-2">Route Attar Mornaguia la manouba Tunisie</p>
          <p className="text-gray-300 text-sm mb-2">Email : Contact@sdkbatiment.tn</p>
          <p className="text-gray-300 text-sm mb-4">Téléphone : +216 53520222</p>
          <div className="flex gap-3 mb-4">
            <a href="#" className="bg-[#232936] p-2 rounded-full hover:bg-[#3b4252] transition"><FaTwitter /></a>
            <a href="#" className="bg-[#232936] p-2 rounded-full hover:bg-[#3b4252] transition"><FaFacebook /></a>
            <a href="#" className="bg-[#232936] p-2 rounded-full hover:bg-[#3b4252] transition"><FaInstagram /></a>
            <a href="#" className="bg-[#232936] p-2 rounded-full hover:bg-[#3b4252] transition"><FaYoutube /></a>
            <a href="#" className="bg-[#232936] p-2 rounded-full hover:bg-[#3b4252] transition"><FaGoogle /></a>
          </div>
          <div className="flex justify-end">
            {isMounted && (
              <button className="bg-[#232936] p-3 rounded-xl shadow-lg hover:bg-[#3b4252] transition">
                <FaCog className="text-xl" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}