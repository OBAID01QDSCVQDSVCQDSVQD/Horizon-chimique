'use server'

import { IUserSignIn } from '@/types'
import { UserSignUpSchema } from '@/lib/validator'
import { hashPassword } from '@/lib/utils'
import User from '@/lib/db/models/user.model'
import { connectToDatabase } from '@/lib/db'

export async function registerUser(data: any) {
  try {
    const parsed = UserSignUpSchema.parse(data)

    await connectToDatabase()

    const existing = await User.findOne({ email: parsed.email })
    if (existing) {
      return { success: false, message: 'Email already in use' }
    }

    const hashedPassword = await hashPassword(parsed.password)

    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: 'USER',
      emailVerified: false,
      whatsapp: parsed.whatsapp,
    })

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
