'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTime, formatRupiah } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import useSWR from 'swr'
import { Debt, Category, DebtHistoryItem } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DebtHistory({ debtId }: { debtId: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: categories } = useSWR('/api/categories', fetcher)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history/${debtId}`)
        if (!res.ok) throw new Error('Gagal memuat riwayat')
        const data = await res.json()
        setHistory(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memuat riwayat')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [debtId])

  if (isLoading) return <div className="py-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
  if (error) return <div className="text-red-500 text-xs py-2">{error}</div>
  if (history.length === 0) return <div className="text-gray-500 text-xs py-2">Belum ada riwayat perubahan.</div>

  const actionText = (action: string) => {
    switch(action) {
      case 'created': return 'Dibuat'
      case 'updated': return 'Diperbarui'
      case 'settled': return 'Ditandai lunas'
      case 'unsettled': return 'Batal lunas'
      case 'deleted': return 'Dihapus'
      default: return action
    }
  }

  const formatFieldLabel = (field: string) => {
    switch (field) {
      case 'counterpart_name': return 'Nama'
      case 'counterpart_phone': return 'No. HP'
      case 'type': return 'Tipe'
      case 'amount': return 'Nominal'
      case 'currency': return 'Mata Uang'
      case 'due_date': return 'Jatuh Tempo'
      case 'category_id': return 'Kategori'
      case 'note': return 'Catatan'
      case 'status': return 'Status'
      default: return field.replace('_', ' ')
    }
  }

  const formatFieldValue = (field: string, value: string | number) => {
    if (value === null || value === undefined || value === '') return '-'
    
    switch (field) {
      case 'category_id':
        if (categories) {
          const category = categories.find((c: Category) => c.id === value)
          return category ? category.name : value
        }
        return value
      case 'type':
        return value === 'owed_to_me' ? 'Dihutang ke Saya' : 'Saya Hutang'
      case 'amount':
        return formatRupiah(Number(value))
      case 'due_date':
        try {
          return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        } catch(e) {
          return value
        }
      case 'status':
        return value === 'paid' ? 'Lunas' : value === 'partial' ? 'Lunas Sebagian' : 'Belum Lunas'
      default:
        return String(value)
    }
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Riwayat Perubahan</h4>
      <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
        {history.map((h: DebtHistoryItem) => (
          <div key={h.id} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-3 py-1">
            <div className="font-medium text-gray-900">{actionText(h.action)}</div>
            <div className="text-gray-400 mb-1">{formatRelativeTime(h.created_at)}</div>
            {h.changed_fields && Object.keys(h.changed_fields).length > 0 && (
              <div className="mt-1 bg-gray-50 p-1.5 rounded space-y-1">
                {Object.entries(h.changed_fields).map(([field, vals]: [string, any]) => (
                  <div key={field} className="grid grid-cols-1 gap-0.5">
                    <span className="font-medium capitalize">{formatFieldLabel(field)}:</span>
                    <span className="text-gray-500 line-through">{formatFieldValue(field, vals.old)}</span>
                    <span className="text-green-600">{formatFieldValue(field, vals.new)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
