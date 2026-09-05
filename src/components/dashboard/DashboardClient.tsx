'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { formatRupiah, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Loader2, Printer, Phone } from 'lucide-react'
import { DebtFormModal } from './DebtFormModal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    // amount_desc -> sort=amount, order=desc
    // created_at_desc -> sort=created_at, order=desc
    if (sort === 'created') {
      apiUrl += `sort=created_at&order=${order}&`
    } else {
      apiUrl += `sort=${sort}&order=${order}&`
    }
  }

  const { data: debts, error, isLoading, mutate } = useSWR(apiUrl, fetcher)
  const { data: categories } = useSWR('/api/categories', fetcher)

  // Calculate summaries
  let totalOwedToMe = 0
  let totalIOwe = 0

  if (debts && Array.isArray(debts)) {
    debts.forEach((debt: any) => {
      // Only count unresolved debts for the summary
      // Limit summary to IDR only as requested in Multi-Currency specs
      const isIDR = !debt.currency || debt.currency === 'IDR'
      if (!debt.settled_at && isIDR) {
        if (debt.type === 'owed_to_me') {
          totalOwedToMe += debt.amount
        } else if (debt.type === 'i_owe') {
          totalIOwe += debt.amount
        }
      }
    })
  }

  const net = totalOwedToMe - totalIOwe

  const chartData = [
    {
      name: 'Dihutang ke Saya',
      Amount: totalOwedToMe,
      color: '#16a34a' // Tailwind green-600
    },
    {
      name: 'Saya Hutang',
      Amount: totalIOwe,
      color: '#dc2626' // Tailwind red-600
    }
  ]

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

  const generatePDF = () => {
    if (!debts || debts.length === 0) {
      alert('Tidak ada data untuk diekspor.')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Header - Centered Title
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
    
    // Line separator
    doc.setDrawColor(220, 220, 220)
    doc.line(14, 35, pageWidth - 14, 35)

    // Summary Cards Dimensions
    const cardY = 42
    const cardHeight = 28
    const margin = 14
    const totalWidth = pageWidth - 2 * margin
    const cardWidth = totalWidth / 3

    // Card 1: Dihutang ke Saya
    doc.setFillColor(240, 253, 244) // bg-green-50
    doc.setDrawColor(34, 197, 94) // border-green-500
    doc.rect(margin, cardY, cardWidth, cardHeight, 'FD')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Dihutang ke Saya', margin + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(22, 163, 74) // text-green-600
    doc.text(formatRupiah(totalOwedToMe), margin + 5, cardY + 22)

    // Card 2: Saya Hutang
    doc.setFillColor(254, 242, 242) // bg-red-50
    doc.setDrawColor(239, 68, 68) // border-red-500
    doc.rect(margin + cardWidth, cardY, cardWidth, cardHeight, 'FD')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Saya Hutang', margin + cardWidth + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(220, 38, 38) // text-red-600
    doc.text(formatRupiah(totalIOwe), margin + cardWidth + 5, cardY + 22)

    // Card 3: Saldo Netto
    doc.setFillColor(248, 250, 252) // bg-slate-50
    doc.setDrawColor(148, 163, 184) // border-slate-400
    doc.rect(margin + 2 * cardWidth, cardY, cardWidth, cardHeight, 'FD')
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text('Saldo Netto', margin + 2 * cardWidth + 5, cardY + 8)
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59) // text-slate-800
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
      const statusStr = debt.settled_at ? 'Lunas' : 'Belum Lunas'
      const txDateStr = new Date(debt.created_at).toLocaleDateString('id-ID')
      const catStr = debt.category?.name || '-'
      const amountStr = (!debt.currency || debt.currency === 'IDR') 
        ? formatRupiah(debt.amount) 
        : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount)

      tableData.push([
        index + 1,
        debt.counterpart_name,
        typeStr,
        amountStr,
        catStr,
        statusStr,
        txDateStr,
        debt.note || '-'
      ])
    })

    autoTable(doc, {
      startY: cardY + cardHeight + 20,
      head: [['No', 'Nama', 'Tipe', 'Nominal', 'Kategori', 'Status', 'Tanggal', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [25, 30, 45], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        3: { halign: 'right' }
      },
      didParseCell: function(data: any) {
        if (data.section === 'body') {
          // Colorizing "Tipe" column
          if (data.column.index === 2) {
            if (data.cell.raw === 'Dihutang') {
              data.cell.styles.textColor = [22, 163, 74] // Green
            } else if (data.cell.raw === 'Hutang') {
              data.cell.styles.textColor = [220, 38, 38] // Red
            }
          }
          // Colorizing "Status" column
          if (data.column.index === 5) {
            if (data.cell.raw === 'Belum Lunas') {
              data.cell.styles.textColor = [220, 38, 38] // Red
            } else if (data.cell.raw === 'Lunas') {
              data.cell.styles.textColor = [22, 163, 74] // Green
            }
          }
        }
      }
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.setFont('helvetica', 'normal')
      doc.text(`Dicetak pada: ${dateStr} - Laporan Kasbon`, 14, doc.internal.pageSize.getHeight() - 10)
      doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
    }

    const fileName = `Laporan_Kasbon_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`
    doc.save(fileName)
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 print:p-0 print:max-w-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kasbon</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button onClick={generatePDF} variant="outline" className="shadow-sm flex-1 sm:flex-none">
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={openNewModal} className="shadow-sm flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Catat Baru
          </Button>
        </div>
      </div>
      
      {/* Print-only title */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Kasbon</h1>
        <p className="text-gray-500">Dicetak pada {new Date().toLocaleDateString('id-ID')}</p>
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

      {/* Bar Chart Comparison */}
      <Card className="mb-10 border-gray-200 shadow-sm print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Perbandingan Belum Lunas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#4b5563', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Total']}
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="Amount" radius={[0, 4, 4, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-4 mb-6 print:hidden">
        <div className="w-full lg:flex-1 relative">
          <input
            type="text"
            placeholder="Cari nama orang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent h-10"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-3 w-full lg:w-auto">
          <Select value={sortConfig} onValueChange={(val) => val && setSortConfig(val)}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white">
              <SelectValue placeholder="Urutkan">
                {sortConfig === 'created_desc' ? 'Terbaru' : 
                 sortConfig === 'created_asc' ? 'Terlama' :
                 sortConfig === 'amount_desc' ? 'Jumlah Terbesar' :
                 sortConfig === 'amount_asc' ? 'Jumlah Terkecil' : 'Urutkan'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Terbaru</SelectItem>
              <SelectItem value="created_asc">Terlama</SelectItem>
              <SelectItem value="amount_desc">Jumlah Terbesar</SelectItem>
              <SelectItem value="amount_asc">Jumlah Terkecil</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="w-full sm:w-[130px] bg-white">
              <SelectValue placeholder="Status">
                {statusFilter === 'semua' ? 'Semua Status' :
                 statusFilter === 'belum_lunas' ? 'Belum Lunas' :
                 statusFilter === 'lunas' ? 'Lunas' : 'Status'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
            <SelectTrigger className="w-full sm:w-[120px] bg-white">
              <SelectValue placeholder="Tipe">
                {typeFilter === 'semua' ? 'Semua Tipe' :
                 typeFilter === 'owed_to_me' ? 'Dihutang' :
                 typeFilter === 'i_owe' ? 'Hutang' : 'Tipe'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Tipe</SelectItem>
              <SelectItem value="owed_to_me">Dihutang</SelectItem>
              <SelectItem value="i_owe">Hutang</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
            <SelectTrigger className="w-full sm:w-[140px] bg-white">
              <SelectValue placeholder="Kategori">
                {categoryFilter === 'semua' ? 'Semua Kategori' : categories?.find((c: any) => c.id === categoryFilter)?.name || 'Kategori'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kategori</SelectItem>
              {categories?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1 justify-end sm:justify-start pt-1 sm:pt-0">
            <input 
              type="checkbox" 
              id="group-toggle"
              checked={isGrouped}
              onChange={(e) => setIsGrouped(e.target.checked)}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <label htmlFor="group-toggle" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
              Grup per Orang
            </label>
          </div>
        </div>
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

          {!isLoading && !isGrouped && debts?.map((debt: any) => (
            <DebtItem 
              key={debt.id} 
              debt={debt} 
              onMarkSettled={handleMarkSettled} 
              onEdit={openEditModal} 
              onDelete={handleDelete} 
            />
          ))}

          {!isLoading && isGrouped && Object.entries(
            debts?.reduce((acc: any, debt: any) => {
              if (!acc[debt.counterpart_name]) {
                acc[debt.counterpart_name] = { items: [], totalOwedToMe: 0, totalIOwe: 0 }
              }
              acc[debt.counterpart_name].items.push(debt)
              if (!debt.settled_at) {
                const isIDR = !debt.currency || debt.currency === 'IDR'
                if (isIDR) {
                  if (debt.type === 'owed_to_me') acc[debt.counterpart_name].totalOwedToMe += debt.amount
                  else if (debt.type === 'i_owe') acc[debt.counterpart_name].totalIOwe += debt.amount
                }
              }
              return acc
            }, {}) || {}
          ).map(([name, group]: [string, any]) => {
            const net = group.totalOwedToMe - group.totalIOwe
            return (
              <details key={name} className="group border-b border-gray-100 last:border-0">
                <summary className="p-4 sm:p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50/50 list-none marker:hidden">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
                    <Badge variant="outline" className="bg-gray-50">{group.items.length} catatan</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-0.5">Total Belum Lunas</div>
                      <div className={`font-bold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatRupiah(net)}
                      </div>
                    </div>
                    <div className="text-gray-400 group-open:rotate-180 transition-transform">▼</div>
                  </div>
                </summary>
                <div className="bg-gray-50/30 border-t border-gray-100 pb-2">
                  {group.items.map((debt: any) => (
                    <DebtItem 
                      key={debt.id} 
                      debt={debt} 
                      onMarkSettled={handleMarkSettled} 
                      onEdit={openEditModal} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              </details>
            )
          })}
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

function DebtItem({ debt, onMarkSettled, onEdit, onDelete }: { debt: any, onMarkSettled: any, onEdit: any, onDelete: any }) {
  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-gray-50/50 border-b border-gray-100 last:border-0 w-full overflow-hidden">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-lg truncate max-w-full sm:max-w-[250px]">{debt.counterpart_name}</h3>
          {debt.counterpart_phone && (
            <a 
              href={`https://wa.me/${debt.counterpart_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${debt.counterpart_name}, ini reminder bahwa kamu memiliki tagihan/kasbon yang belum lunas sebesar ${formatRupiah(debt.amount)}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-green-600 flex items-center text-sm gap-1 print:hidden"
              title="Kirim Tagihan WA"
            >
              <Phone className="h-3 w-3" />
              {debt.counterpart_phone}
            </a>
          )}
          <Badge variant="outline" className={debt.type === 'owed_to_me' ? 'bg-green-50 text-green-700 border-green-200 whitespace-nowrap' : 'bg-orange-50 text-orange-700 border-orange-200 whitespace-nowrap'}>
            {debt.type === 'owed_to_me' ? 'Dihutang' : 'Hutang'}
          </Badge>
          {debt.settled_at ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 whitespace-nowrap">Lunas</Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 whitespace-nowrap">Belum Lunas</Badge>
          )}
          {debt.category && (
            <Badge variant="outline" className="text-xs" style={{ borderColor: debt.category.color || '#e5e7eb', color: debt.category.color || '#374151' }}>
              {debt.category.name}
            </Badge>
          )}
          
          {/* Due date reminders */}
          {!debt.settled_at && debt.due_date && (() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const dueDate = new Date(debt.due_date)
            dueDate.setHours(0, 0, 0, 0)
            
            const diffTime = dueDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays < 0) {
              return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0">Terlambat {Math.abs(diffDays)} hari</Badge>
            } else if (diffDays <= 3) {
              return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-[10px] px-1.5 py-0 border-yellow-200">Jatuh tempo H-{diffDays}</Badge>
            }
            return null
          })()}
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
      
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0">
        <div className={`font-bold text-lg ${debt.type === 'owed_to_me' ? 'text-green-600' : 'text-red-600'} ${debt.settled_at ? 'line-through text-gray-400' : ''}`}>
          {(!debt.currency || debt.currency === 'IDR') 
            ? formatRupiah(debt.amount) 
            : new Intl.NumberFormat('en-US', { style: 'currency', currency: debt.currency }).format(debt.amount)}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-md print:hidden">
              <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMarkSettled(debt.id, !!debt.settled_at)}>
              {debt.settled_at ? 'Batal Lunas' : 'Tandai Lunas'}
            </DropdownMenuItem>
            
            {debt.counterpart_phone && !debt.settled_at && (
              <DropdownMenuItem 
                onClick={() => window.open(`https://wa.me/${debt.counterpart_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${debt.counterpart_name}, ini reminder bahwa kamu memiliki tagihan/kasbon yang belum lunas sebesar ${formatRupiah(debt.amount)}.`)}`, '_blank')}
                className="flex items-center cursor-pointer"
              >
                <Phone className="mr-2 h-4 w-4 text-green-600" />
                Kirim Tagihan WA
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => onEdit(debt)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(debt.id)}>
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
