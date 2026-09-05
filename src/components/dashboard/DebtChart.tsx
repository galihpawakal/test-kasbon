import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import { Debt } from '@/types'

interface DebtChartProps {
  totalOwedToMe: number
  totalIOwe: number
}

export function DebtChart({ totalOwedToMe, totalIOwe }: DebtChartProps) {
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

  return (
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts internal type limit
                formatter={(value: any) => [formatRupiah(Number(value) || 0), 'Nominal']}
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
  )
}
