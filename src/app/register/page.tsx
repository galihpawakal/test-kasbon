'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/login/actions'
import { SubmitButton } from '@/components/submit-button'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async (formData: FormData) => {
    const result = await signup(formData)
    if (result?.error) {
      toast.error(result.error)
    } else if (result?.success) {
      toast.success('Berhasil daftar akun Anda. Silakan login.')
      router.push('/login')
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/30">
            K
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Daftar Akun</h1>
          <p className="text-gray-500 text-sm mt-3">Buat akun Kasbon gratis untuk mulai mencatat.</p>
        </div>

        <form action={handleSignup} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1" htmlFor="name">
              Nama Lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Nama Anda"
              required
              className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="block text-sm font-medium text-gray-700 ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <SubmitButton className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all" pendingText="Mendaftar...">
              Daftar Sekarang
            </SubmitButton>
          </div>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
