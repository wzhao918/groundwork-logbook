import { redirect } from 'next/navigation'

// Root just bounces to /log. Middleware handles the auth gate before this runs.
export default function Home() {
  redirect('/log')
}
