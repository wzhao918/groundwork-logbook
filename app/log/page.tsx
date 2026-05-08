import { VisitForm } from '@/components/VisitForm'

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>
}) {
  const { logged } = await searchParams
  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-24">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Log a Visit</h1>
        <a
          href="/dashboard"
          className="text-sm text-stone-600 underline underline-offset-2"
        >
          Dashboard →
        </a>
      </header>

      {logged === '1' && (
        <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Visit logged. Nice work.
        </div>
      )}

      <VisitForm />
    </main>
  )
}
