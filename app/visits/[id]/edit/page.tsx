import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import { VisitForm } from '@/components/VisitForm'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { softDeleteVisit } from '@/app/visits/actions'

const ALLOWED_RETURNS = new Set(['/dashboard', '/locations'])

function safeReturnUrl(raw: string | undefined): string {
  if (!raw) return '/dashboard'
  // Allow exact known paths or per-location routes; anything else gets the safe default.
  if (ALLOWED_RETURNS.has(raw)) return raw
  if (/^\/locations\/[0-9a-f-]{36}$/i.test(raw)) return raw
  return '/dashboard'
}

export default async function EditVisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ return?: string }>
}) {
  const { id } = await params
  const { return: rawReturn } = await searchParams
  const returnUrl = safeReturnUrl(rawReturn)

  const sb = supabaseServer()
  const visitRes = await sb
    .from('visits')
    .select(
      'id, location_id, visit_date, rep_name, outcomes, flier_version, fliers_left, notes',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (visitRes.error || !visitRes.data) notFound()
  const visit = visitRes.data

  const locRes = await sb
    .from('locations')
    .select('id, street_address, city_town')
    .eq('id', visit.location_id)
    .maybeSingle()

  if (locRes.error || !locRes.data) notFound()
  const location = locRes.data

  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-24">
      <div className="mb-6">
        <Link
          href={returnUrl}
          className="text-sm text-stone-600 underline underline-offset-2"
        >
          ← Back
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Edit visit
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {location.street_address} · {location.city_town}
        </p>
      </div>

      <VisitForm
        editing={{
          visitId: visit.id,
          initialValues: {
            rep_name: visit.rep_name,
            visit_date: visit.visit_date,
            outcomes: visit.outcomes,
            flier_version: visit.flier_version,
            fliers_left: visit.fliers_left,
            notes: visit.notes,
          },
          initialLocation: location,
          returnUrl,
        }}
      />

      <div className="mt-8 border-t border-stone-200 pt-6">
        <ConfirmDeleteButton
          triggerLabel="Delete this visit"
          title="Delete this visit?"
          message="It will be hidden from the dashboard and the location's history. The audit log keeps a record."
          formAction={softDeleteVisit.bind(null, visit.id, returnUrl)}
        />
      </div>
    </main>
  )
}
