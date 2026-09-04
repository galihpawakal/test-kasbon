import Link from 'next/link'
import { login } from './actions'
import { SubmitButton } from '@/components/submit-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kasbon</h1>
          <p className="text-gray-500 text-sm mt-2">Catat utang piutang dengan mudah.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100">
            {success}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <SubmitButton formAction={login} className="w-full" pendingText="Masuk...">
              Masuk
            </SubmitButton>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-black hover:underline">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
