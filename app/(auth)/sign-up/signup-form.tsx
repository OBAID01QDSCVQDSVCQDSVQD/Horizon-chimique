'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignUpSchema } from '@/lib/validator'
import { IUserSignUp } from '@/types'
import { registerUser } from '@/lib/actions/user.actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { signIn } from 'next-auth/react'

export default function SignUpForm() {
  const router = useRouter()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      whatsapp: '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const onSubmit = async (data: IUserSignUp) => {
    setError(null)
    setSuccess(null)
    const res = await registerUser(data)
    if (res.success) {
      setSuccess('✔️ Account created successfully. Logging you in...')
      const loginRes = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (loginRes?.ok) {
        router.push('/')
      } else {
        setError('Account created, but login failed. Please sign in manually.')
      }
    } else {
      setError(res.message || '❌ Registration failed')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-[500px] mx-auto bg-white p-6 rounded shadow"
    >
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>

      {success && <div className="text-green-600 font-bold">{success}</div>}
      {error && <div className="text-red-600 font-bold">{error}</div>}

      <div>
        <label className="block mb-1 font-medium">Name</label>
        <Input {...register('name')} />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Email</label>
        <Input {...register('email')} />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">WhatsApp</label>
        <Input {...register('whatsapp')} />
        {errors.whatsapp && (
          <span className="text-red-500 text-sm">
            {errors.whatsapp.message}
          </span>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Password</label>
        <Input type="password" {...register('password')} />
        {errors.password && (
          <span className="text-red-500 text-sm">
            {errors.password.message}
          </span>
        )}
      </div>

      <div>
        <label className="block mb-1 font-medium">Confirm Password</label>
        <Input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && (
          <span className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded mt-2"
      >
        {isSubmitting ? 'Creating...' : 'Create Account'}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
      >
        Sign in with Google
      </button>
    </form>
  )
}
