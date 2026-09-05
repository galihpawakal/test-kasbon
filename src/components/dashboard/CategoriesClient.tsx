'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, Edit2, AlertCircle, FolderOpen } from 'lucide-react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { Debt, Category } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#64748b'
]

function getStringColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PRESET_COLORS.length
  return PRESET_COLORS[index]
}

export function CategoriesClient() {
  const { data: categories, error, mutate, isLoading } = useSWR('/api/categories', fetcher)
  const { data: debts } = useSWR('/api/debts', fetcher)
  
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const getCategoryUsageCount = (categoryId: string) => {
    if (!debts) return 0
    return debts.filter((d: Debt) => d.category_id === categoryId).length
  }

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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const usageCount = getCategoryUsageCount(id)
    let message = 'Yakin mau hapus kategori ini? Kasbon yang udah pakai kategori ini bakal jadi tanpa kategori ya.'
    if (usageCount > 0) {
      message = `Kategori ini dipakai di ${usageCount} transaksi. Yakin mau hapus? Transaksi terkait bakal jadi 'Tanpa Kategori' nih.`
    }
    
    if (!confirm(message)) return
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus kategori')
      mutate()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus kategori')
    }
  }

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setColor(cat.color || getStringColor(cat.name))
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setFormError(null)
    setIsFormOpen(false)
  }

  const totalItems = categories?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedCategories = categories?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Kategori</h1>
          <p className="text-gray-500 text-sm mt-1">Total {totalItems} kategori tersimpan</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
            <Plus className="h-4 w-4 mr-2" /> Tambah Kategori Baru
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                {formError}
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="cat_name" className="text-gray-700 font-medium">Nama Kategori</Label>
                <Input
                  id="cat_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Bisnis, Keluarga, dll."
                  className="focus-visible:ring-blue-500 h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  Warna Kategori
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                </Label>
                <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
                        color === preset ? "border-gray-900 scale-110" : "border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: preset }}
                      aria-label={`Pilih warna ${preset}`}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 shadow-sm hover:scale-105 transition-transform shrink-0" title="Pilih dari palet">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0 bg-transparent"
                      />
                    </div>
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#000000"
                      className="w-24 h-8 text-xs font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="border-gray-200">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editingId ? 'Simpan Perubahan' : 'Simpan Kategori')}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Kategori</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {isLoading && <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>}
          
          {error && <div className="text-red-500 text-sm text-center py-12">Gagal memuat kategori</div>}
          
          {!isLoading && !error && categories?.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kategori nih</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">Yuk, buat kategori pertama kamu untuk ngelompokkin catatan kasbon biar lebih rapi.</p>
              {!isFormOpen && (
                <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-2" /> Buat Kategori Pertama
                </Button>
              )}
            </div>
          )}
          
          {paginatedCategories.map((cat: Category) => {
            const usageCount = getCategoryUsageCount(cat.id)
            const catColor = cat.color || getStringColor(cat.name)
            
            return (
              <div key={cat.id} className="group flex items-center justify-between p-4 sm:px-6 hover:bg-blue-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: catColor }} />
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{cat.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">{usageCount} transaksi</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-100" onClick={() => handleEdit(cat)} title="Edit Kategori">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-red-600 hover:bg-red-100" onClick={() => handleDelete(cat.id)} title="Hapus Kategori">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Controls */}
        {(!isLoading && !error && categories?.length > 0) && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white print:hidden">
            <span className="text-sm text-gray-500">
              Menampilkan {paginatedCategories.length} dari {totalItems} kategori
            </span>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                Prev
              </button>
              <button 
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
