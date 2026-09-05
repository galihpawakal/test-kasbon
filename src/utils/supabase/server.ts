import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Jika server Next.js jalan di dalam Docker dan URL Supabase adalah localhost,
  // ubah ke host.docker.internal agar container bisa menghubungi host laptop Anda.
  if (process.env.NODE_ENV === 'development' && supabaseUrl.includes('localhost')) {
    supabaseUrl = supabaseUrl.replace('localhost', 'host.docker.internal')
  }

  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
