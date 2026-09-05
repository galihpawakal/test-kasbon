'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Tags, History, FileText, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export const navItems = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Transaksi', href: '/transactions', icon: List },
  { title: 'Kategori', href: '/categories', icon: Tags },
  { title: 'Riwayat', href: '/history', icon: History },
  { title: 'Laporan', href: '/reports', icon: FileText },
  { title: 'Pengaturan', href: '/settings', icon: Settings },
]

export function AppSidebar({ userEmail, userName = 'User' }: { userEmail: string, userName?: string }) {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-xl shadow-sm">
            K
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Kasbon</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group transition-colors",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                  pathname === item.href ? "text-blue-700" : "text-gray-400 group-hover:text-gray-600"
                )}
                aria-hidden="true"
              />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-blue-700" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">{userName}</span>
            <span className="text-xs text-gray-500 truncate" title={userEmail}>{userEmail}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

