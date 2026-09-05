'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Debt, Installment } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  debt: Debt
  onSuccess: () => void
}

export function InstallmentModal({ isOpen, onClose, debt, onSuccess }: InstallmentModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: installments, error, isLoading, mutate } = useSWR(
    isOpen && debt ? `/api/debts/${debt.id}/installments` : null,
    fetcher
  )

  const remainingAmount = debt ? debt.amount - (debt.total_paid || 0) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10)
    
    if (numericAmount <= 0) {
      toast.error('Nominal cicilan harus lebih dari 0')
      return
    }

    if (numericAmount > remainingAmount) {
      toast.error(`Nominal cicilan tidak boleh melebihi sisa utang (${formatRupiah(remainingAmount)})`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/debts/${debt.id}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          note: note || undefined,
          paid_at: new Date(date).toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan cicilan')
      }

      toast.success('Cicilan berhasil dicatat')
      setAmount('')
      setNote('')
      mutate()
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan cicilan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (installmentId: string) => {
    if (!confirm('Yakin mau hapus cicilan ini?')) return
    
    try {
      const res = await fetch(`/api/debts/${debt.id}/installments/${installmentId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus cicilan')
      
      toast.success('Cicilan berhasil dihapus')
      mutate()
      onSuccess()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus cicilan')
    }
  }

  // Format currency on type
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value) {
      setAmount(parseInt(value, 10).toLocaleString('id-ID'))
    } else {
      setAmount('')
    }
  }

  if (!isOpen || !debt) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Kelola Cicilan</h2>
        <p className="text-sm text-gray-500">
          {debt.counterpart_name} - Sisa Tagihan: <strong className="text-gray-900">{formatRupiah(remainingAmount)}</strong>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Form Tambah Cicilan */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="amount">Nominal Cicilan (Rp)</Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Contoh: 50.000"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="date">Tanggal Pembayaran</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="note">Keterangan (Gak Wajib)</Label>
              <Input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Cicilan bulan pertama"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Nanti Dulu
              </Button>
              <Button type="submit" disabled={isSubmitting || remainingAmount <= 0} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Catat Cicilan'}
              </Button>
            </div>
          </form>
        </div>

        {/* Riwayat Cicilan */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-3 border-b pb-2">Riwayat Pembayaran</h4>
          
          {isLoading && (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          )}
          
          {error && (
            <div className="text-sm text-red-500 p-2">Gagal memuat riwayat cicilan.</div>
          )}
          
          {!isLoading && !error && installments?.length === 0 && (
            <div className="text-sm text-gray-500 italic text-center p-4">Belum ada cicilan nih.</div>
          )}
          
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {installments?.map((inst: Installment) => (
              <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{formatRupiah(inst.amount)}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    {new Date(inst.paid_at).toLocaleDateString('id-ID')}
                    {inst.note && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[150px]" title={inst.note}>{inst.note}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(inst.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Hapus cicilan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

