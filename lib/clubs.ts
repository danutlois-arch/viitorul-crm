import { revalidatePath } from 'next/cache'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import { currentClub } from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { ensureViewerCanManage } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function getCurrentClubDetails() {
  const viewer = await getAppViewer()
  return viewer.club ?? currentClub
}

export async function updateCurrentClubSettings(input: {
  name: string
  cui: string
  city: string
  county: string
  email: string
  phone: string
  address: string
  website: string
  socialMedia: string[]
  logoUrl: string
  themeKey: string
}) {
  const permission = await ensureViewerCanManage('club_settings')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te cu un rol de administrare pentru a salva setările clubului.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('clubs')
    .update({
      name: input.name,
      cui: input.cui,
      city: input.city,
      county: input.county,
      logo_url: input.logoUrl || null,
      email: input.email,
      phone: input.phone || null,
      address: input.address || null,
      website: input.website || null,
      social_media: input.socialMedia,
      theme_key: input.themeKey || null,
    })
    .eq('id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: `Nu am putut salva setările clubului: ${error.message}`,
    }
  }

  revalidatePath('/clubs')
  revalidatePath('/dashboard')
  await logClubActivity({
    area: 'club_settings',
    action: 'update',
    entityLabel: input.name,
    details: 'Datele clubului și brandingul au fost actualizate.',
  })

  return {
    ok: true,
    message: 'Setările clubului au fost actualizate cu succes.',
  }
}
