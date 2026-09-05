import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { debtSchema } from '@/lib/validations/debt'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Parse payload
    const body = await request.json()

    // Special case for "Tandai lunas" which might only send settled_at
    // We will validate only provided fields
    const partialSchema = debtSchema.partial()
    const validationResult = partialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const validData = validationResult.data

    // Field explicitly sent in body (from client optimistic UI)
    // Now handled natively by Zod schema

    // If explicitly updating amount, validate against total_paid
    if (validData.amount !== undefined) {
      const { data: currentDebt, error: fetchError } = await supabase
        .from('debts')
        .select('total_paid')
        .eq('id', id)
        .single()
        
      if (fetchError) {
        return NextResponse.json({ error: 'Gagal memvalidasi data utang' }, { status: 500 })
      }
      
      if (validData.amount < currentDebt.total_paid) {
        return NextResponse.json(
          { error: `Nominal utang tidak boleh lebih kecil dari total yang sudah dibayar (${currentDebt.total_paid})` },
          { status: 400 }
        )
      }
    }

    // 3. Update DB (RLS ensures user can only update their own row)
    const { data, error } = await supabase
      .from('debts')
      .update(validData)
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
    console.error('Error in PATCH /api/debts/[id]:', error)
    return NextResponse.json({ error: 'Gagal memperbarui data utang' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Delete from DB
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error in DELETE /api/debts/[id]:', error)
    return NextResponse.json({ error: 'Gagal menghapus data utang' }, { status: 500 })
  }
}
