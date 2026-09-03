import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

import { formatDistanceToNow, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString)
  return formatDistanceToNow(date, { addSuffix: true, locale: id })
}
