'use server'

import { redirect } from 'next/navigation'
import { isSupabaseAuthConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface LoginActionState {
  error?: string
  success?: string
}

function mapLoginErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Emailul sau parola sunt incorecte.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Contul nu este încă confirmat. Verifică emailul sau confirmă utilizatorul din Supabase.'
  }

  if (normalized.includes('too many requests')) {
    return 'Au fost prea multe încercări de autentificare. Încearcă din nou în câteva minute.'
  }

  return 'Autentificarea nu a putut fi finalizată momentan. Încearcă din nou.'
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Completează emailul și parola.' }
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      error:
        'Adaugă variabilele NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY în .env.local pentru autentificarea reală.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Supabase login failed', {
      email,
      message: error.message,
    })

    return {
      error: mapLoginErrorMessage(error.message),
    }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  if (isSupabaseAuthConfigured()) {
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
  }

  redirect('/login')
}
