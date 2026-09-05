'use client'

import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from './AppSidebar'
import { cn } from '@/lib/utils'

export function AppHeader({ userEmail, userName = 'User' }: { userEmail: string, userName?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-sm shadow-sm">
                K
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">Kasbon</span>
            </div>
          </div>
          
          <div className="hidden md:block">
             {/* Spacer */}
          </div>

          <div className="flex items-center gap-4 md:hidden">
            {/* Can add small avatar here if needed */}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
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
                    onClick={() => setIsMobileMenuOpen(false)}
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
        </div>
      )}
    </>
  )
}
