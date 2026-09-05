export type DebtType = 'owed_to_me' | 'i_owe'
export type DebtStatus = 'unpaid' | 'partial' | 'paid'

export interface Category {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  type: DebtType
  amount: number
  currency: string
  counterpart_name: string
  counterpart_phone: string | null
  note: string | null
  due_date: string | null
  status: DebtStatus
  category_id: string | null
  category?: Category
  total_paid: number
  created_at: string
  updated_at: string
}

export interface Installment {
  id: string
  debt_id: string
  user_id: string
  amount: number
  note: string | null
  paid_at: string
  created_at: string
}

export interface DebtHistoryItem {
  id: string
  debt_id: string
  user_id: string
  action: string
  changed_fields: Record<string, any>
  created_at: string
  debts?: {
    counterpart_name: string
  }
}
