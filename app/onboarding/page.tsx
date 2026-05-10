import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { OnboardingForm } from '@/components/OnboardingForm'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // If they already have a display_name, they don't belong here.
  const displayName = (
    user.user_metadata?.display_name as string | undefined
  )?.trim()
  if (displayName) redirect('/log')

  return (
    <main className="mx-auto max-w-md px-6 py-10 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Groundwork Logbook
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Signed in as <span className="font-medium">{user.email}</span>. One
          quick thing before you start.
        </p>
      </div>

      <OnboardingForm />
    </main>
  )
}
