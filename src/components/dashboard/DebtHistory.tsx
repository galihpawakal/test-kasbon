'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function DebtHistory({ debtId }: { debtId: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/debts/${debtId}/history`)
        if (!res.ok) throw new Error('Gagal memuat riwayat')
        const data = await res.json()
        setHistory(data)
      } catch (err: any) {
        setError(err.message)
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

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Riwayat Perubahan</h4>
      <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
        {history.map((h: any) => (
          <div key={h.id} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-3 py-1">
            <div className="font-medium text-gray-900">{actionText(h.action)}</div>
            <div className="text-gray-400 mb-1">{formatRelativeTime(h.created_at)}</div>
            {h.changed_fields && Object.keys(h.changed_fields).length > 0 && (
              <div className="mt-1 bg-gray-50 p-1.5 rounded space-y-1">
                {Object.entries(h.changed_fields).map(([field, vals]: [string, any]) => (
                  <div key={field} className="grid grid-cols-1 gap-0.5">
                    <span className="font-medium capitalize">{field.replace('_', ' ')}:</span>
                    <span className="text-gray-500 line-through">{String(vals.old || '-')}</span>
                    <span className="text-green-600">{String(vals.new || '-')}</span>
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
