'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { WasteLog } from '@/types'
import { formatCurrency, formatDate, formatWasteReason, formatQuantity } from '@/lib/format'
import {
  WasteByDayChart,
  WasteByReasonChart,
  WasteByCategoryChart,
} from '@/components/waste/WasteCharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, TrendingDown } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

function exportToCsv(logs: WasteLog[], filename: string) {
  const header = 'Date,Item,Category,Quantity,Unit,Reason,Cost (AUD)'
  const rows = logs.map((l) =>
    [
      formatDate(l.logged_at),
      l.inventory_items?.name ?? '',
      l.inventory_items?.category ?? '',
      l.quantity,
      l.inventory_items?.unit ?? '',
      formatWasteReason(l.reason),
      l.estimated_cost.toFixed(2),
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function WastePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')
  const [logs, setLogs] = useState<WasteLog[]>([])

  const defaultStart = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const defaultEnd = format(new Date(), 'yyyy-MM-dd')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)

  async function loadWaste(rid: string, start: string, end: string) {
    const { data } = await supabase
      .from('waste_logs')
      .select('*, inventory_items(name, category, unit, cost_per_unit)')
      .eq('restaurant_id', rid)
      .gte('logged_at', startOfDay(new Date(start)).toISOString())
      .lte('logged_at', endOfDay(new Date(end)).toISOString())
      .order('logged_at', { ascending: false })
    setLogs(data ?? [])
  }

  useEffect(() => {
    let ignore = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (ignore || !user) { if (!user) router.push('/login'); return }

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore || !rid) { if (!rid) setLoading(false); return }

      setRestaurantId(rid)
      await loadWaste(rid, defaultStart, defaultEnd)
      if (!ignore) setLoading(false)
    }

    init()
    return () => { ignore = true }
  }, [])

  async function handleApply() {
    if (!restaurantId) return
    setLoading(true)
    await loadWaste(restaurantId, startDate, endDate)
    setLoading(false)
  }

  const totalCost = logs.reduce((s, l) => s + l.estimated_cost, 0)

  const topItems = useMemo(() => {
    const grouped: Record<string, { name: string; cost: number }> = {}
    logs.forEach((l) => {
      const name = l.inventory_items?.name ?? 'Unknown'
      if (!grouped[name]) grouped[name] = { name, cost: 0 }
      grouped[name].cost += l.estimated_cost
    })
    return Object.values(grouped)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [logs])

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Waste report</h1>
          <p className="text-sm text-zinc-500">Track and analyse food waste costs</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCsv(logs, `waste-${startDate}-${endDate}.csv`)}
          disabled={logs.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date range filter */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="space-y-1">
          <Label htmlFor="start">From</Label>
          <Input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">To</Label>
          <Input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36"
          />
        </div>
        <Button onClick={handleApply}>Apply</Button>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">Total waste cost</p>
        <p className="mt-1 text-4xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
        <p className="mt-1 text-sm text-red-500">
          {logs.length} waste event{logs.length !== 1 ? 's' : ''} in this period
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-zinc-900">Waste cost by day</h2>
          <WasteByDayChart
            logs={logs}
            startDate={new Date(startDate)}
            endDate={new Date(endDate)}
          />
        </div>

        {/* Top wasted items */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-zinc-900">Most wasted items</h2>
          {topItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No waste recorded</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-sm font-bold text-zinc-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
                      <div
                        className="h-1.5 rounded-full bg-red-400"
                        style={{ width: `${(item.cost / topItems[0].cost) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-red-600">
                    {formatCurrency(item.cost)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie by reason */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-zinc-900">Waste by reason</h2>
          <WasteByReasonChart logs={logs} startDate={new Date(startDate)} endDate={new Date(endDate)} />
        </div>

        {/* Pie by category */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-zinc-900">Waste by category</h2>
          <WasteByCategoryChart logs={logs} startDate={new Date(startDate)} endDate={new Date(endDate)} />
        </div>
      </div>

      {/* Waste log table */}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Waste log</h2>
        </div>
        {logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            No waste recorded in this period
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Quantity</th>
                    <th className="px-5 py-3 font-medium">Reason</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">
                        {l.inventory_items?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {l.inventory_items?.category ?? '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-600">
                        {l.quantity} {l.inventory_items?.unit ?? ''}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{formatWasteReason(l.reason)}</td>
                      <td className="px-5 py-3 font-semibold text-red-600">
                        {formatCurrency(l.estimated_cost)}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">{formatDate(l.logged_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-zinc-100 lg:hidden">
              {logs.map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {l.inventory_items?.name ?? '—'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {l.quantity} {l.inventory_items?.unit ?? ''} · {formatWasteReason(l.reason)}
                      </p>
                      <p className="text-xs text-zinc-400">{formatDate(l.logged_at)}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(l.estimated_cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
