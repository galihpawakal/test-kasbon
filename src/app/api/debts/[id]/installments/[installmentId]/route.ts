import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { installmentSchema } from '@/lib/validations/debt'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  try {
    const { id, installmentId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('id', installmentId)
      .eq('debt_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/debts/[id]/installments/[installmentId]:', error)
    return NextResponse.json({ error: 'Gagal menghapus cicilan' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; installmentId: string }> }
) {
  try {
    const { id, installmentId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const partialSchema = installmentSchema.partial()
    const validationResult = partialSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const validData: any = validationResult.data

    if (validData.amount !== undefined) {
      // Fetch current debt and the old installment to validate overpayment properly
      const { data: currentDebt, error: fetchError } = await supabase
        .from('debts')
        .select('amount, total_paid')
        .eq('id', id)
        .single()

      const { data: currentInstallment, error: fetchInstError } = await supabase
        .from('installments')
        .select('amount')
        .eq('id', installmentId)
        .single()

      if (fetchError || fetchInstError) {
        return NextResponse.json({ error: 'Gagal memvalidasi data utang' }, { status: 500 })
      }

      // The new remaining amount if this installment was temporarily removed
      const remainingAmountWithoutThis = currentDebt.amount - (currentDebt.total_paid - currentInstallment.amount)

      if (validData.amount > remainingAmountWithoutThis) {
        return NextResponse.json(
          { error: `Nominal cicilan (Rp ${validData.amount.toLocaleString('id-ID')}) melebihi sisa utang maksimal (Rp ${remainingAmountWithoutThis.toLocaleString('id-ID')})` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from('installments')
      .update(validData)
      .eq('id', installmentId)
      .eq('debt_id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Data tidak ditemukan atau akses ditolak' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in PATCH /api/debts/[id]/installments/[installmentId]:', error)
    return NextResponse.json({ error: 'Gagal memperbarui cicilan' }, { status: 500 })
  }
}
