'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react'
import useSWR from 'swr'

interface CategoryManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const { data: categories, error, mutate, isLoading } = useSWR(isOpen ? '/api/categories' : null, fetcher)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#e5e7eb')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan kategori')
      }

      await mutate()
      resetForm()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini? Data utang terkait tidak akan terhapus, namun tidak akan memiliki kategori.')) return
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus kategori')
      mutate()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEdit = (cat: any) => {
    setEditingId(cat.id)
    setName(cat.name)
    setColor(cat.color || '#e5e7eb')
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColor('#e5e7eb')
    setFormError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kelola Kategori</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 mb-4 border-b pb-4">
          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
              {formError}
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cat_name">Nama Kategori</Label>
              <Input
                id="cat_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Bisnis"
              />
            </div>
            <div className="w-16 space-y-1.5">
              <Label htmlFor="cat_color">Warna</Label>
              <Input
                id="cat_color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="p-1 h-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Batal Edit
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? 'Simpan' : <><Plus className="h-4 w-4 mr-1" /> Tambah</>)}
            </Button>
          </div>
        </form>

        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {isLoading && <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" /></div>}
          {error && <div className="text-red-500 text-sm text-center">Gagal memuat kategori</div>}
          {!isLoading && !error && categories?.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">Belum ada kategori.</div>
          )}
          {categories?.map((cat: any) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: cat.color || '#e5e7eb' }} />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => handleEdit(cat)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
