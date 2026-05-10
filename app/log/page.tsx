import { VisitForm } from '@/components/VisitForm'
import { PageHeader } from '@/components/PageHeader'
import { getCurrentDisplayName } from '@/lib/auth'

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>
}) {
  const { logged } = await searchParams
  const repName = await getCurrentDisplayName()

  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-24">
      <PageHeader title="Log a Visit" current="log" />

      {logged === '1' && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Visit logged. Nice work.
        </div>
      )}

      <VisitForm repName={repName} />
    </main>
  )
}
