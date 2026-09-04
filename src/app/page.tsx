import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white rounded-md flex items-center justify-center font-bold text-xl">
              K
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Kasbon</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline-block">{user.email}</span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  )
}
