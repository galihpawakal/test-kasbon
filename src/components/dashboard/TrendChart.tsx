'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import { useMemo } from 'react'
import { parseISO, format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { id } from 'date-fns/locale'
import { Debt } from '@/types'

export function TrendChart({ debts }: { debts: Debt[] }) {
  const data = useMemo(() => {
    if (!debts || debts.length === 0) return []

    // Buat data untuk 6 bulan terakhir
    const chartData = []
    let currentMonth = subMonths(new Date(), 5) // Mulai dari 5 bulan lalu sampai bulan ini (total 6 bulan)
    
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      
      let owedToMe = 0
      let iOwe = 0
      
      // Hitung total penambahan kasbon pada bulan tersebut
      debts.forEach(d => {
        if (!d.created_at) return
        const dDate = parseISO(d.created_at)
        
        if (isWithinInterval(dDate, { start: monthStart, end: monthEnd }) && (!d.currency || d.currency === 'IDR')) {
          if (d.type === 'owed_to_me') owedToMe += d.amount
          else if (d.type === 'i_owe') iOwe += d.amount
        }
      })
      
      chartData.push({
        name: format(monthStart, 'MMM', { locale: id }),
        'Dihutang ke Saya': owedToMe,
        'Saya Hutang': iOwe
      })
      
      currentMonth = new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
    }
    
    return chartData
  }, [debts])

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[350px] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 mb-4 flex items-center justify-center">
          <span className="text-gray-400 font-medium text-xs">Kosong</span>
        </div>
        <p className="text-gray-500 font-medium">Belum Ada Data</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm h-[350px] flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Tren Penambahan Kasbon</h3>
      <p className="text-sm text-gray-500 mb-4">Dalam 6 bulan terakhir</p>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOwed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIOwe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} minTickGap={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `Rp${(val/1000000).toFixed(1)}Jt`
                if (val >= 1000) return `Rp${val/1000}k`
                return val.toString()
              }}
              width={50}
            />
            <Tooltip 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts internal type limit
              formatter={(value: any, name: any) => [formatRupiah(Number(value) || 0), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              itemStyle={{ color: '#1f2937' }}
            />
            <Area type="monotone" dataKey="Dihutang ke Saya" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorOwed)" />
            <Area type="monotone" dataKey="Saya Hutang" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorIOwe)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
