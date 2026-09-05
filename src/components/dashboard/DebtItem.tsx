import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Phone, Calendar, AlignLeft } from 'lucide-react'
import { formatRupiah, formatRelativeTime } from '@/lib/utils'

interface DebtItemProps {
  debt: any
  onMarkSettled: (id: string, isSettled: boolean) => void
  onEdit: (debt: any) => void
  onHistory: (debt: any) => void
  onInstallment: (debt: any) => void
  onDelete: (id: string) => void
}

export function DebtItem({ debt, onMarkSettled, onEdit, onHistory, onInstallment, onDelete }: DebtItemProps) {
  
  const percentage = debt.amount > 0 ? Math.min(Math.round(((debt.total_paid || 0) / debt.amount) * 100), 100) : 0
  const isPaid = debt.status === 'paid'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4 transition-shadow hover:shadow-md w-full overflow-hidden">
      {/* Top Section: Info & Amount */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Left: Name and Badges */}
        <div className="flex-1 min-w-0 w-full space-y-3">
          
          {/* Baris 1: Nama & WA */}
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-gray-900 text-xl truncate max-w-full sm:max-w-[300px]">
              {debt.counterpart_name}
            </h3>
            {debt.counterpart_phone && (
              <a 
                href={`https://wa.me/${debt.counterpart_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${debt.counterpart_name}, ini reminder bahwa kamu memiliki tagihan/kasbon yang belum lunas.\nTotal hutang: ${formatRupiah(debt.amount)}${debt.total_paid > 0 ? `\nSudah dibayar: ${formatRupiah(debt.total_paid)}\nSisa tagihan: ${formatRupiah(debt.amount - debt.total_paid)}` : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-2 py-1 rounded-md transition-colors flex items-center text-sm font-medium gap-1.5 print:hidden border border-gray-100 hover:border-green-200"
                title="Kirim Tagihan WA"
              >
                <Phone className="h-3.5 w-3.5" />
                {debt.counterpart_phone}
              </a>
            )}
          </div>

          {/* Baris 2: Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`whitespace-nowrap font-medium ${debt.type === 'owed_to_me' ? 'bg-transparent text-green-700 border-green-500' : 'bg-transparent text-red-700 border-red-500'}`}>
              {debt.type === 'owed_to_me' ? 'Dihutang ke Saya' : 'Saya Hutang'}
            </Badge>
            
            {debt.status === 'paid' ? (
              <Badge className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap border-none">Lunas</Badge>
            ) : debt.status === 'partial' ? (
              <Badge className="bg-orange-500 text-white hover:bg-orange-600 whitespace-nowrap border-none">Lunas Sebagian</Badge>
            ) : (
              <Badge className="bg-red-600 text-white hover:bg-red-700 whitespace-nowrap border-none">Belum Lunas</Badge>
            )}
            
            {debt.category && (
              <Badge variant="outline" style={{ backgroundColor: debt.category.color ? `${debt.category.color}15` : '#f3f4f6', borderColor: debt.category.color ? `${debt.category.color}40` : '#e5e7eb', color: debt.category.color || '#374151' }}>
                {debt.category.name}
              </Badge>
            )}
            
            {debt.status !== 'paid' && debt.due_date && (() => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const dueDate = new Date(debt.due_date)
              dueDate.setHours(0, 0, 0, 0)
              const isOverdue = today > dueDate
              const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              
              if (isOverdue) {
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">Lewat {Math.abs(diffDays)} hari</Badge>
              } else if (diffDays <= 7) {
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">Sisa {diffDays} hari</Badge>
              } else {
                return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-medium">Sisa {diffDays} hari</Badge>
              }
            })()}
          </div>

          {/* Baris 3: Waktu & Catatan */}
          <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeTime(debt.created_at)}
            </span>
            {debt.note && (
              <>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="flex items-center gap-1.5 text-gray-600 line-clamp-1 break-all" title={debt.note}>
                  <AlignLeft className="w-3.5 h-3.5 shrink-0" />
                  {debt.note}
                </span>
              </>
            )}
          </div>
          
        </div>

        {/* Right: Amount & Actions */}
        <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
          <div className={`font-bold text-xl md:text-2xl tracking-tight ${debt.type === 'owed_to_me' ? 'text-green-600' : 'text-red-600'} ${isPaid ? 'opacity-50 line-through' : ''}`}>
            {debt.type === 'owed_to_me' ? '+' : '-'}{(!debt.currency || debt.currency === 'IDR') 
              ? formatRupiah(debt.amount) 
              : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount)}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full transition-colors print:hidden focus:outline-none focus:ring-2 focus:ring-gray-200">
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl">
              {debt.status !== 'paid' && (
                <DropdownMenuItem onClick={() => onMarkSettled(debt.id, false)} className="py-2 cursor-pointer font-medium text-green-700 focus:text-green-800 focus:bg-green-50">
                  Tandai Lunas
                </DropdownMenuItem>
              )}
              {debt.status === 'paid' && (
                <DropdownMenuItem onClick={() => onMarkSettled(debt.id, true)} className="py-2 cursor-pointer font-medium text-orange-700 focus:text-orange-800 focus:bg-orange-50">
                  Batal Lunas
                </DropdownMenuItem>
              )}
              
              {debt.counterpart_phone && debt.status !== 'paid' && (
                <DropdownMenuItem 
                  onClick={() => window.open(`https://wa.me/${debt.counterpart_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${debt.counterpart_name}, ini reminder bahwa kamu memiliki tagihan/kasbon yang belum lunas.\nTotal hutang: ${formatRupiah(debt.amount)}${debt.total_paid > 0 ? `\nSudah dibayar: ${formatRupiah(debt.total_paid)}\nSisa tagihan: ${formatRupiah(debt.amount - debt.total_paid)}` : ''}`)}`, '_blank')}
                  className="py-2 cursor-pointer flex items-center text-blue-700 focus:text-blue-800 focus:bg-blue-50"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Kirim Tagihan WA
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onEdit(debt)} className="py-2 cursor-pointer">
                Edit Catatan
              </DropdownMenuItem>
              {debt.status !== 'paid' && (
                <DropdownMenuItem onClick={() => onInstallment(debt)} className="py-2 cursor-pointer">
                  Catat Cicilan Baru
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onHistory(debt)} className="py-2 cursor-pointer">
                Riwayat Perubahan
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="py-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 font-medium border-t border-gray-100 rounded-none mt-1" 
                onClick={() => onDelete(debt.id)}
              >
                Hapus Catatan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom Section: Progress Bar */}
      {debt.amount > 0 && debt.status !== 'unpaid' && (
        <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-gray-50">
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Telah dibayar: {formatRupiah(debt.total_paid || 0)}</span>
            <span className={isPaid ? 'text-green-600 font-bold' : 'text-orange-600'}>{percentage}% Terbayar</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${isPaid ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
