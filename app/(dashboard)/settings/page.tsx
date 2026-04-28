'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateRestaurant } from '@/lib/getOrCreateRestaurant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loader2, Bell, BellOff } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [email, setEmail] = useState('')
  const [notifLowStock, setNotifLowStock] = useState(true)
  const [notifExpiry, setNotifExpiry] = useState(true)
  const [notifWaste, setNotifWaste] = useState(false)

  useEffect(() => {
    let ignore = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (ignore || !user) { if (!user) router.push('/login'); return }
      if (!ignore) setEmail(user.email ?? '')

      const rid = await getOrCreateRestaurant(supabase, user.id)
      if (ignore) return
      if (rid) {
        setRestaurantId(rid)
        // Fetch name after ensuring row exists
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', rid)
          .single()
        if (!ignore) setRestaurantName(restaurant?.name ?? '')
      }
      if (!ignore) setLoading(false)
    }

    load()
    return () => { ignore = true }
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantId || !restaurantName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('restaurants')
      .update({ name: restaurantName.trim() })
      .eq('id', restaurantId)
    setSaving(false)
    if (error) {
      toast.error('Failed to save')
    } else {
      toast.success('Settings saved')
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">Manage your restaurant profile</p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Restaurant details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-zinc-900">Restaurant details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rname">Restaurant name</Label>
              <Input
                id="rname"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Owner email</Label>
              <Input id="email" value={email} readOnly disabled className="bg-zinc-50" />
              <p className="text-xs text-zinc-400">Email cannot be changed here</p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </div>

        {/* Notification preferences */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-zinc-900">Notification preferences</h2>
          <p className="mb-4 text-xs text-zinc-400">
            Email/SMS notifications coming soon — toggle UI only
          </p>
          <div className="space-y-3">
            {[
              {
                id: 'low-stock',
                label: 'Low stock alerts',
                desc: 'Alert when items fall below reorder threshold',
                value: notifLowStock,
                set: setNotifLowStock,
              },
              {
                id: 'expiry',
                label: 'Expiry reminders',
                desc: 'Alert when items are expiring within 3 days',
                value: notifExpiry,
                set: setNotifExpiry,
              },
              {
                id: 'waste',
                label: 'Weekly waste summary',
                desc: 'Weekly email with waste cost breakdown',
                value: notifWaste,
                set: setNotifWaste,
              },
            ].map(({ id, label, desc, value, set }) => (
              <div
                key={id}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(!value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-zinc-900">Account</h2>
          <p className="mb-4 text-xs text-zinc-400">Manage your account</p>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
              router.refresh()
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
