'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeliveryForm } from '@/components/log/DeliveryForm'
import { UsageForm } from '@/components/log/UsageForm'
import { WasteForm } from '@/components/log/WasteForm'
import { InventoryItem } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function LogPageInner() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'delivery'
  const preselectedItemId = searchParams.get('item') ?? undefined

  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [wasteConfirmation, setWasteConfirmation] = useState<{
    cost: number
    itemName: string
  } | null>(null)

  useEffect(() => {
    let ignore = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (ignore || !user) { if (!user) router.push('/login'); return }
      setUserId(user.id)

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore) return
      if (!rid) { setLoading(false); return }
      setRestaurantId(rid)

      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', rid)
        .order('name')

      if (ignore) return
      setItems(inventoryData ?? [])
      setLoading(false)
    }

    load()
    return () => { ignore = true }
  }, [])

  function handleWasteLogged(cost: number, itemName: string) {
    setWasteConfirmation({ cost, itemName })
    // Refresh items to update stock quantities
    supabase
      .from('inventory_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name')
      .then(({ data }) => setItems(data ?? []))
  }

  if (wasteConfirmation) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 rounded-full bg-red-100 p-5">
          <CheckCircle2 className="h-12 w-12 text-red-500" />
        </div>
        <p className="mb-2 text-lg font-medium text-zinc-500">You just logged</p>
        <p className="mb-1 text-5xl font-bold text-red-600">
          {formatCurrency(wasteConfirmation.cost)}
        </p>
        <p className="mb-8 text-lg font-medium text-zinc-500">in waste</p>
        <p className="mb-8 text-sm text-zinc-400">{wasteConfirmation.itemName}</p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button size="lg" onClick={() => setWasteConfirmation(null)}>
            Log another waste item
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/waste')}>
            View waste report
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="mb-6 h-10 w-full" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Log movement</h1>
        <p className="text-sm text-zinc-500">Record deliveries, usage, and waste</p>
      </div>

      <div className="mx-auto max-w-lg">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full">
            <TabsTrigger value="delivery" className="flex-1">
              Delivery
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1">
              Usage
            </TabsTrigger>
            <TabsTrigger value="waste" className="flex-1">
              Waste
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
            <TabsContent value="delivery">
              <DeliveryForm
                restaurantId={restaurantId}
                userId={userId}
                items={items}
                preselectedItemId={preselectedItemId}
              />
            </TabsContent>
            <TabsContent value="usage">
              <UsageForm restaurantId={restaurantId} userId={userId} items={items} />
            </TabsContent>
            <TabsContent value="waste">
              <WasteForm
                restaurantId={restaurantId}
                userId={userId}
                items={items}
                onWasteLogged={handleWasteLogged}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
      <LogPageInner />
    </Suspense>
  )
}
