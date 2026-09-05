import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { DebtItem } from './DebtItem'
import { formatRupiah } from '@/lib/utils'
import { Debt, Installment } from '@/types'

interface DebtListProps {
  isLoading: boolean
  error: Error | null
  isGrouped: boolean
  paginatedDebts: Debt[]
  paginatedGroups: [string, { totalOwedToMe: number; totalIOwe: number; items: Debt[] }][]
  totalGroups: number
  totalItems: number
  currentPage: number
  totalPages: number
  totalGroupPages: number
  setCurrentPage: (page: number) => void
  handleMarkSettled: (id: string, isSettled: boolean) => void
  openEditModal: (debt: Debt) => void
  setHistoryDebt: (debt: Debt) => void
  setInstallmentDebt: (debt: Debt) => void
  handleDelete: (id: string) => void
}

export function DebtList({
  isLoading,
  error,
  isGrouped,
  paginatedDebts,
  paginatedGroups,
  totalGroups,
  totalItems,
  currentPage,
  totalPages,
  totalGroupPages,
  setCurrentPage,
  handleMarkSettled,
  openEditModal,
  setHistoryDebt,
  setInstallmentDebt,
  handleDelete
}: DebtListProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Memuat data...
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500 bg-white rounded-xl border border-gray-200 shadow-sm">
          Gagal memuat data kasbon.
        </div>
      ) : (!isGrouped && paginatedDebts?.length === 0) || (isGrouped && paginatedGroups.length === 0) ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
          Belum ada catatan kasbon yang sesuai filter nih.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!isGrouped && paginatedDebts?.map((debt: Debt) => (
            <DebtItem 
              key={debt.id} 
              debt={debt} 
              onMarkSettled={handleMarkSettled} 
              onEdit={openEditModal} 
              onHistory={setHistoryDebt}
              onInstallment={setInstallmentDebt}
              onDelete={handleDelete} 
            />
          ))}

          {isGrouped && paginatedGroups.map(([name, group]: [string, any]) => {
            const net = group.totalOwedToMe - group.totalIOwe
            return (
              <details key={name} className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" open>
                <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-gray-50 bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-gray-900 text-lg">{name}</div>
                    <div className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      {group.items.length} catatan
                    </div>
                  </div>
                  <div className={`font-semibold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {net > 0 ? 'Surplus ' : net < 0 ? 'Minus ' : 'Lunas '} 
                    {formatRupiah(Math.abs(net))}
                  </div>
                </summary>
                <div className="bg-gray-50/30 p-4 border-t border-gray-100 flex flex-col gap-3">
                  {group.items.map((debt: Debt) => (
                    <DebtItem 
                      key={debt.id} 
                      debt={debt} 
                      onMarkSettled={handleMarkSettled} 
                      onEdit={openEditModal} 
                      onHistory={setHistoryDebt}
                      onInstallment={setInstallmentDebt}
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {(!isLoading && !error) && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between print:hidden">
          <span className="text-sm text-gray-500">
            Menampilkan {isGrouped ? paginatedGroups.length : paginatedDebts?.length} dari {isGrouped ? totalGroups : totalItems} {isGrouped ? 'grup' : 'catatan'}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.min(isGrouped ? totalGroupPages : totalPages, currentPage + 1))}
              disabled={currentPage === (isGrouped ? totalGroupPages : totalPages)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
