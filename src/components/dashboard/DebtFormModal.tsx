'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { debtSchema, DebtInput } from '@/lib/validations/debt'
import { Loader2 } from 'lucide-react'

interface DebtFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingDebt?: any
}

export function DebtFormModal({ isOpen, onClose, onSuccess, editingDebt }: DebtFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      type: 'owed_to_me',
      amount: 0,
      counterpart_name: '',
      note: '',
      due_date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (editingDebt) {
        reset({
          type: editingDebt.type,
          amount: editingDebt.amount,
          counterpart_name: editingDebt.counterpart_name,
          note: editingDebt.note || '',
          due_date: editingDebt.due_date || '',
        })
      } else {
        reset({
          type: 'owed_to_me',
          amount: 0,
          counterpart_name: '',
          note: '',
          due_date: new Date().toISOString().split('T')[0],
        })
      }
      setError(null)
    }
  }, [isOpen, editingDebt, reset])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = editingDebt ? `/api/debts/${editingDebt.id}` : '/api/debts'
      const method = editingDebt ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Gagal menyimpan data')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const noteValue = watch('note') || ''

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingDebt ? 'Edit Catatan' : 'Catat Baru'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-3">
            <Label>Tipe</Label>
            <RadioGroup
              defaultValue="owed_to_me"
              value={watch('type')}
              onValueChange={(val) => setValue('type', val as 'owed_to_me' | 'i_owe')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owed_to_me" id="owed_to_me" />
                <Label htmlFor="owed_to_me" className="font-normal cursor-pointer">
                  Saya dihutang
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="i_owe" id="i_owe" />
                <Label htmlFor="i_owe" className="font-normal cursor-pointer">
                  Saya hutang
                </Label>
              </div>
            </RadioGroup>
            {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="counterpart_name">Nama Orang *</Label>
            <Input
              id="counterpart_name"
              placeholder="Misal: Budi"
              {...register('counterpart_name')}
            />
            {errors.counterpart_name && (
              <p className="text-red-500 text-xs">{errors.counterpart_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Jumlah (Rp) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Misal: 50000"
              {...register('amount', { valueAsNumber: true })}
            />
            <p className="text-gray-400 text-xs">Masukkan angka bulat tanpa titik/koma</p>
            {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Tanggal (Opsional)</Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
            />
            {errors.due_date && <p className="text-red-500 text-xs">{errors.due_date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="note">Catatan (Opsional)</Label>
              <span className="text-xs text-gray-400">{noteValue.length}/200</span>
            </div>
            <Input
              id="note"
              placeholder="Misal: Uang makan siang"
              maxLength={200}
              {...register('note')}
            />
            {errors.note && <p className="text-red-500 text-xs">{errors.note.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
