'use server'

import { redirect } from 'next/navigation'

export const signInWithGoogle = async () => {
  // إعادة التوجيه إلى Google OAuth
  redirect('/sign-in')
}
