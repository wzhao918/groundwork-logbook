import { VisitForm } from '@/components/VisitForm'
import { PageHeader } from '@/components/PageHeader'
import { getCurrentDisplayName } from '@/lib/auth'

export default async function LogPage() {
  const repName = await getCurrentDisplayName()

  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-24">
      <PageHeader title="Log a Visit" current="log" />
      <VisitForm repName={repName} />
    </main>
  )
}
