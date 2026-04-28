'use client'

import { useState } from 'react'
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
import { InventoryItem, CATEGORIES, UNITS, Category, Unit } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ItemFormProps {
  restaurantId: string
  item?: InventoryItem
  onSuccess: () => void | Promise<void>
  onCancel: () => void
}

export function ItemForm({ restaurantId, item, onSuccess, onCancel }: ItemFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: item?.name ?? '',
    category: (item?.category ?? '') as Category | '',
    unit: (item?.unit ?? '') as Unit | '',
    current_quantity: item?.current_quantity?.toString() ?? '',
    reorder_threshold: item?.reorder_threshold?.toString() ?? '',
    cost_per_unit: item?.cost_per_unit?.toString() ?? '',
    expiry_date: item?.expiry_date ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!restaurantId) {
      toast.error('Restaurant not loaded yet — please refresh the page')
      return
    }
    if (!form.name || !form.category || !form.unit) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    const now = new Date().toISOString()
    const payload = {
      restaurant_id: restaurantId,
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      current_quantity: parseFloat(form.current_quantity) || 0,
      reorder_threshold: parseFloat(form.reorder_threshold) || 0,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
      expiry_date: form.expiry_date || null,
      updated_at: now,
    }

    try {
      if (item) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', item.id)
        if (error) throw error
        toast.success('Item updated')
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert({ ...payload, created_at: now })
        if (error) throw error
        toast.success('Item added')
      }
      await onSuccess()
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Whole Milk"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Unit *</Label>
          <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="qty">Current quantity</Label>
          <Input
            id="qty"
            type="number"
            min="0"
            step="0.01"
            value={form.current_quantity}
            onChange={(e) => set('current_quantity', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Reorder threshold</Label>
          <Input
            id="threshold"
            type="number"
            min="0"
            step="0.01"
            value={form.reorder_threshold}
            onChange={(e) => set('reorder_threshold', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost per unit (AUD)</Label>
        <Input
          id="cost"
          type="number"
          min="0"
          step="0.01"
          value={form.cost_per_unit}
          onChange={(e) => set('cost_per_unit', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiry">Expiry date (optional)</Label>
        <Input
          id="expiry"
          type="date"
          value={form.expiry_date}
          onChange={(e) => set('expiry_date', e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {item ? 'Save changes' : 'Add item'}
        </Button>
      </div>
    </form>
  )
}
