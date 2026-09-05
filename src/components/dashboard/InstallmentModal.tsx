'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  debt: any
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
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (installmentId: string) => {
    if (!confirm('Yakin ingin menghapus cicilan ini?')) return
    
    try {
      const res = await fetch(`/api/debts/${debt.id}/installments/${installmentId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus cicilan')
      
      toast.success('Cicilan berhasil dihapus')
      mutate()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
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

  if (!debt) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Kelola Cicilan</DialogTitle>
          <DialogDescription>
            {debt.counterpart_name} - Sisa Tagihan: <strong className="text-gray-900">{formatRupiah(remainingAmount)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-8">
          {/* Form Tambah Cicilan */}
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
              <Label htmlFor="note">Catatan (Opsional)</Label>
              <Input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: Cicilan bulan pertama"
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting || remainingAmount <= 0} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Catat Pembayaran'}
            </Button>
          </form>

          {/* Riwayat Cicilan */}
          <div>
            <h4 className="text-sm font-semibold mb-3 border-b pb-2">Riwayat Pembayaran</h4>
            
            {isLoading && (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            )}
            
            {error && (
              <div className="text-sm text-red-500 p-2">Gagal memuat riwayat cicilan.</div>
            )}
            
            {!isLoading && !error && installments?.length === 0 && (
              <div className="text-sm text-gray-500 italic text-center p-4">Belum ada cicilan.</div>
            )}
            
            <div className="flex flex-col gap-2">
              {installments?.map((inst: any) => (
                <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{formatRupiah(inst.amount)}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      {new Date(inst.paid_at).toLocaleDateString('id-ID')}
                      {inst.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{inst.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(inst.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

