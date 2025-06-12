import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/auth'
import GarantiesStatsCardWrapper from './GarantiesStatsCardWrapper'
import { FaUsers, FaCogs, FaChartBar, FaFileAlt } from 'react-icons/fa'

export default async function AdminPage() {
  const session = await getServerSession(authConfig)
  
  console.log('Admin Page: Session:', session)
  console.log('Admin Page: User Role:', session?.user?.role)

  if (!session) {
    console.log('Admin Page: No session, redirecting to signin')
    redirect('/sign-in')
  }

  const userRole = (session.user.role as string)?.toUpperCase()
  if (userRole !== 'ADMIN') {
    console.log('Admin Page: Access denied - User role:', session.user.role)
    redirect('/')
  }

  console.log('Admin Page: Access granted')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-blue-800 tracking-tight">Tableau de bord administrateur</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-blue-700"><FaUsers size={22} /><span className="text-lg font-semibold">Statistiques des utilisateurs</span></div>
            <div className="text-gray-700">Bonjour <b>{session.user.name}</b></div>
            <div className="text-gray-700">Rôle : <b>{session.user.role}</b></div>
            <div className="text-gray-700">Email : <b>{session.user.email}</b></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-purple-700"><FaFileAlt size={22} /><span className="text-lg font-semibold">Gestion du contenu</span></div>
            <div className="text-gray-500">Ajoutez, modifiez ou supprimez le contenu du site.</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-green-700"><FaCogs size={22} /><span className="text-lg font-semibold">Paramètres</span></div>
            <div className="text-gray-500">Gérez les paramètres de la plateforme.</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-yellow-700"><FaChartBar size={22} /><span className="text-lg font-semibold">Statistiques des garanties</span></div>
            <GarantiesStatsCardWrapper />
          </div>
        </div>
      </div>
    </div>
  )
} 