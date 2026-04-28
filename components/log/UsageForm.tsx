'use client'

import { useState } from 'react'
import { InventoryItem } from '@/types'
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
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'

interface UsageFormProps {
  restaurantId: string
  userId: string
  items: InventoryItem[]
}

export function UsageForm({ restaurantId, userId, items }: UsageFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')

  const selectedItem = items.find((i) => i.id === itemId)
  const filteredItems = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemId || !quantity) {
      toast.error('Please select an item and quantity')
      return
    }
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be a positive number')
      return
    }
    if (selectedItem && qty > selectedItem.current_quantity) {
      toast.error(`Only ${selectedItem.current_quantity} ${selectedItem.unit} in stock`)
      return
    }

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { error: moveErr } = await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        item_id: itemId,
        movement_type: 'used',
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

      toast.success(`Usage logged: −${qty} ${selectedItem?.unit ?? ''}`)
      setItemId('')
      setQuantity('')
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
        <Label htmlFor="use-qty">
          Quantity used
          {selectedItem && (
            <span className="ml-1 font-normal text-zinc-500">({selectedItem.unit})</span>
          )}
          *
        </Label>
        <Input
          id="use-qty"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
          required
        />
        {selectedItem && (
          <p className="text-xs text-zinc-500">
            {selectedItem.current_quantity} {selectedItem.unit} currently in stock
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="use-notes">Notes (optional)</Label>
        <Input
          id="use-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Brunch service"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log usage
      </Button>
    </form>
  )
}
