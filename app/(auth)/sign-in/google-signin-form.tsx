'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { FcGoogle } from 'react-icons/fc'

export default function GoogleSignInForm({ text = 'Sign in with Google' }: { text?: string }) {
  const [pending, setPending] = useState(false)
  const handleGoogleSignIn = async () => {
    setPending(true)
    await signIn('google', { callbackUrl: '/' })
    setPending(false)
  }
  return (
    <Button
      className="w-full flex items-center justify-center gap-3 bg-[#db4437] hover:bg-[#c33d2e] text-white font-bold py-2 rounded min-h-[44px] text-base"
      disabled={pending}
      onClick={handleGoogleSignIn}
      type="button"
    >
      <span className="flex items-center justify-center bg-white rounded-full w-7 h-7">
        <FcGoogle className="text-xl" />
      </span>
      <span className="flex-1 text-center">{pending ? 'Redirecting to Google...' : text}</span>
    </Button>
  )
} 