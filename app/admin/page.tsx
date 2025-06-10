import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authConfig } from '@/auth'

export default async function AdminPage() {
  const session = await getServerSession(authConfig)
  
  console.log('Admin Page: Session:', session)
  console.log('Admin Page: User Role:', session?.user?.role)

  if (!session) {
    console.log('Admin Page: No session, redirecting to signin')
    redirect('/auth/signin')
  }

  const userRole = (session.user.role as string)?.toUpperCase()
  if (userRole !== 'ADMIN') {
    console.log('Admin Page: Access denied - User role:', session.user.role)
    redirect('/')
  }

  console.log('Admin Page: Access granted')

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">إحصائيات المستخدمين</h2>
          <p>مرحباً {session.user.name}</p>
          <p>دورك: {session.user.role}</p>
          <p>البريد الإلكتروني: {session.user.email}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">إدارة المحتوى</h2>
          {/* أضف المحتوى هنا */}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">الإعدادات</h2>
          {/* أضف المحتوى هنا */}
        </div>
      </div>
    </div>
  )
} 