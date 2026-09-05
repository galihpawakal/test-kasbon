'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatRupiah } from '@/lib/utils'
import { Printer, FileText, Loader2, Download, ArrowUp, ArrowDown, PieChart as PieChartIcon, Calendar, SearchX } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ReportsClient() {
  const { data: debts, isLoading: loadingDebts } = useSWR('/api/debts', fetcher)
  const { data: categories, isLoading: loadingCategories } = useSWR('/api/categories', fetcher)

  // Filter States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryId, setCategoryId] = useState('semua')
  const [type, setType] = useState('semua')
  const [status, setStatus] = useState('semua')

  // Sorting State
  const [sortCol, setSortCol] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Loading State for Debounce
  const [isFiltering, setIsFiltering] = useState(false)
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleFilterChange = (setter: any, value: any) => {
    setter(value)
    setIsFiltering(true)
    setCurrentPage(1)
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
    filterTimeoutRef.current = setTimeout(() => {
      setIsFiltering(false)
    }, 300)
  }

  const setPreset = (presetType: string) => {
    const today = new Date()
    let start = ''
    let end = ''

    if (presetType !== 'all') {
      const startDateObj = new Date(today)
      const endDateObj = new Date(today)

      if (presetType === 'this_month') {
        startDateObj.setDate(1)
      } else if (presetType === 'last_month') {
        startDateObj.setMonth(today.getMonth() - 1)
        startDateObj.setDate(1)
        endDateObj.setMonth(today.getMonth())
        endDateObj.setDate(0)
      } else if (presetType === 'last_3_months') {
        startDateObj.setMonth(today.getMonth() - 3)
      }
      
      // format to YYYY-MM-DD local time
      const offsetStart = startDateObj.getTimezoneOffset()
      startDateObj.setMinutes(startDateObj.getMinutes() - offsetStart)
      start = startDateObj.toISOString().split('T')[0]

      const offsetEnd = endDateObj.getTimezoneOffset()
      endDateObj.setMinutes(endDateObj.getMinutes() - offsetEnd)
      end = endDateObj.toISOString().split('T')[0]
    }

    setStartDate(start)
    setEndDate(end)
    setIsFiltering(true)
    setCurrentPage(1)
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current)
    filterTimeoutRef.current = setTimeout(() => setIsFiltering(false), 300)
  }

  const filteredDebts = useMemo(() => {
    if (!debts) return []
    return debts.filter((debt: any) => {
      let match = true
      
      if (categoryId !== 'semua' && debt.category_id !== categoryId) match = false
      if (type !== 'semua' && debt.type !== type) match = false
      
      if (status !== 'semua') {
        if (status === 'lunas' && debt.status !== 'paid') match = false
        if (status === 'lunas_sebagian' && debt.status !== 'partial') match = false
        if (status === 'belum_lunas' && debt.status !== 'unpaid') match = false
      }
      
      if (startDate) {
        const debtDate = new Date(debt.created_at)
        const filterStart = new Date(startDate)
        filterStart.setHours(0, 0, 0, 0)
        if (debtDate < filterStart) match = false
      }
      
      if (endDate) {
        const debtDate = new Date(debt.created_at)
        const filterEnd = new Date(endDate)
        filterEnd.setHours(23, 59, 59, 999)
        if (debtDate > filterEnd) match = false
      }
      
      return match
    })
  }, [debts, startDate, endDate, categoryId, type, status])

  const sortedDebts = useMemo(() => {
    return [...filteredDebts].sort((a, b) => {
      let valA = a[sortCol]
      let valB = b[sortCol]

      if (sortCol === 'category') {
        valA = a.category?.name || ''
        valB = b.category?.name || ''
      }
      if (sortCol === 'status') {
        valA = a.status === 'paid' ? 3 : a.status === 'partial' ? 2 : 1
        valB = b.status === 'paid' ? 3 : b.status === 'partial' ? 2 : 1
      }
      if (sortCol === 'due_date') {
        valA = a.due_date ? new Date(a.due_date).getTime() : 0
        valB = b.due_date ? new Date(b.due_date).getTime() : 0
      }
      if (sortCol === 'remaining') {
        valA = a.amount - (a.total_paid || 0)
        valB = b.amount - (b.total_paid || 0)
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredDebts, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  const totalItems = sortedDebts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedDebts = sortedDebts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  let totalOwedToMe = 0
  let totalIOwe = 0
  let totalTransactions = totalItems
  
  let lunasCount = 0
  let lunasSebagianCount = 0
  let belumLunasCount = 0

  sortedDebts.forEach((debt: any) => {
    const isIDR = !debt.currency || debt.currency === 'IDR'
    if (debt.status !== 'paid' && isIDR) {
      const remaining = debt.amount - (debt.total_paid || 0)
      if (debt.type === 'owed_to_me') totalOwedToMe += remaining
      else if (debt.type === 'i_owe') totalIOwe += remaining
    }
    
    if (debt.status === 'paid') lunasCount++
    else if (debt.status === 'partial') lunasSebagianCount++
    else belumLunasCount++
  })

  const chartData = [
    { name: 'Belum Lunas', value: belumLunasCount, color: '#ef4444' },
    { name: 'Lunas Sebagian', value: lunasSebagianCount, color: '#f97316' },
    { name: 'Lunas', value: lunasCount, color: '#22c55e' }
  ].filter(d => d.value > 0)

  const generatePDF = () => {
    if (!sortedDebts || sortedDebts.length === 0) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 45)
    doc.text('Laporan Kasbon', pageWidth / 2, 22, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    
    let infoY = 32
    if (startDate || endDate) {
      doc.text(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`, 14, infoY)
      infoY += 6
    }
    
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, infoY)
    
    doc.setDrawColor(220, 220, 220)
    doc.line(14, infoY + 3, pageWidth - 14, infoY + 3)

    const cardY = infoY + 10
    const cardHeight = 28
    const margin = 14
    const totalWidth = pageWidth - 2 * margin
    const cardWidth = totalWidth / 3

    // Cards
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(34, 197, 94)
    doc.rect(margin, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50)
    doc.text('Dihutang ke Saya', margin + 5, cardY + 8)
    doc.setFontSize(14)
    doc.setTextColor(22, 163, 74)
    doc.text(formatRupiah(totalOwedToMe), margin + 5, cardY + 22)

    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(239, 68, 68)
    doc.rect(margin + cardWidth, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.text('Saya Hutang', margin + cardWidth + 5, cardY + 8)
    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38)
    doc.text(formatRupiah(totalIOwe), margin + cardWidth + 5, cardY + 22)

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(148, 163, 184)
    doc.rect(margin + 2 * cardWidth, cardY, cardWidth, cardHeight, 'FD')
    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.text('Jumlah Transaksi', margin + 2 * cardWidth + 5, cardY + 8)
    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text(`${totalTransactions} trx`, margin + 2 * cardWidth + 5, cardY + 22)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Rincian Transaksi', 14, cardY + cardHeight + 15)

    let tableData: any[] = []
    
    sortedDebts.forEach((debt: any, index: number) => {
      const typeStr = debt.type === 'owed_to_me' ? 'Dihutang' : 'Hutang'
      const statusStr = debt.status === 'paid' ? 'Lunas' : debt.status === 'partial' ? 'Sebagian' : 'Belum'
      const txDateStr = new Date(debt.created_at).toLocaleDateString('id-ID')
      const catStr = debt.category?.name || '-'
      const amountStr = formatRupiah(debt.amount)
      const paidStr = formatRupiah(debt.total_paid || 0)
      const remainingStr = formatRupiah(debt.amount - (debt.total_paid || 0))

      tableData.push([
        index + 1,
        debt.counterpart_name,
        typeStr,
        amountStr,
        paidStr,
        remainingStr,
        catStr,
        statusStr,
        txDateStr
      ])
    })

    autoTable(doc, {
      startY: cardY + cardHeight + 20,
      head: [['No', 'Nama', 'Tipe', 'Nominal', 'Dibayar', 'Sisa', 'Kategori', 'Status', 'Tanggal']],
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
    })

    doc.save('laporan-kasbon.pdf')
  }

  const generateCSV = () => {
    if (!sortedDebts || sortedDebts.length === 0) return

    const headers = ['No', 'Nama', 'Tipe', 'Nominal', 'Dibayar', 'Sisa', 'Kategori', 'Status', 'Tanggal', 'Keterangan']
    const rows = sortedDebts.map((debt: any, index: number) => {
      const typeStr = debt.type === 'owed_to_me' ? 'Dihutang' : 'Hutang'
      const statusStr = debt.status === 'paid' ? 'Lunas' : debt.status === 'partial' ? 'Lunas Sebagian' : 'Belum Lunas'
      const txDateStr = new Date(debt.created_at).toLocaleDateString('id-ID')
      const catStr = debt.category?.name || '-'
      const remaining = debt.amount - (debt.total_paid || 0)
      
      return [
        index + 1,
        `"${debt.counterpart_name}"`,
        `"${typeStr}"`,
        debt.amount,
        debt.total_paid || 0,
        remaining,
        `"${catStr}"`,
        `"${statusStr}"`,
        `"${txDateStr}"`,
        `"${debt.note ? debt.note.replace(/"/g, '""') : '-'}"`
      ].join(',')
    })

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "laporan-kasbon.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span className="opacity-0 group-hover:opacity-50 inline-block ml-1"><ArrowDown className="h-3 w-3" /></span>
    return sortDir === 'asc' 
      ? <span className="inline-block ml-1 text-blue-600"><ArrowUp className="h-3 w-3" /></span>
      : <span className="inline-block ml-1 text-blue-600"><ArrowDown className="h-3 w-3" /></span>
  }

  if (loadingDebts || loadingCategories) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan & Ekspor</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateCSV} variant="outline" className="flex-shrink-0 bg-white" disabled={totalItems === 0 || isFiltering}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={generatePDF} className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white" disabled={totalItems === 0 || isFiltering}>
            <Printer className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Filter Laporan</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('this_month')} className="h-7 text-xs bg-gray-100 hover:bg-gray-200">Bulan Ini</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('last_month')} className="h-7 text-xs bg-gray-100 hover:bg-gray-200">Bulan Lalu</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('last_3_months')} className="h-7 text-xs bg-gray-100 hover:bg-gray-200">3 Bulan Terakhir</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('all')} className="h-7 text-xs bg-gray-100 hover:bg-gray-200">Semua Waktu</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start_date" className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Dari Tanggal</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                type="date" 
                id="start_date" 
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_date" className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Sampai Tanggal</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                type="date" 
                id="end_date" 
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type" className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Tipe</Label>
            <select
              id="type"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={type}
              onChange={(e) => handleFilterChange(setType, e.target.value)}
            >
              <option value="semua">Semua Tipe</option>
              <option value="owed_to_me">Dihutang (Uang Masuk)</option>
              <option value="i_owe">Saya Hutang (Uang Keluar)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Status</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={(e) => handleFilterChange(setStatus, e.target.value)}
            >
              <option value="semua">Semua Status</option>
              <option value="belum_lunas">Belum Lunas</option>
              <option value="lunas_sebagian">Lunas Sebagian</option>
              <option value="lunas">Lunas</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Kategori</Label>
            <select
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={categoryId}
              onChange={(e) => handleFilterChange(setCategoryId, e.target.value)}
            >
              <option value="semua">Semua Kategori</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {totalItems > 0 && !isFiltering && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Dihutang</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(totalOwedToMe)}</h3>
            <p className="text-xs text-gray-400 mt-1">Hasil dari filter terpilih</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Saya Hutang</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(totalIOwe)}</h3>
            <p className="text-xs text-gray-400 mt-1">Hasil dari filter terpilih</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Transaksi</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalTransactions} <span className="text-lg font-normal text-gray-400">data</span></h3>
            <p className="text-xs text-gray-400 mt-1">Ditemukan dalam filter</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
            {chartData.length > 0 ? (
              <div className="w-full h-[80px] flex items-center">
                <ResponsiveContainer width="40%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', padding: '4px 8px', border: '1px solid #e5e7eb' }} itemStyle={{ color: '#1f2937' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-[60%] pl-2 flex flex-col justify-center gap-1.5">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex items-center text-xs">
                      <div className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 truncate">{d.name} <span className="font-medium text-gray-900">({d.value})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <PieChartIcon className="h-6 w-6 mb-1 opacity-50" />
                <span className="text-xs">Tidak ada grafik</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            Preview Data
          </h3>
          <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{totalItems} hasil filter</span>
        </div>
        
        {isFiltering ? (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center top-[57px]">
            <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg border border-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-700">Menerapkan filter...</p>
            </div>
          </div>
        ) : totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-[350px]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <SearchX className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada transaksi ditemukan</h3>
            <p className="text-gray-500 max-w-sm mb-5 text-sm">Coba ubah rentang tanggal, jenis filter, atau klik tombol di bawah untuk menampilkan seluruh riwayat waktu.</p>
            <Button variant="outline" onClick={() => setPreset('all')}>Tampilkan Semua Waktu</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('counterpart_name')}>
                      <div className="flex items-center">Nama <SortIcon col="counterpart_name" /></div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('type')}>
                      <div className="flex items-center">Tipe <SortIcon col="type" /></div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('category')}>
                      <div className="flex items-center">Kategori <SortIcon col="category" /></div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center">Status <SortIcon col="status" /></div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('due_date')}>
                      <div className="flex items-center">Jatuh Tempo <SortIcon col="due_date" /></div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('remaining')}>
                      <div className="flex items-center justify-end">Sisa Tagihan <SortIcon col="remaining" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedDebts.map((debt: any) => {
                    const remaining = debt.amount - (debt.total_paid || 0)
                    return (
                      <tr key={debt.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{debt.counterpart_name}</td>
                        <td className="px-4 py-3">
                          {debt.type === 'owed_to_me' ? (
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-md text-xs font-medium border border-green-100">Dihutang</span>
                          ) : (
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md text-xs font-medium border border-red-100">Hutang</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{debt.category?.name || '-'}</td>
                        <td className="px-4 py-3">
                          {debt.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Lunas</span>
                          ) : debt.status === 'partial' ? (
                            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Sebagian</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Belum Lunas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {debt.due_date ? new Date(debt.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {(!debt.currency || debt.currency === 'IDR') ? formatRupiah(remaining) : `${debt.currency} ${remaining}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 mt-auto print:hidden gap-4">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                Hal {currentPage} dari {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1.5 text-xs sm:text-sm border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm font-medium text-gray-700"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                >
                  Sebelumnya
                </button>
                <button 
                  className="px-3 py-1.5 text-xs sm:text-sm border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm font-medium text-gray-700"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
