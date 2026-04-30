'use server'

import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface LoginActionState {
  error?: string
  success?: string
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

  if (!isSupabaseConfigured()) {
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
    return {
      error: `Autentificare eșuată: ${error.message}`,
    }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
  }

  redirect('/login')
}
