'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Printer } from 'lucide-react'
import { DebtFormModal } from './DebtFormModal'
import { DebtHistory } from './DebtHistory'
import { InstallmentModal } from './InstallmentModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extracted Components
import { SummaryCards } from './SummaryCards'
import { DebtChart } from './DebtChart'
import { DebtFilters } from './DebtFilters'
import { DebtList } from './DebtList'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardClient() {
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

  // Calculate summaries
  let totalOwedToMe = 0
  let totalIOwe = 0

  if (debts && Array.isArray(debts)) {
    debts.forEach((debt: any) => {
      const isIDR = !debt.currency || debt.currency === 'IDR'
      if (debt.status !== 'paid' && isIDR) {
        const remaining = debt.amount - (debt.total_paid || 0)
        if (debt.type === 'owed_to_me') {
          totalOwedToMe += remaining
        } else if (debt.type === 'i_owe') {
          totalIOwe += remaining
        }
      }
    })
  }

  const net = totalOwedToMe - totalIOwe

  const handleMarkSettled = async (id: string, isSettled: boolean) => {
    if (!debts) return
    const updatedDebts = debts.map((d: any) => {
      if (d.id === id) {
        if (isSettled) {
          // Batal Lunas
          return { ...d, status: d.total_paid > 0 ? 'partial' : 'unpaid', settled_at: null }
        } else {
          // Tandai Lunas
          return { ...d, status: 'paid', settled_at: new Date().toISOString(), total_paid: d.amount }
        }
      }
      return d
    })
    
    // Optimistic update
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

  const generatePDF = () => {
    if (!debts || debts.length === 0) {
      alert('Tidak ada data untuk diekspor.')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 45)
    doc.text('Laporan Kasbon', pageWidth / 2, 22, { align: 'center' })
    
    // Tanggal Cetak
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    doc.text(`Tanggal Cetak: ${dateStr}`, 14, 32)
    
    doc.setDrawColor(220, 220, 220)
    doc.line(14, 35, pageWidth - 14, 35)

    // Summary Cards
    const cardY = 42
    const cardHeight = 28
    const margin = 14
    const totalWidth = pageWidth - 2 * margin
    const cardWidth = totalWidth / 3

    // Card 1
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(34, 197, 94)
    doc.rect(margin, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Dihutang ke Saya', margin + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(22, 163, 74)
    doc.text(formatRupiah(totalOwedToMe), margin + 5, cardY + 22)

    // Card 2
    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(239, 68, 68)
    doc.rect(margin + cardWidth, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Saya Hutang', margin + cardWidth + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(220, 38, 38)
    doc.text(formatRupiah(totalIOwe), margin + cardWidth + 5, cardY + 22)

    // Card 3
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(148, 163, 184)
    doc.rect(margin + 2 * cardWidth, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Saldo Netto', margin + 2 * cardWidth + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text(formatRupiah(net), margin + 2 * cardWidth + 5, cardY + 22)

    // Subtitle
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Rincian Transaksi', 14, cardY + cardHeight + 15)

    // Table Data
    let tableData: any[] = []
    
    debts.forEach((debt: any, index: number) => {
      const typeStr = debt.type === 'owed_to_me' ? 'Dihutang' : 'Hutang'
      const statusStr = debt.status === 'paid' ? 'Lunas' : debt.status === 'partial' ? 'Lunas Sebagian' : 'Belum Lunas'
      const txDateStr = new Date(debt.created_at).toLocaleDateString('id-ID')
      const catStr = debt.category?.name || '-'
      const amountStr = (!debt.currency || debt.currency === 'IDR') 
        ? formatRupiah(debt.amount) 
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount)
      
      const paidStr = (!debt.currency || debt.currency === 'IDR')
        ? formatRupiah(debt.total_paid || 0)
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.total_paid || 0)

      const remainingStr = (!debt.currency || debt.currency === 'IDR')
        ? formatRupiah(debt.amount - (debt.total_paid || 0))
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount - (debt.total_paid || 0))

      tableData.push([
        index + 1,
        debt.counterpart_name,
        typeStr,
        amountStr,
        paidStr,
        remainingStr,
        catStr,
        statusStr,
        txDateStr,
        debt.note || '-'
      ])
    })

    autoTable(doc, {
      startY: cardY + cardHeight + 20,
      head: [['No', 'Nama', 'Tipe', 'Nominal', 'Dibayar', 'Sisa', 'Kategori', 'Status', 'Tanggal', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [25, 30, 45], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      didParseCell: function(data: any) {
        if (data.section === 'body') {
          if (data.column.index === 2) {
            if (data.cell.raw === 'Dihutang') data.cell.styles.textColor = [22, 163, 74]
            else if (data.cell.raw === 'Hutang') data.cell.styles.textColor = [220, 38, 38]
          }
          if (data.column.index === 7) {
            if (data.cell.raw === 'Belum Lunas') data.cell.styles.textColor = [220, 38, 38]
            else if (data.cell.raw === 'Lunas Sebagian') data.cell.styles.textColor = [234, 88, 12]
            else if (data.cell.raw === 'Lunas') data.cell.styles.textColor = [22, 163, 74]
          }
        }
      }
    })

    doc.save('laporan-kasbon.pdf')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Kasbon</h1>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button onClick={generatePDF} variant="outline" className="flex-1 sm:flex-none">
            <Printer className="mr-2 h-4 w-4" />
            Cetak PDF
          </Button>
          <Button onClick={openNewModal} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Catat Baru
          </Button>
        </div>
      </div>

      <SummaryCards totalOwedToMe={totalOwedToMe} totalIOwe={totalIOwe} net={net} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <DebtChart totalOwedToMe={totalOwedToMe} totalIOwe={totalIOwe} />
        </div>

        <div className="lg:col-span-3">
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
        </div>
      </div>

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

