import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('HIT HISTORY ROUTE!')
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch history (RLS ensures user can only see their own history)
    const { data, error } = await supabase
      .from('debt_history')
      .select('*')
      .eq('debt_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in GET /api/debts/[id]/history:', error)
    return NextResponse.json({ error: 'Gagal mengambil riwayat' }, { status: 500 })
  }
}
