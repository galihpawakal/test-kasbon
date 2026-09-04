'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { debtSchema, DebtInput } from '@/lib/validations/debt'
import { Loader2, Settings } from 'lucide-react'
import { DebtHistory } from './DebtHistory'
import { CategoryManagerModal } from './CategoryManagerModal'
import useSWR from 'swr'

interface DebtFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingDebt?: any
}

export function DebtFormModal({ isOpen, onClose, onSuccess, editingDebt }: DebtFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const { data: categories } = useSWR(isOpen ? '/api/categories' : null, (url) => fetch(url).then(res => res.json()))

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DebtInput>({
    resolver: zodResolver(debtSchema) as any,
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
          counterpart_phone: editingDebt.counterpart_phone || '',
        })
      } else {
        reset({
          type: 'owed_to_me',
          amount: 0,
          counterpart_name: '',
          note: '',
          due_date: new Date().toISOString().split('T')[0],
          category_id: '',
          currency: 'IDR',
          counterpart_phone: '',
        })
      }
      setError(null)
    }
  }, [isOpen, editingDebt, reset])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    // transform empty category_id to null
    if (!data.category_id) {
      data.category_id = null
    }

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
              onValueChange={(val) => setValue('type', (val as 'owed_to_me' | 'i_owe') || 'owed_to_me')}
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
            <Label htmlFor="counterpart_phone">No. WhatsApp (Opsional)</Label>
            <Input
              id="counterpart_phone"
              placeholder="Misal: 628123456789"
              {...register('counterpart_phone')}
            />
            <p className="text-gray-400 text-xs">Gunakan format 62xxx (tanpa +)</p>
            {errors.counterpart_phone && (
              <p className="text-red-500 text-xs">{errors.counterpart_phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5 flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="amount">Jumlah *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Misal: 50000"
                {...register('amount', { valueAsNumber: true })}
              />
              <p className="text-gray-400 text-xs">Angka bulat tanpa titik/koma</p>
              {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="w-[100px] space-y-1.5">
              <Label htmlFor="currency">Mata Uang</Label>
              <Select
                value={watch('currency') || 'IDR'}
                onValueChange={(val) => setValue('currency', val || 'IDR')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label>Kategori (Opsional)</Label>
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600" onClick={() => setIsCategoryModalOpen(true)}>
                <Settings className="h-3 w-3 mr-1" /> Kelola
              </Button>
            </div>
            <Select
              value={watch('category_id') || 'none'}
              onValueChange={(val) => setValue('category_id', !val || val === 'none' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Tidak ada kategori --</SelectItem>
                {categories?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#e5e7eb' }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-red-500 text-xs">{errors.category_id.message as string}</p>}
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

        {editingDebt && <DebtHistory debtId={editingDebt.id} />}
      </DialogContent>
      
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </Dialog>
  )
}
