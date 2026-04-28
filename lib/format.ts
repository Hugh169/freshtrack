import { format, differenceInDays, isToday, isTomorrow, startOfDay, isAfter } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatExpiryDate(dateStr: string): string {
  const date = startOfDay(new Date(dateStr))
  const today = startOfDay(new Date())

  if (!isAfter(date, today) && !isToday(date)) {
    const daysAgo = differenceInDays(today, date)
    return `${daysAgo}d ago`
  }
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'

  const daysUntil = differenceInDays(date, today)
  if (daysUntil <= 7) return `in ${daysUntil} days`

  return format(date, 'dd MMM yyyy')
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy')
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, h:mm a')
}

export function formatQuantity(qty: number, unit: string): string {
  return `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${unit}`
}

export function formatWasteReason(reason: string): string {
  const labels: Record<string, string> = {
    expired: 'Expired',
    spoiled: 'Spoiled',
    overcooked: 'Overcooked',
    dropped: 'Dropped / Damaged',
    over_prepared: 'Over-prepared',
    other: 'Other',
  }
  return labels[reason] ?? reason
}

export function formatMovementType(type: string): string {
  const labels: Record<string, string> = {
    received: 'Received',
    used: 'Used',
    wasted: 'Wasted',
    adjusted: 'Adjusted',
  }
  return labels[type] ?? type
}
