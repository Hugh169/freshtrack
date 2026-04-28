import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, isAfter, startOfDay } from 'date-fns'
import { InventoryItem, ItemStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getItemStatus(item: InventoryItem): ItemStatus {
  const today = startOfDay(new Date())

  if (item.expiry_date) {
    const expiry = startOfDay(new Date(item.expiry_date))
    if (!isAfter(expiry, today)) return 'expired'
    const daysUntilExpiry = differenceInDays(expiry, today)
    if (daysUntilExpiry <= 3) return 'expiring_soon'
  }

  if (item.current_quantity <= item.reorder_threshold) return 'low_stock'

  return 'ok'
}

export function getStatusConfig(status: ItemStatus) {
  switch (status) {
    case 'expired':
      return { label: 'Expired', className: 'bg-red-100 text-red-700 border-red-200' }
    case 'expiring_soon':
      return { label: 'Expiring Soon', className: 'bg-orange-100 text-orange-700 border-orange-200' }
    case 'low_stock':
      return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'ok':
      return { label: 'OK', className: 'bg-green-100 text-green-700 border-green-200' }
  }
}

export function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getStartOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function getStartOfLastMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1)
}

export function getEndOfLastMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
}
