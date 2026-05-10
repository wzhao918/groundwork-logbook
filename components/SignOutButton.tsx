'use client'

import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  async function signOut() {
    const supabase = supabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="text-sm text-stone-600 underline underline-offset-2"
    >
      Sign out
    </button>
  )
}
