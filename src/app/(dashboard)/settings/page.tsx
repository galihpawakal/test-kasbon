import { SettingsClient } from '@/components/dashboard/SettingsClient'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SettingsClient userEmail={user.email || ''} />
  )
}

