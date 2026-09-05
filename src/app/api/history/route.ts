import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('debt_history')
      .select('*, debts ( counterpart_name, type )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in GET /api/history:', error)
    return NextResponse.json({ error: 'Gagal mengambil riwayat global' }, { status: 500 })
  }
}
