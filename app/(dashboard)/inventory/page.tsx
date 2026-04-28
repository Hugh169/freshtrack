'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { InventoryList } from '@/components/inventory/InventoryList'
import { InventoryItem } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

export default function InventoryPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  // Keep both a ref (always current, no stale-closure issues) and state (for prop/UI)
  const restaurantIdRef = useRef<string>('')
  const [restaurantId, setRestaurantId] = useState('')

  async function fetchItems(rid: string) {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('restaurant_id', rid)
      .order('name')
    setItems(data ?? [])
  }

  // Called by InventoryList after add/edit — ref is always up-to-date
  async function handleRefresh() {
    if (!restaurantIdRef.current) return
    await fetchItems(restaurantIdRef.current)
    router.refresh()
  }

  useEffect(() => {
    let ignore = false

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (ignore || !user) {
        if (!user) router.push('/login')
        return
      }

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore) return

      if (!rid) {
        setLoading(false)
        return
      }

      // Write ref first so it is available synchronously to any child
      restaurantIdRef.current = rid
      setRestaurantId(rid)

      await fetchItems(rid)
      if (!ignore) setLoading(false)
    }

    init()
    return () => { ignore = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-4 h-8 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="mt-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="lg:p-4">
      <div className="px-4 pt-4 lg:px-0 lg:pt-0">
        <h1 className="text-2xl font-bold text-zinc-900">Inventory</h1>
        <p className="text-sm text-zinc-500">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
      </div>
      <InventoryList
        items={items}
        restaurantId={restaurantId}
        onRefresh={handleRefresh}
        loading={false}
      />
    </div>
  )
}
