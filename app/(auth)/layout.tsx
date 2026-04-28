import { Leaf } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="mb-8 flex items-center gap-2">
        <Leaf className="h-8 w-8 text-green-600" />
        <span className="text-2xl font-bold text-zinc-900">FreshTrack</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
