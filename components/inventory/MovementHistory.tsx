'use client'

import { useEffect, useState } from 'react'
import { StockMovement } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatMovementType } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MovementHistoryProps {
  itemId: string
  itemName: string
}

export function MovementHistory({ itemId, itemName }: MovementHistoryProps) {
  const supabase = createClient()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('item_id', itemId)
        .order('recorded_at', { ascending: false })
        .limit(30)
      setMovements(data ?? [])
      setLoading(false)
    }
    load()
  }, [itemId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">No movement history yet</p>
    )
  }

  return (
    <div className="space-y-2">
      {movements.map((m) => {
        const isPositive = m.movement_type === 'received'
        const isNegative = m.movement_type === 'wasted'
        return (
          <div
            key={m.id}
            className="flex items-start justify-between rounded-lg border border-zinc-100 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">
                {formatMovementType(m.movement_type)}
              </p>
              {m.notes && (
                <p className="mt-0.5 truncate text-xs text-zinc-500">{m.notes}</p>
              )}
              <p className="mt-0.5 text-xs text-zinc-400">{formatDateTime(m.recorded_at)}</p>
            </div>
            <span
              className={cn(
                'ml-3 shrink-0 text-sm font-semibold tabular-nums',
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-zinc-600'
              )}
            >
              {isPositive ? '+' : ''}
              {m.quantity}
            </span>
          </div>
        )
      })}
    </div>
  )
}
