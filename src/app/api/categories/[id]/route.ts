import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  color: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = categorySchema.partial().safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('debt_categories')
      .update(validationResult.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Data tidak ditemukan atau akses ditolak' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in PATCH /api/categories/[id]:', error)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('debt_categories')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/categories/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
