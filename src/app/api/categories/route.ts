import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  color: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('debt_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = categorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const validData = validationResult.data

    const { data, error } = await supabase
      .from('debt_categories')
      .insert({
        user_id: user.id,
        name: validData.name,
        color: validData.color,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/categories:', error)
    return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 })
  }
}
