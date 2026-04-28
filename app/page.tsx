import { redirect } from 'next/navigation'

// Middleware handles auth-aware routing for '/' — this is a fallback only
export default function Home() {
  redirect('/dashboard')
}
