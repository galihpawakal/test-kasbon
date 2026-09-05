import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { debtSchema } from '@/lib/validations/debt'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    let query = supabase
      .from('debts')
      .select('*, category:debt_categories(id, name, color)')
      .order(sort, { ascending: order === 'asc' })

    if (type && (type === 'owed_to_me' || type === 'i_owe')) {
      query = query.eq('type', type)
    }

    const category = searchParams.get('category')
    if (category && category !== 'semua') {
      query = query.eq('category_id', category)
    }

    if (status && status !== 'semua') {
      if (status === 'belum_lunas') query = query.eq('status', 'unpaid')
      else if (status === 'lunas_sebagian') query = query.eq('status', 'partial')
      else if (status === 'lunas') query = query.eq('status', 'paid')
    }

    if (search) {
      query = query.ilike('counterpart_name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/debts:', error)
    return NextResponse.json({ error: 'Gagal mengambil data utang' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate payload
    const body = await request.json()
    const validationResult = debtSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const validData = validationResult.data

    // 3. Insert into DB (RLS ensures user_id must match auth.uid())
    const { data, error } = await supabase
      .from('debts')
      .insert({
        ...validData,
        user_id: user.id, // Set the user_id explicitly
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/debts:', error)
    return NextResponse.json({ error: 'Gagal mencatat data utang' }, { status: 500 })
  }
}
