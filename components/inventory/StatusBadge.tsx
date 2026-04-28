import { Badge } from '@/components/ui/badge'
import { InventoryItem, ItemStatus } from '@/types'
import { getItemStatus, getStatusConfig } from '@/lib/utils'

interface StatusBadgeProps {
  item: InventoryItem
  status?: ItemStatus
}

export function StatusBadge({ item, status }: StatusBadgeProps) {
  const resolvedStatus = status ?? getItemStatus(item)
  const config = getStatusConfig(resolvedStatus)

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}
