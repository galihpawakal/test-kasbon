'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import { useMemo } from 'react'
import { Debt, Category } from '@/types'

export function DonutChart({ debts, categories }: { debts: Debt[], categories: Category[] }) {
  const data = useMemo(() => {
    if (!debts) return []

    // Only count "Dihutang ke Saya" (owed_to_me) that are unpaid
    const activeDebts = debts.filter(d => d.type === 'owed_to_me' && d.status !== 'paid' && (!d.currency || d.currency === 'IDR'))
    
    const categoryTotals: Record<string, number> = {}
    
    activeDebts.forEach(d => {
      const remaining = d.amount - (d.total_paid || 0)
      const catId = d.category_id || 'un-categorized'
      categoryTotals[catId] = (categoryTotals[catId] || 0) + remaining
    })

    const chartData = Object.entries(categoryTotals).map(([catId, amount]) => {
      if (catId === 'un-categorized') {
        return { name: 'Tanpa Kategori', value: amount, color: '#9ca3af' } // gray-400
      }
      const cat = categories?.find(c => c.id === catId)
      return { 
        name: cat?.name || 'Kategori Dihapus', 
        value: amount,
        color: cat?.color || '#3b82f6' // default blue if no color
      }
    }).sort((a, b) => b.value - a.value) // Sort largest first

    return chartData
  }, [debts, categories])

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-[350px] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 mb-4 flex items-center justify-center">
          <span className="text-gray-400 font-medium text-xs">Kosong</span>
        </div>
        <p className="text-gray-500 font-medium">Belum Ada Data</p>
        <p className="text-sm text-gray-400 mt-1">Belum ada piutang untuk ditampilkan kategorinya.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm h-[350px] flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Dihutang ke Saya (Per Kategori)</h3>
      <p className="text-sm text-gray-500 mb-4">Komposisi piutang aktif</p>
      
      <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-center gap-4 min-h-0">
        <div className="w-full sm:w-1/2 h-[150px] sm:h-full shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts internal type limit
                formatter={(value: any) => [formatRupiah(Number(value) || 0), 'Nominal']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px' }}
                itemStyle={{ color: '#1f2937' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full sm:w-1/2 flex flex-col gap-2 overflow-y-auto max-h-[100px] sm:max-h-full pr-2 pb-2 sm:pb-0 scrollbar-thin">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center min-w-0 mr-2">
                <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600 truncate" title={d.name}>{d.name}</span>
              </div>
              <span className="font-semibold text-gray-900 shrink-0">{formatRupiah(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
