'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, PlusCircle, BarChart2, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/log', icon: PlusCircle, label: 'Log' },
  { href: '/waste', icon: BarChart2, label: 'Waste' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white lg:hidden">
      <div className="flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
                active ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Icon
                className={cn('h-5 w-5', active && 'text-zinc-900')}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
