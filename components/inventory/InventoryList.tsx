'use client'

import { useState, useMemo } from 'react'
import { InventoryItem, CATEGORIES, Category } from '@/types'
import { getItemStatus } from '@/lib/utils'
import { formatCurrency, formatExpiryDate, formatQuantity } from '@/lib/format'
import { StatusBadge } from './StatusBadge'
import { MovementHistory } from './MovementHistory'
import { ItemForm } from './ItemForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, ChevronUp, ChevronDown, Pencil, History, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type SortKey = 'name' | 'category' | 'current_quantity' | 'expiry_date'
type SortDir = 'asc' | 'desc'

interface InventoryListProps {
  items: InventoryItem[]
  restaurantId: string
  onRefresh: () => void | Promise<void>
  loading?: boolean
}

export function InventoryList({ items, restaurantId, onRefresh, loading }: InventoryListProps) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteItem) return
    setDeleting(true)
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', deleteItem.id)
    setDeleting(false)
    if (error) {
      toast.error(error.message ?? 'Failed to delete item')
      return
    }
    toast.success(`${deleteItem.name} removed`)
    setDeleteItem(null)
    await onRefresh()
  }

  const filtered = useMemo(() => {
    let list = [...items]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter)
    }
    list.sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortKey === 'name') { av = a.name; bv = b.name }
      if (sortKey === 'category') { av = a.category; bv = b.category }
      if (sortKey === 'current_quantity') { av = a.current_quantity; bv = b.current_quantity }
      if (sortKey === 'expiry_date') {
        av = a.expiry_date ?? '9999-99-99'
        bv = b.expiry_date ?? '9999-99-99'
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [items, search, categoryFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ChevronUp className="ml-1 h-3 w-3 opacity-30" />
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    )
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as Category | 'all')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden p-4 lg:block">
        <div className="rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th
                  className="cursor-pointer px-4 py-3 font-medium hover:text-zinc-900"
                  onClick={() => toggleSort('name')}
                >
                  <span className="flex items-center">
                    Name <SortIcon column="name" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium hover:text-zinc-900"
                  onClick={() => toggleSort('category')}
                >
                  <span className="flex items-center">
                    Category <SortIcon column="category" />
                  </span>
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium hover:text-zinc-900"
                  onClick={() => toggleSort('current_quantity')}
                >
                  <span className="flex items-center">
                    Stock <SortIcon column="current_quantity" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Threshold</th>
                <th className="px-4 py-3 font-medium">Cost/unit</th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium hover:text-zinc-900"
                  onClick={() => toggleSort('expiry_date')}
                >
                  <span className="flex items-center">
                    Expiry <SortIcon column="expiry_date" />
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const status = getItemStatus(item)
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{item.category}</td>
                      <td className="px-4 py-3 font-mono text-zinc-900">
                        {formatQuantity(item.current_quantity, item.unit)}
                        {status === 'low_stock' && (
                          <span className="ml-2 text-xs text-amber-600">
                            ({(item.reorder_threshold - item.current_quantity).toFixed(1)} below)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-500">
                        {item.reorder_threshold} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatCurrency(item.cost_per_unit)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {item.expiry_date ? formatExpiryDate(item.expiry_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge item={item} status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setHistoryItem(item)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            title="View history"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditItem(item)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 p-4 lg:hidden">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">No items found</p>
        ) : (
          filtered.map((item) => {
            const status = getItemStatus(item)
            return (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
                onClick={() => setHistoryItem(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge item={item} status={status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditItem(item)
                      }}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100"
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteItem(item)
                      }}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-zinc-400">Stock</p>
                    <p className="font-mono font-medium text-zinc-900">
                      {item.current_quantity} {item.unit}
                    </p>
                    {status === 'low_stock' && (
                      <p className="text-xs text-amber-600">
                        {(item.reorder_threshold - item.current_quantity).toFixed(1)} below
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Cost/unit</p>
                    <p className="font-medium text-zinc-900">{formatCurrency(item.cost_per_unit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Expiry</p>
                    <p className="font-medium text-zinc-900">
                      {item.expiry_date ? formatExpiryDate(item.expiry_date) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add item sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Add inventory item</SheetTitle>
          </SheetHeader>
          <ItemForm
            restaurantId={restaurantId}
            onSuccess={async () => {
              await onRefresh()
              setAddOpen(false)
            }}
            onCancel={() => setAddOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Edit item sheet */}
      <Sheet open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit item</SheetTitle>
          </SheetHeader>
          {editItem && (
            <ItemForm
              restaurantId={restaurantId}
              item={editItem}
              onSuccess={async () => {
                await onRefresh()
                setEditItem(null)
              }}
              onCancel={() => setEditItem(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-zinc-900">{deleteItem?.name}</span> from
              inventory? This also deletes its movement history and waste logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement history dialog */}
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{historyItem?.name} — Movement History</DialogTitle>
          </DialogHeader>
          {historyItem && (
            <MovementHistory itemId={historyItem.id} itemName={historyItem.name} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
