'use client'
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaCalendarCheck } from 'react-icons/fa';

const AppointmentModal = dynamic(() => import('@/components/AppointmentModal'), { ssr: false });

export default function BookingButtonWithModal() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-white rounded-3xl shadow-2xl border border-blue-100 mb-12 overflow-hidden">
      {/* Decorative SVG Wave */}
      <svg className="absolute top-0 left-0 w-full h-8 text-cyan-200" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-2xl font-bold text-blue-800 mb-2 text-center drop-shadow-sm">
          Réservez votre service d'étanchéité en 1 minute !
        </div>
        <div className="text-gray-600 mb-4 text-center max-w-md">
          Profitez d'un diagnostic gratuit et d'une intervention rapide.<br />Nos experts sont à votre service !
        </div>
        <button
          className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-8 py-3 rounded-full shadow-xl hover:scale-105 hover:from-blue-700 hover:to-cyan-500 transition font-bold flex items-center gap-2 text-lg animate-pulse focus:outline-none focus:ring-4 focus:ring-cyan-200"
          onClick={() => setModalOpen(true)}
        >
          <FaCalendarCheck className="text-2xl animate-bounce-slow" />
          Prendre un rendez-vous
        </button>
      </div>
      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
} 