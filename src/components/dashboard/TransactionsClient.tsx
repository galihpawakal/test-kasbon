'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DebtFormModal } from './DebtFormModal'
import { DebtHistory } from './DebtHistory'
import { InstallmentModal } from './InstallmentModal'
import { DebtFilters } from './DebtFilters'
import { DebtList } from './DebtList'
import { Debt, Category, Installment } from '@/types'

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
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null)
  const [installmentDebt, setInstallmentDebt] = useState<Debt | null>(null)
  
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
    return debts.reduce((acc: Record<string, { items: Debt[], totalOwedToMe: number, totalIOwe: number }>, debt: Debt) => {
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

  const groupEntries = Object.entries(groupedData) as [string, { totalOwedToMe: number; totalIOwe: number; items: Debt[] }][]
  const totalGroups = groupEntries.length
  const totalGroupPages = Math.ceil(totalGroups / itemsPerPage)
  const paginatedGroups = groupEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleMarkSettled = async (id: string, isSettled: boolean) => {
    if (!debts) return
    const updatedDebts = debts.map((d: Debt) => {
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
        ? { status: updatedDebts.find((d: Debt) => d.id === id).status, settled_at: null }
        : { status: 'paid', settled_at: new Date().toISOString(), total_paid: debts.find((d: Debt) => d.id === id).amount }
      
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
    
    const updatedDebts = debts.filter((d: Debt) => d.id !== id)
    mutate(updatedDebts, false)
    
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal hapus')
    } catch (e) {
      mutate()
    }
  }

  const scrollToForm = () => {
    setTimeout(() => {
      document.getElementById('transaction-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const openEditModal = (debt: Debt) => {
    setHistoryDebt(null)
    setInstallmentDebt(null)
    setEditingDebt(debt)
    setIsModalOpen(true)
    scrollToForm()
  }

  const openNewModal = () => {
    setHistoryDebt(null)
    setInstallmentDebt(null)
    setEditingDebt(null)
    setIsModalOpen(true)
    scrollToForm()
  }

  const handleOpenHistory = (debt: Debt) => {
    setIsModalOpen(false)
    setInstallmentDebt(null)
    setHistoryDebt(debt)
    scrollToForm()
  }

  const handleOpenInstallment = (debt: Debt) => {
    setIsModalOpen(false)
    setHistoryDebt(null)
    setInstallmentDebt(debt)
    scrollToForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaksi Kasbon</h1>
        {!isModalOpen && !historyDebt && !installmentDebt && (
          <Button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Catat Baru
          </Button>
        )}
      </div>

      <div id="transaction-top" className="scroll-mt-6"></div>

      {/* Inline Forms */}
      {isModalOpen && (
        <DebtFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => mutate()}
          editingDebt={editingDebt || undefined}
        />
      )}
      
      {installmentDebt && (
        <InstallmentModal 
          isOpen={!!installmentDebt}
          onClose={() => setInstallmentDebt(null)}
          debt={installmentDebt}
          onSuccess={() => mutate()}
        />
      )}

      {historyDebt && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Riwayat Kasbon</h2>
              <p className="text-sm text-gray-500">Catatan untuk {historyDebt.counterpart_name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setHistoryDebt(null)}>Tutup</Button>
          </div>
          <DebtHistory debtId={historyDebt.id} />
        </div>
      )}

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
        setHistoryDebt={handleOpenHistory}
        setInstallmentDebt={handleOpenInstallment}
        handleDelete={handleDelete}
      />
    </div>
  )
}
