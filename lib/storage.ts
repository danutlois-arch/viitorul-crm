import { randomUUID } from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const CLUB_ASSETS_BUCKET = 'club-assets'

export function isStorageUploadConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function uploadClubLogo(input: {
  clubId: string
  file: File
}): Promise<
  | { ok: false; message: string }
  | { ok: true; publicUrl: string }
> {
  if (!isStorageUploadConfigured()) {
    return {
      ok: false,
      message:
        'Lipsește `SUPABASE_SERVICE_ROLE_KEY`, deci upload-ul real de logo nu este încă disponibil.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const extension = input.file.name.includes('.')
    ? input.file.name.split('.').pop()?.toLowerCase() ?? 'png'
    : 'png'
  const path = `clubs/${input.clubId}/logo-${randomUUID()}.${extension}`
  const bytes = await input.file.arrayBuffer()

  const { error } = await supabase.storage
    .from(CLUB_ASSETS_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type || 'image/png',
      upsert: true,
    })

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut încărca logo-ul în Supabase Storage. Verifică bucket-ul `club-assets` și cheile de mediu.',
    }
  }

  const { data } = supabase.storage.from(CLUB_ASSETS_BUCKET).getPublicUrl(path)

  return {
    ok: true,
    publicUrl: data.publicUrl,
  }
}

export async function uploadPlayerProfileImage(input: {
  clubId: string
  playerId?: string
  file: File
}): Promise<
  | { ok: false; message: string }
  | { ok: true; publicUrl: string }
> {
  if (!isStorageUploadConfigured()) {
    return {
      ok: false,
      message:
        'Lipsește `SUPABASE_SERVICE_ROLE_KEY`, deci upload-ul real pentru poze de jucători nu este încă disponibil.',
    }
  }

  const supabase = createSupabaseAdminClient()
  const extension = input.file.name.includes('.')
    ? input.file.name.split('.').pop()?.toLowerCase() ?? 'png'
    : 'png'
  const fileId = input.playerId ?? randomUUID()
  const path = `clubs/${input.clubId}/players/${fileId}.${extension}`
  const bytes = await input.file.arrayBuffer()

  const { error } = await supabase.storage
    .from(CLUB_ASSETS_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type || 'image/png',
      upsert: true,
    })

  if (error) {
    return {
      ok: false,
      message:
        'Nu am putut încărca poza jucătorului în Supabase Storage. Verifică bucket-ul `club-assets` și cheile de mediu.',
    }
  }

  const { data } = supabase.storage.from(CLUB_ASSETS_BUCKET).getPublicUrl(path)

  return {
    ok: true,
    publicUrl: data.publicUrl,
  }
}
