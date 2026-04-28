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

interface DeliveryFormProps {
  restaurantId: string
  userId: string
  items: InventoryItem[]
  preselectedItemId?: string
}

export function DeliveryForm({
  restaurantId,
  userId,
  items,
  preselectedItemId,
}: DeliveryFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [itemId, setItemId] = useState(preselectedItemId ?? '')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
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

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { error: moveErr } = await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        item_id: itemId,
        movement_type: 'received',
        quantity: qty,
        notes: notes || null,
        recorded_at: now,
        created_by: userId,
      })
      if (moveErr) throw moveErr

      const updatePayload: Record<string, unknown> = {
        current_quantity: (selectedItem?.current_quantity ?? 0) + qty,
        updated_at: now,
      }
      if (expiryDate) updatePayload.expiry_date = expiryDate

      const { error: updateErr } = await supabase
        .from('inventory_items')
        .update(updatePayload)
        .eq('id', itemId)
      if (updateErr) throw updateErr

      toast.success(`Delivery logged: +${qty} ${selectedItem?.unit ?? ''}`)
      setItemId(preselectedItemId ?? '')
      setQuantity('')
      setExpiryDate('')
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
        <Label htmlFor="del-qty">
          Quantity received
          {selectedItem && (
            <span className="ml-1 font-normal text-zinc-500">({selectedItem.unit})</span>
          )}
          *
        </Label>
        <Input
          id="del-qty"
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
        <Label htmlFor="del-expiry">Updated expiry date (optional)</Label>
        <Input
          id="del-expiry"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="del-notes">Notes (optional)</Label>
        <Input
          id="del-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Invoice #1234"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log delivery
      </Button>
    </form>
  )
}
