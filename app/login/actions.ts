'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  signToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from '@/lib/session'

export type LoginState = { error?: string }

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const passcode = String(formData.get('passcode') ?? '')
  if (!process.env.APP_PASSCODE) {
    return { error: 'Server not configured.' }
  }
  if (passcode !== process.env.APP_PASSCODE) {
    return { error: 'Wrong passcode.' }
  }
  const token = await signToken()
  const c = await cookies()
  c.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  redirect('/log')
}
