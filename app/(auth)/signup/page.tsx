'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantName.trim()) {
      toast.error('Please enter your restaurant name')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: restaurantError } = await supabase.from('restaurants').insert({
        name: restaurantName.trim(),
        owner_id: data.user.id,
        created_at: new Date().toISOString(),
      })

      if (restaurantError) {
        toast.error('Account created but failed to set up restaurant. Please contact support.')
      } else {
        toast.success('Account created!')
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      toast.success('Check your email to confirm your account')
    }

    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Create your account</h1>
      <p className="mb-6 text-sm text-zinc-500">Start tracking inventory and reducing waste</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="restaurant">Restaurant / Cafe name *</Label>
          <Input
            id="restaurant"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="The Corner Cafe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chef@mycafe.com.au"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-zinc-400">
        By signing up you agree to our terms of service and privacy policy
      </p>
    </div>
  )
}
