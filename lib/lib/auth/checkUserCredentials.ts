import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { compare } from 'bcryptjs'

export async function checkUserCredentials({ email, password }: { email?: string, password?: string }) {
  await connectToDatabase()
  if (!email || !password) return null

  const user = await User.findOne({ email })
  if (!user || !user.password) return null

  const isValid = await compare(password, user.password)
  if (!isValid) return null

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}
