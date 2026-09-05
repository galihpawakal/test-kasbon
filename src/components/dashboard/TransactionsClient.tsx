'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DebtFormModal } from './DebtFormModal'
import { DebtHistory } from './DebtHistory'
import { InstallmentModal } from './InstallmentModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DebtFilters } from './DebtFilters'
import { DebtList } from './DebtList'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TransactionsClient() {
  const [statusFilter, setStatusFilter] = useState('semua')
  const [typeFilter, setTypeFilter] = useState('semua')
  const [categoryFilter, setCategoryFilter] = useState('semua')
  const [sortConfig, setSortConfig] = useState('created_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isGrouped, setIsGrouped] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<any>(null)
  const [historyDebt, setHistoryDebt] = useState<any>(null)
  const [installmentDebt, setInstallmentDebt] = useState<any>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Construct URL with query params
  let apiUrl = '/api/debts?'
  if (statusFilter !== 'semua') apiUrl += `status=${statusFilter}&`
  if (typeFilter !== 'semua') apiUrl += `type=${typeFilter}&`
  if (categoryFilter !== 'semua') apiUrl += `category=${categoryFilter}&`
  if (debouncedSearch) apiUrl += `search=${encodeURIComponent(debouncedSearch)}&`
  
  if (sortConfig) {
    const [sort, order] = sortConfig.split('_')
    if (sort === 'created') {
      apiUrl += `sort=created_at&order=${order}&`
    } else {
      apiUrl += `sort=${sort}&order=${order}&`
    }
  }

  const { data: debts, error, isLoading, mutate } = useSWR(apiUrl, fetcher)
  const { data: categories } = useSWR('/api/categories', fetcher)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, typeFilter, categoryFilter, sortConfig, isGrouped])

  // Pagination & Grouping logic
  const totalItems = debts?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedDebts = debts?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const groupedData = useMemo(() => {
    if (!debts || !isGrouped) return {}
    return debts.reduce((acc: any, debt: any) => {
      if (!acc[debt.counterpart_name]) {
        acc[debt.counterpart_name] = { items: [], totalOwedToMe: 0, totalIOwe: 0 }
      }
      acc[debt.counterpart_name].items.push(debt)
      if (debt.status !== 'paid') {
        const isIDR = !debt.currency || debt.currency === 'IDR'
        if (isIDR) {
          const remaining = debt.amount - (debt.total_paid || 0)
          if (debt.type === 'owed_to_me') acc[debt.counterpart_name].totalOwedToMe += remaining
          else if (debt.type === 'i_owe') acc[debt.counterpart_name].totalIOwe += remaining
        }
      }
      return acc
    }, {})
  }, [debts, isGrouped])

  const groupEntries = Object.entries(groupedData)
  const totalGroups = groupEntries.length
  const totalGroupPages = Math.ceil(totalGroups / itemsPerPage)
  const paginatedGroups = groupEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleMarkSettled = async (id: string, isSettled: boolean) => {
    if (!debts) return
    const updatedDebts = debts.map((d: any) => {
      if (d.id === id) {
        if (isSettled) {
          return { ...d, status: d.total_paid > 0 ? 'partial' : 'unpaid', settled_at: null }
        } else {
          return { ...d, status: 'paid', settled_at: new Date().toISOString(), total_paid: d.amount }
        }
      }
      return d
    })
    
    mutate(updatedDebts, false)
    
    try {
      const payload = isSettled 
        ? { status: updatedDebts.find((d: any) => d.id === id).status, settled_at: null }
        : { status: 'paid', settled_at: new Date().toISOString(), total_paid: debts.find((d: any) => d.id === id).amount }
      
      const res = await fetch(`/api/debts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Gagal update status')
    } catch (e) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaksi Kasbon</h1>
        <Button onClick={openNewModal}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Baru
        </Button>
      </div>

      <DebtFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        isGrouped={isGrouped}
        setIsGrouped={setIsGrouped}
      />

      <DebtList 
        isLoading={isLoading}
        error={error}
        isGrouped={isGrouped}
        paginatedDebts={paginatedDebts}
        paginatedGroups={paginatedGroups}
        totalGroups={totalGroups}
        totalItems={totalItems}
        currentPage={currentPage}
        totalPages={totalPages}
        totalGroupPages={totalGroupPages}
        setCurrentPage={setCurrentPage}
        handleMarkSettled={handleMarkSettled}
        openEditModal={openEditModal}
        setHistoryDebt={setHistoryDebt}
        setInstallmentDebt={setInstallmentDebt}
        handleDelete={handleDelete}
      />

      <DebtFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => mutate()}
        editingDebt={editingDebt}
      />
      
      <Dialog open={!!historyDebt} onOpenChange={(open) => !open && setHistoryDebt(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Riwayat Kasbon</DialogTitle>
          </DialogHeader>
          {historyDebt && <DebtHistory debtId={historyDebt.id} />}
        </DialogContent>
      </Dialog>
      
      <InstallmentModal 
        isOpen={!!installmentDebt}
        onClose={() => setInstallmentDebt(null)}
        debt={installmentDebt}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
