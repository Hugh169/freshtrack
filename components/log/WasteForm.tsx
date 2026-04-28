'use client'

import { useState } from 'react'
import { InventoryItem, WASTE_REASONS, WasteReason } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { Loader2, Search, AlertTriangle } from 'lucide-react'

interface WasteFormProps {
  restaurantId: string
  userId: string
  items: InventoryItem[]
  onWasteLogged: (cost: number, itemName: string) => void
}

export function WasteForm({ restaurantId, userId, items, onWasteLogged }: WasteFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<WasteReason | ''>('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')

  const selectedItem = items.find((i) => i.id === itemId)
  const qty = parseFloat(quantity) || 0
  const estimatedCost = selectedItem ? qty * selectedItem.cost_per_unit : 0
  const filteredItems = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemId || !quantity || !reason) {
      toast.error('Please fill in all required fields')
      return
    }
    if (qty <= 0) {
      toast.error('Quantity must be a positive number')
      return
    }

    setLoading(true)
    try {
      const now = new Date().toISOString()
      const cost = selectedItem ? qty * selectedItem.cost_per_unit : 0

      const { error: wasteErr } = await supabase.from('waste_logs').insert({
        restaurant_id: restaurantId,
        item_id: itemId,
        quantity: qty,
        reason,
        estimated_cost: cost,
        logged_at: now,
        created_by: userId,
      })
      if (wasteErr) throw wasteErr

      const { error: moveErr } = await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        item_id: itemId,
        movement_type: 'wasted',
        quantity: -qty,
        notes: notes || null,
        recorded_at: now,
        created_by: userId,
      })
      if (moveErr) throw moveErr

      const { error: updateErr } = await supabase
        .from('inventory_items')
        .update({
          current_quantity: Math.max(0, (selectedItem?.current_quantity ?? 0) - qty),
          updated_at: now,
        })
        .eq('id', itemId)
      if (updateErr) throw updateErr

      onWasteLogged(cost, selectedItem?.name ?? 'item')
      setItemId('')
      setQuantity('')
      setReason('')
      setNotes('')
      setSearch('')
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Item *</Label>
        <div className="relative mb-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="pl-9"
          />
        </div>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Select item..." />
          </SelectTrigger>
          <SelectContent>
            {filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} — {item.current_quantity} {item.unit} in stock
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="waste-qty">
          Quantity wasted
          {selectedItem && (
            <span className="ml-1 font-normal text-zinc-500">({selectedItem.unit})</span>
          )}
          *
        </Label>
        <Input
          id="waste-qty"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Reason *</Label>
        <Select value={reason} onValueChange={(v) => setReason(v as WasteReason)}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason..." />
          </SelectTrigger>
          <SelectContent>
            {WASTE_REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {qty > 0 && selectedItem && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm text-red-700">Estimated waste cost</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(estimatedCost)}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="waste-notes">Notes (optional)</Label>
        <Input
          id="waste-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened?"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700"
        size="lg"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log waste
      </Button>
    </form>
  )
}
