import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { installmentSchema } from '@/lib/validations/debt'
import { formatRupiah } from '@/lib/utils'

export async function GET(
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

    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('debt_id', id)
      .order('paid_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Error in GET /api/debts/[id]/installments:', error)
    return NextResponse.json({ error: 'Gagal mengambil riwayat cicilan' }, { status: 500 })
  }
}

export async function POST(
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
    const validationResult = installmentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const validData = validationResult.data

    // 1. Fetch current debt to validate overpayment
    const { data: currentDebt, error: fetchError } = await supabase
      .from('debts')
      .select('amount, total_paid, currency')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Gagal memvalidasi data utang' }, { status: 500 })
    }

    const remainingAmount = currentDebt.amount - currentDebt.total_paid

    if (validData.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Nominal cicilan (${formatRupiah(validData.amount, currentDebt.currency)}) melebihi sisa utang (${formatRupiah(remainingAmount, currentDebt.currency)})` },
        { status: 400 }
      )
    }

    // 2. Insert installment
    const { data, error } = await supabase
      .from('installments')
      .insert({
        ...validData,
        debt_id: id,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    
    // 3. Log history for the payment
    await supabase.from('debt_history').insert({
      debt_id: id,
      user_id: user.id,
      action: 'payment_added',
      changed_fields: {
        payment_amount: { old: null, new: validData.amount },
        ...(validData.note ? { payment_note: { old: null, new: validData.note } } : {})
      }
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    console.error('Error in POST /api/debts/[id]/installments:', error)
    return NextResponse.json({ error: 'Gagal mencatat cicilan' }, { status: 500 })
  }
}

