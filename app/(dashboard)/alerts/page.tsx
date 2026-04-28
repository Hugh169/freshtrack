'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { InventoryItem } from '@/types'
import { getItemStatus } from '@/lib/utils'
import { formatCurrency, formatExpiryDate } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Package } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, startOfDay, isAfter } from 'date-fns'

export default function AlertsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    let ignore = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (ignore || !user) { if (!user) router.push('/login'); return }

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore || !rid) { if (!rid) setLoading(false); return }

      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', rid)

      if (ignore) return
      setItems(data ?? [])
      setLoading(false)
    }

    load()
    return () => { ignore = true }
  }, [])

  const today = startOfDay(new Date())

  const lowStock = items
    .filter((i) => i.current_quantity <= i.reorder_threshold)
    .sort((a, b) => (a.current_quantity - a.reorder_threshold) - (b.current_quantity - b.reorder_threshold))

  const expiringItems = items
    .filter((i) => {
      if (!i.expiry_date) return false
      const exp = startOfDay(new Date(i.expiry_date))
      const days = differenceInDays(exp, today)
      return days <= 7
    })
    .sort((a, b) => {
      const dA = differenceInDays(new Date(a.expiry_date!), today)
      const dB = differenceInDays(new Date(b.expiry_date!), today)
      return dA - dB
    })

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const hasAlerts = lowStock.length > 0 || expiringItems.length > 0

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Alerts</h1>
        <p className="text-sm text-zinc-500">
          {hasAlerts
            ? `${lowStock.length + expiringItems.length} item${lowStock.length + expiringItems.length !== 1 ? 's' : ''} need attention`
            : 'All clear'}
        </p>
      </div>

      {!hasAlerts && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p className="font-semibold text-green-800">Everything looks good!</p>
          <p className="mt-1 text-sm text-green-600">
            No low stock or expiring items at the moment.
          </p>
        </div>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-zinc-900">
              Low stock ({lowStock.length})
            </h2>
          </div>
          <div className="space-y-2">
            {lowStock.map((item) => {
              const diff = item.reorder_threshold - item.current_quantity
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-600">
                      {item.current_quantity} {item.unit} in stock
                      <span className="ml-1 text-amber-700">
                        ({diff.toFixed(1)} {item.unit} below threshold)
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      Threshold: {item.reorder_threshold} {item.unit} · Cost: {formatCurrency(item.cost_per_unit)}/{item.unit}
                    </p>
                  </div>
                  <Link href={`/log?tab=delivery&item=${item.id}`} className="ml-3 shrink-0">
                    <Button size="sm" variant="outline" className="border-amber-300 bg-white hover:bg-amber-50">
                      Log delivery
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Expiring items */}
      {expiringItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-zinc-900">
              Expiring within 7 days ({expiringItems.length})
            </h2>
          </div>
          <div className="space-y-2">
            {expiringItems.map((item) => {
              const exp = startOfDay(new Date(item.expiry_date!))
              const days = differenceInDays(exp, today)
              const isExpired = days < 0
              const isToday = days === 0

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    isExpired
                      ? 'border-red-200 bg-red-50'
                      : isToday
                      ? 'border-red-200 bg-red-50'
                      : days <= 2
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-600">
                      {item.current_quantity} {item.unit} in stock ·{' '}
                      <span
                        className={
                          isExpired || isToday
                            ? 'font-medium text-red-700'
                            : days <= 2
                            ? 'font-medium text-orange-700'
                            : 'text-zinc-600'
                        }
                      >
                        Expires {formatExpiryDate(item.expiry_date!)}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      Value: {formatCurrency(item.current_quantity * item.cost_per_unit)}
                    </p>
                  </div>
                  <Link href={`/log?tab=delivery&item=${item.id}`} className="ml-3 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        isExpired || isToday
                          ? 'border-red-300 bg-white hover:bg-red-50'
                          : 'border-zinc-200 bg-white'
                      }
                    >
                      Log delivery
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
