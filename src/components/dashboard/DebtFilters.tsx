import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Debt, Category } from '@/types'

interface DebtFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  sortConfig: string
  setSortConfig: (val: string) => void
  statusFilter: string
  setStatusFilter: (val: string) => void
  typeFilter: string
  setTypeFilter: (val: string) => void
  categoryFilter: string
  setCategoryFilter: (val: string) => void
  categories: Category[]
  isGrouped: boolean
  setIsGrouped: (val: boolean) => void
}

export function DebtFilters({
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  isGrouped,
  setIsGrouped,
}: DebtFiltersProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-4 mb-6 print:hidden items-start xl:items-center">
      <div className="w-full xl:flex-1">
        <input
          type="text"
          placeholder="Cari nama orang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 shadow-sm"
        />
      </div>
      
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-3 w-full xl:w-auto items-center">
        <Select value={sortConfig} onValueChange={(val) => val && setSortConfig(val)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-white h-10 shadow-sm">
            <SelectValue placeholder="Urutkan">
              {sortConfig === 'created_desc' ? 'Terbaru' : 
               sortConfig === 'created_asc' ? 'Terlama' :
               sortConfig === 'amount_desc' ? 'Jumlah Terbesar' :
               sortConfig === 'amount_asc' ? 'Jumlah Terkecil' : 'Urutkan'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Terbaru</SelectItem>
            <SelectItem value="created_asc">Terlama</SelectItem>
            <SelectItem value="amount_desc">Jumlah Terbesar</SelectItem>
            <SelectItem value="amount_asc">Jumlah Terkecil</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-full sm:w-[140px] bg-white h-10 shadow-sm">
            <SelectValue placeholder="Status">
              {statusFilter === 'semua' ? 'Semua Status' :
               statusFilter === 'belum_lunas' ? 'Belum Lunas' :
               statusFilter === 'lunas_sebagian' ? 'Lunas Sebagian' :
               statusFilter === 'lunas' ? 'Lunas' : 'Status'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
            <SelectItem value="lunas_sebagian">Lunas Sebagian</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
          <SelectTrigger className="w-full sm:w-[130px] bg-white h-10 shadow-sm">
            <SelectValue placeholder="Tipe">
              {typeFilter === 'semua' ? 'Semua Tipe' :
               typeFilter === 'owed_to_me' ? 'Dihutang' :
               typeFilter === 'i_owe' ? 'Hutang' : 'Tipe'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tipe</SelectItem>
            <SelectItem value="owed_to_me">Dihutang</SelectItem>
            <SelectItem value="i_owe">Hutang</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-white h-10 shadow-sm">
            <SelectValue placeholder="Kategori">
              {categoryFilter === 'semua' ? 'Semua Kategori' : categories?.find((c: Category) => c.id === categoryFilter)?.name || 'Kategori'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {categories?.map((c: Category) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 col-span-2 sm:col-span-1 justify-end sm:justify-start pt-1 sm:pt-0 sm:ml-2">
          <input 
            type="checkbox" 
            id="group-toggle"
            checked={isGrouped}
            onChange={(e) => setIsGrouped(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="group-toggle" className="text-sm font-medium text-gray-700 select-none cursor-pointer whitespace-nowrap">
            Grup per Orang
          </label>
        </div>
      </div>
    </div>
  )
}
