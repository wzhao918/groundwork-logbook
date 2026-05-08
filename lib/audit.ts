import { supabaseServer } from '@/lib/supabase'

export type EditAction = 'create' | 'update' | 'soft_delete' | 'restore'

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
