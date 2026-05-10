import { supabaseServer } from '@/lib/supabase'

export type EditAction = 'create' | 'update' | 'soft_delete' | 'restore'

// V1 placeholder for the audit log's actor field on edits/deletes. We don't
// have per-user identity yet, so all edit actions record the same string.
// V2 (per-user auth) replaces this with the logged-in user's email.
export const SHARED_PASSCODE_ACTOR = '(passcode user)'

export async function writeEditEvent(args: {
  entity_type: 'visit' | 'location'
  entity_id: string
  actor_name: string
  action: EditAction
  diff?: unknown
}): Promise<void> {
  const sb = supabaseServer()
  const { error } = await sb.from('edit_events').insert({
    entity_type: args.entity_type,
    entity_id: args.entity_id,
    actor_name: args.actor_name,
    action: args.action,
    diff: args.diff ?? null,
  })
  // Never fail a user's action over a dropped audit row. Surface to logs only.
  if (error) {
    console.error('edit_events insert failed:', error.message)
  }
}
