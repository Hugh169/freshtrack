'use client'

import { Leaf, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title: string
  restaurantName?: string
}

export function Header({ title, restaurantName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-600" />
        <span className="font-bold text-zinc-900">FreshTrack</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
