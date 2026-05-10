import { supabaseServer } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Returns the user's display name (set during onboarding), falling back to
// the local-part of their email, then to a generic placeholder. Used as the
// rep_name on new visits and the actor_name on edit/delete audit rows.
export async function getCurrentDisplayName(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) return 'Unknown'
  const name = (user.user_metadata?.display_name as string | undefined)?.trim()
  return name || user.email?.split('@')[0] || 'Unknown'
}
