import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils'
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react'

interface SummaryCardsProps {
  totalOwedToMe: number
  totalIOwe: number
  net: number
  countOwedToMe?: number
  countIOwe?: number
}

export function SummaryCards({ totalOwedToMe, totalIOwe, net, countOwedToMe = 0, countIOwe = 0 }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="border-green-100 shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowDownToLine className="w-16 h-16 text-green-600" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Piutang (Dihutang ke Saya)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalOwedToMe)}</div>
          <div className="mt-1 text-sm text-gray-500 font-medium">
            Dari {countOwedToMe} transaksi aktif
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-red-100 shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ArrowUpFromLine className="w-16 h-16 text-red-600" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Hutang (Saya Hutang)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalIOwe)}</div>
          <div className="mt-1 text-sm text-gray-500 font-medium">
            Ke {countIOwe} transaksi aktif
          </div>
        </CardContent>
      </Card>
      
      <Card className={`shadow-sm overflow-hidden relative group ${net >= 0 ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          <Wallet className="w-16 h-16" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${net >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
            Saldo Netto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${net > 0 ? 'text-blue-700' : net < 0 ? 'text-red-700' : 'text-gray-900'}`}>
            {formatRupiah(net)}
          </div>
          <div className="mt-1 text-sm text-gray-500 font-medium">
            {net >= 0 ? 'Posisi aset Anda positif' : 'Posisi aset Anda negatif'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

