'use client'

import useSWR from 'swr'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { TrendChart } from '@/components/dashboard/TrendChart'
import Link from 'next/link'
import { formatRupiah, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send, FileText, Activity, AlertCircle, PlusCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function OverviewClient() {
  const { data: debts, error: debtsError, isLoading: loadingDebts } = useSWR('/api/debts', fetcher)
  const { data: categories, isLoading: loadingCategories } = useSWR('/api/categories', fetcher)

  if (loadingDebts || loadingCategories) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (debtsError) {
    return <div className="text-red-500 text-center mt-10 p-6 bg-red-50 rounded-xl">Gagal memuat data kasbon.</div>
  }

  // EMPTY STATE
  if (!debts || debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <FileText className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang di Kasbon!</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Aplikasi ini membantu Anda mencatat utang piutang dengan rapi. Belum ada catatan transaksi saat ini, ayo mulai catat kasbon pertama Anda.
        </p>
        <Link href="/transactions">
          <Button size="lg" className="rounded-full shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" />
            Mulai Catat Kasbon
          </Button>
        </Link>
      </div>
    )
  }

  // CALCULATIONS
  let totalOwedToMe = 0
  let totalIOwe = 0
  let countOwedToMe = 0
  let countIOwe = 0

  if (debts && Array.isArray(debts)) {
    debts.forEach((debt: any) => {
      const isIDR = !debt.currency || debt.currency === 'IDR'
      if (debt.status !== 'paid' && isIDR) {
        const remaining = debt.amount - (debt.total_paid || 0)
        if (debt.type === 'owed_to_me') {
          totalOwedToMe += remaining
          countOwedToMe++
        } else if (debt.type === 'i_owe') {
          totalIOwe += remaining
          countIOwe++
        }
      }
    })
  }

  const net = totalOwedToMe - totalIOwe

  // WIDGET DATA
  const latestTransactions = [...debts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
  
  const needToCollect = debts
    .filter((d: any) => d.type === 'owed_to_me' && d.status !== 'paid' && (!d.currency || d.currency === 'IDR'))
    .sort((a: any, b: any) => (b.amount - (b.total_paid || 0)) - (a.amount - (a.total_paid || 0)))
    .slice(0, 3)

  const handleWA = (name: string, phone: string, amount: number) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1)
    }
    const message = encodeURIComponent(`Halo ${name}, tolong dicek untuk kasbon sebesar ${formatRupiah(amount)}. Terima kasih!`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <Link href="/transactions">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Catat Baru
          </Button>
        </Link>
      </div>

      <SummaryCards 
        totalOwedToMe={totalOwedToMe} 
        totalIOwe={totalIOwe} 
        net={net} 
        countOwedToMe={countOwedToMe}
        countIOwe={countIOwe}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart debts={debts} categories={categories} />
        <TrendChart debts={debts} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-gray-500" />
              Aktivitas Terbaru
            </h3>
            <Link href="/transactions" className="text-xs text-blue-600 hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {latestTransactions.map((tx: any) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'owed_to_me' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.counterpart_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.counterpart_name}</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'owed_to_me' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'owed_to_me' ? '+' : '-'}{(!tx.currency || tx.currency === 'IDR') ? formatRupiah(tx.amount) : `${tx.currency} ${tx.amount}`}
                  </p>
                  <div className="mt-1">
                    {tx.status === 'paid' ? (
                      <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Lunas</span>
                    ) : tx.status === 'partial' ? (
                      <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">Sebagian</span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Belum Lunas</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-red-50/30 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
            <h3 className="font-semibold text-gray-900">Perlu Ditagih</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            {needToCollect.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-sm text-gray-500">
                Semua piutang sudah lunas. Anda tidak memiliki tagihan aktif.
              </div>
            ) : (
              <div className="space-y-4">
                {needToCollect.map((debt: any) => {
                  const remaining = debt.amount - (debt.total_paid || 0)
                  return (
                    <div key={debt.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 text-sm truncate pr-2">{debt.counterpart_name}</span>
                        <span className="text-red-600 font-bold text-sm whitespace-nowrap">{formatRupiah(remaining)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <span>{debt.due_date ? `Jatuh tempo: ${new Date(debt.due_date).toLocaleDateString('id-ID')}` : 'Tidak ada tenggat'}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs h-8 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                        disabled={!debt.counterpart_phone}
                        onClick={() => handleWA(debt.counterpart_name, debt.counterpart_phone, remaining)}
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        {debt.counterpart_phone ? 'Kirim WhatsApp' : 'No. WA Kosong'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
