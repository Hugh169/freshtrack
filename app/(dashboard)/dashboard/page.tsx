'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { getItemStatus, getStartOfMonth, getStartOfLastMonth, getEndOfLastMonth, getStartOfWeek } from '@/lib/utils'
import { InventoryItem, WasteLog } from '@/types'
import {
  DollarSign,
  AlertTriangle,
  Clock,
  Trash2,
  TrendingDown,
  Package,
  PlusCircle,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, startOfDay, isAfter } from 'date-fns'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [wasteThisWeek, setWasteThisWeek] = useState(0)
  const [wasteThisMonth, setWasteThisMonth] = useState(0)
  const [wasteLastMonth, setWasteLastMonth] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (ignore || !user) { if (!user) router.push('/login'); return }

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore || !rid) { if (!rid) setLoading(false); return }

      // Fetch restaurant name separately (might have just been created)
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', rid)
        .single()

      if (ignore) return
      setRestaurantName(restaurant?.name ?? 'My Restaurant')

      const [{ data: inventoryData }, { data: weekWaste }, { data: monthWaste }, { data: lastMonthWaste }] =
        await Promise.all([
          supabase
            .from('inventory_items')
            .select('*')
            .eq('restaurant_id', rid),
          supabase
            .from('waste_logs')
            .select('estimated_cost')
            .eq('restaurant_id', rid)
            .gte('logged_at', getStartOfWeek().toISOString()),
          supabase
            .from('waste_logs')
            .select('estimated_cost')
            .eq('restaurant_id', rid)
            .gte('logged_at', getStartOfMonth().toISOString()),
          supabase
            .from('waste_logs')
            .select('estimated_cost')
            .eq('restaurant_id', rid)
            .gte('logged_at', getStartOfLastMonth().toISOString())
            .lte('logged_at', getEndOfLastMonth().toISOString()),
        ])

      if (ignore) return
      setItems(inventoryData ?? [])
      setWasteThisWeek((weekWaste ?? []).reduce((s, w) => s + w.estimated_cost, 0))
      setWasteThisMonth((monthWaste ?? []).reduce((s, w) => s + w.estimated_cost, 0))
      setWasteLastMonth((lastMonthWaste ?? []).reduce((s, w) => s + w.estimated_cost, 0))
      setLoading(false)
    }

    loadData()
    return () => { ignore = true }
  }, [])

  const totalValue = items.reduce((s, i) => s + i.current_quantity * i.cost_per_unit, 0)
  const lowStockCount = items.filter((i) => getItemStatus(i) === 'low_stock').length
  const expiringSoonCount = items.filter((i) => {
    const status = getItemStatus(i)
    return status === 'expiring_soon' || status === 'expired'
  }).length

  const wasteSaved = wasteLastMonth > 0 ? wasteLastMonth - wasteThisMonth : null
  const wasteSavedPct = wasteLastMonth > 0 ? ((wasteSaved! / wasteLastMonth) * 100).toFixed(0) : null

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{restaurantName || 'Dashboard'}</h1>
        <p className="text-sm text-zinc-500">Here&apos;s your inventory snapshot</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          title="Inventory value"
          value={formatCurrency(totalValue)}
          subtitle="Total stock on hand"
          icon={DollarSign}
          variant="default"
          className="col-span-2 lg:col-span-1"
        />
        <MetricCard
          title="Low stock"
          value={String(lowStockCount)}
          subtitle={lowStockCount === 1 ? '1 item needs reorder' : `${lowStockCount} items need reorder`}
          icon={Package}
          variant={lowStockCount > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Expiring soon"
          value={String(expiringSoonCount)}
          subtitle="Within 3 days or expired"
          icon={Clock}
          variant={expiringSoonCount > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="Waste this week"
          value={formatCurrency(wasteThisWeek)}
          icon={Trash2}
          variant={wasteThisWeek > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="Waste this month"
          value={formatCurrency(wasteThisMonth)}
          icon={Trash2}
          variant={wasteThisMonth > 0 ? 'danger' : 'success'}
        />
        {wasteSaved !== null ? (
          <MetricCard
            title="vs last month"
            value={`${wasteSaved >= 0 ? '-' : '+'}${formatCurrency(Math.abs(wasteSaved))}`}
            subtitle={
              wasteSaved >= 0
                ? `${wasteSavedPct}% less waste this month`
                : 'More waste than last month'
            }
            icon={TrendingDown}
            variant={wasteSaved >= 0 ? 'success' : 'danger'}
          />
        ) : (
          <MetricCard
            title="vs last month"
            value="—"
            subtitle="No data from last month"
            icon={TrendingDown}
            variant="default"
          />
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/log?tab=delivery">
            <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              <div className="rounded-lg bg-green-100 p-2.5">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Log delivery</p>
                <p className="text-xs text-zinc-500">Record stock received</p>
              </div>
            </div>
          </Link>
          <Link href="/log?tab=usage">
            <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <PlusCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Log usage</p>
                <p className="text-xs text-zinc-500">Deduct items used</p>
              </div>
            </div>
          </Link>
          <Link href="/log?tab=waste">
            <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              <div className="rounded-lg bg-red-100 p-2.5">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">Log waste</p>
                <p className="text-xs text-zinc-500">Track what&apos;s thrown out</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {(lowStockCount > 0 || expiringSoonCount > 0) && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {lowStockCount > 0 && `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} low on stock`}
              {lowStockCount > 0 && expiringSoonCount > 0 && ' · '}
              {expiringSoonCount > 0 && `${expiringSoonCount} item${expiringSoonCount > 1 ? 's' : ''} expiring soon`}
            </p>
          </div>
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="mt-3 border-amber-300 bg-white hover:bg-amber-50">
              View alerts
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
