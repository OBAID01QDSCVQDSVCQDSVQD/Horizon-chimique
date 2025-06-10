import User from '@/lib/db/models/user.model'
import { compare } from 'bcryptjs'
import { connectToDatabase } from '@/lib/db'

export async function checkUserCredentials(credentials: { email?: string, password?: string }) {
  if (!credentials?.email || !credentials?.password) return null

  await connectToDatabase()

  // ابحث عن المستخدم بالإيميل
  const user = await User.findOne({ email: credentials.email })
  if (!user) return null

  // تحقق من كلمة السر
  const isValid = await compare(credentials.password, user.password)
  if (!isValid) return null

  // أرجع بيانات المستخدم (بدون كلمة السر)
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
  }
}
