'use client'

import Link from 'next/link'
import { login } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    const result = await login(formData)
    if (result?.error) {
      toast.error(result.error)
    } else if (result?.success) {
      toast.success('Berhasil login')
      router.push('/')
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/30">
            K
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Selamat Datang</h1>
          <p className="text-gray-500 text-sm mt-3">Masuk ke akun Kasbon Anda untuk melanjutkan.</p>
        </div>

        <form action={handleLogin} className="flex flex-col gap-5">
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
              className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <SubmitButton className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all" pendingText="Masuk...">
              Masuk
            </SubmitButton>
          </div>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  )
}
