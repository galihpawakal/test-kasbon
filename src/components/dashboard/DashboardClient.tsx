'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { formatRupiah, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Loader2 } from 'lucide-react'
import { DebtFormModal } from './DebtFormModal'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardClient() {
  const [statusFilter, setStatusFilter] = useState('semua')
  const [typeFilter, setTypeFilter] = useState('semua')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<any>(null)

  // Construct URL with query params
  let apiUrl = '/api/debts?'
  if (statusFilter !== 'semua') apiUrl += `status=${statusFilter}&`
  if (typeFilter !== 'semua') apiUrl += `type=${typeFilter}&`

  const { data: debts, error, isLoading, mutate } = useSWR(apiUrl, fetcher)

  // Calculate summaries
  let totalOwedToMe = 0
  let totalIOwe = 0

  if (debts && Array.isArray(debts)) {
    debts.forEach((debt: any) => {
      // Only count unresolved debts for the summary (or should we count all? The requirement usually means unresolved)
      if (!debt.settled_at) {
        if (debt.type === 'owed_to_me') {
          totalOwedToMe += debt.amount
        } else if (debt.type === 'i_owe') {
          totalIOwe += debt.amount
        }
      }
    })
  }

  const net = totalOwedToMe - totalIOwe

  const handleMarkSettled = async (id: string, isSettled: boolean) => {
    if (!debts) return
    const updatedDebts = debts.map((d: any) =>
      d.id === id ? { ...d, settled_at: isSettled ? null : new Date().toISOString() } : d
    )
    
    // Optimistic update
    mutate(updatedDebts, false)
    
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settled_at: isSettled ? null : new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Gagal update status')
    } catch (e) {
      // Revert if error
      mutate()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan ini?')) return
    
    if (!debts) return
    const updatedDebts = debts.filter((d: any) => d.id !== id)
    mutate(updatedDebts, false)
    
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal hapus')
    } catch (e) {
      mutate()
    }
  }

  const openEditModal = (debt: any) => {
    setEditingDebt(debt)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setEditingDebt(null)
    setIsModalOpen(true)
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kasbon</h1>
        <Button onClick={openNewModal} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Catat Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Dihutang ke Saya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalOwedToMe)}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Saya Hutang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalIOwe)}</div>
          </CardContent>
        </Card>
        
        <Card className={`border-gray-200 shadow-sm ${net > 0 ? 'bg-green-50/50' : net < 0 ? 'bg-red-50/50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatRupiah(net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tipe</SelectItem>
            <SelectItem value="owed_to_me">Dihutang</SelectItem>
            <SelectItem value="i_owe">Hutang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card className="shadow-sm border-gray-200">
        <div className="divide-y divide-gray-100">
          {isLoading && (
            <div className="p-8 flex justify-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center text-red-500">
              Gagal memuat data.
            </div>
          )}

          {!isLoading && !error && debts?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Belum ada catatan.
            </div>
          )}

          {!isLoading && debts?.map((debt: any) => (
            <div key={debt.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-gray-50/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{debt.counterpart_name}</h3>
                  <Badge variant="outline" className={debt.type === 'owed_to_me' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                    {debt.type === 'owed_to_me' ? 'Dihutang' : 'Hutang'}
                  </Badge>
                  {debt.settled_at ? (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">Lunas</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Belum Lunas</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>{formatRelativeTime(debt.created_at)}</span>
                  {debt.note && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]" title={debt.note}>{debt.note}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className={`font-bold text-lg ${debt.type === 'owed_to_me' ? 'text-green-600' : 'text-red-600'} ${debt.settled_at ? 'line-through text-gray-400' : ''}`}>
                  {formatRupiah(debt.amount)}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-md">
                      <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMarkSettled(debt.id, !!debt.settled_at)}>
                      {debt.settled_at ? 'Batal Lunas' : 'Tandai Lunas'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditModal(debt)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(debt.id)}>
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <DebtFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()} 
        editingDebt={editingDebt} 
      />
    </div>
  )
}
