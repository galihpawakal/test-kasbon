import Link from 'next/link'
import { signup } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Kasbon</h1>
          <p className="text-gray-500 text-sm mt-2">Buat akun untuk mulai mencatat utang piutang.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nama Lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Nama Anda"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

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
            <Button formAction={signup} className="w-full">
              Daftar Akun Baru
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-black hover:underline">
              Masuk di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
