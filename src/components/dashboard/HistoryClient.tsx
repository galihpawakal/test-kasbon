'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { formatRelativeTime, formatRupiah } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function HistoryClient() {
  const { data: history, error, isLoading } = useSWR('/api/history', fetcher)
  const { data: categories } = useSWR('/api/categories', fetcher)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">Gagal memuat riwayat.</div>
  }

  const actionText = (action: string) => {
    switch(action) {
      case 'created': return 'Dibuat'
      case 'updated': return 'Diperbarui'
      case 'settled': return 'Ditandai lunas'
      case 'unsettled': return 'Batal lunas'
      case 'deleted': return 'Dihapus'
      case 'payment_added': return 'Membayar cicilan'
      default: return action
    }
  }

  const formatFieldLabel = (field: string) => {
    switch (field) {
      case 'counterpart_name': return 'Nama'
      case 'counterpart_phone': return 'No. HP'
      case 'type': return 'Tipe'
      case 'amount': return 'Nominal Utang'
      case 'currency': return 'Mata Uang'
      case 'due_date': return 'Jatuh Tempo'
      case 'category_id': return 'Kategori'
      case 'note': return 'Catatan'
      case 'status': return 'Status'
      case 'payment_amount': return 'Nominal Cicilan'
      case 'payment_note': return 'Catatan Cicilan'
      default: return field.replace('_', ' ')
    }
  }

  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') return '-'
    
    switch (field) {
      case 'category_id':
        if (categories) {
          const category = categories.find((c: any) => c.id === value)
          return category ? category.name : value
        }
        return value
      case 'type':
        return value === 'owed_to_me' ? 'Dihutang ke Saya' : 'Saya Hutang'
      case 'amount':
      case 'payment_amount':
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

  const filteredHistory = history?.filter((h: any) => {
    const counterpartName = h.debts?.counterpart_name?.toLowerCase() || ''
    const action = actionText(h.action).toLowerCase()
    const q = search.toLowerCase()
    return counterpartName.includes(q) || action.includes(q)
  }) || []

  const totalItems = filteredHistory.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Perubahan</h1>
        <div className="w-full sm:w-64 shrink-0">
          <Input 
            placeholder="Cari nama atau aksi..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6 w-full">
        {paginatedHistory.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Belum ada riwayat perubahan yang sesuai.</div>
        ) : (
          <div className="space-y-8 sm:space-y-6 relative before:absolute before:top-0 before:bottom-0 before:left-[15px] before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent z-0">
            {paginatedHistory.map((h: any) => (
              <div key={h.id} className="relative flex items-start w-full min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 border border-blue-100 shrink-0 relative mr-3 sm:mr-4">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 gap-1">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900 truncate block sm:inline">{h.debts?.counterpart_name || 'Kasbon (Dihapus)'}</span>
                      <span className="text-gray-500 text-sm sm:ml-2 block sm:inline mt-0.5 sm:mt-0">&bull; {actionText(h.action)}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatRelativeTime(h.created_at)}</span>
                  </div>
                  
                  {h.changed_fields && Object.keys(h.changed_fields).length > 0 && (
                    <div className="mt-2 sm:mt-3 bg-white p-2.5 sm:p-3 rounded-md border border-gray-200 shadow-sm flex flex-col gap-3">
                      {Object.entries(h.changed_fields).map(([field, vals]: [string, any]) => (
                        <div key={field} className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] gap-1 sm:gap-2 text-xs sm:text-sm sm:items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                          <span className="font-medium text-gray-500 capitalize">{formatFieldLabel(field)}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                            {vals.old && (
                              <>
                                <span className="text-gray-400 line-through break-words whitespace-pre-wrap">{formatFieldValue(field, vals.old)}</span>
                                <span className="text-gray-300 hidden sm:inline shrink-0">&rarr;</span>
                              </>
                            )}
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium break-words whitespace-pre-wrap w-fit max-w-full">
                              {formatFieldValue(field, vals.new)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {(!isLoading && !error) && (
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Menampilkan {paginatedHistory.length} dari {totalItems} catatan
            </span>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                Prev
              </button>
              <button 
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
