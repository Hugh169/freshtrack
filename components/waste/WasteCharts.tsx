'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { WasteLog } from '@/types'
import { format, eachDayOfInterval, startOfDay } from 'date-fns'
import { formatCurrency, formatWasteReason } from '@/lib/format'

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899']

interface WasteChartsProps {
  logs: WasteLog[]
  startDate: Date
  endDate: Date
}

export function WasteByDayChart({ logs, startDate, endDate }: WasteChartsProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const data = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const cost = logs
      .filter((l) => l.logged_at.startsWith(dayStr))
      .reduce((sum, l) => sum + l.estimated_cost, 0)
    return { date: format(day, 'dd MMM'), cost }
  })

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={40}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Waste cost']}
          contentStyle={{
            border: '1px solid #e4e4e7',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WasteByReasonChart({ logs }: { logs: WasteLog[] }) {
  const grouped: Record<string, number> = {}
  logs.forEach((l) => {
    grouped[l.reason] = (grouped[l.reason] ?? 0) + l.estimated_cost
  })
  const data = Object.entries(grouped).map(([reason, cost]) => ({
    name: formatWasteReason(reason),
    value: Math.round(cost * 100) / 100,
  }))

  if (data.length === 0) return <EmptyPie />

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, color: '#71717a' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function WasteByCategoryChart({ logs }: { logs: WasteLog[] }) {
  const grouped: Record<string, number> = {}
  logs.forEach((l) => {
    const cat = l.inventory_items?.category ?? 'Other'
    grouped[cat] = (grouped[cat] ?? 0) + l.estimated_cost
  })
  const data = Object.entries(grouped).map(([cat, cost]) => ({
    name: cat,
    value: Math.round(cost * 100) / 100,
  }))

  if (data.length === 0) return <EmptyPie />

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, color: '#71717a' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function EmptyPie() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-zinc-400">
      No data for this period
    </div>
  )
}
