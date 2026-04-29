'use server'

import { updateCurrentClubSettings } from '@/lib/clubs'
import { uploadClubLogo } from '@/lib/storage'

export interface ClubSettingsFormState {
  error?: string
  success?: string
}

export async function updateClubSettingsAction(
  _prevState: ClubSettingsFormState,
  formData: FormData
): Promise<ClubSettingsFormState> {
  const name = String(formData.get('name') ?? '').trim()
  const cui = String(formData.get('cui') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const county = String(formData.get('county') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const website = String(formData.get('website') ?? '').trim()
  const manualLogoUrl = String(formData.get('logoUrl') ?? '').trim()
  const themeKey = String(formData.get('themeKey') ?? '').trim()
  const logoFile = formData.get('logoFile')
  const socialMedia = String(formData.get('socialMedia') ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!name || !cui || !city || !county || !email) {
    return { error: 'Completează numele clubului, CUI-ul, orașul, județul și emailul.' }
  }

  if (!email.includes('@')) {
    return { error: 'Emailul clubului trebuie să fie valid.' }
  }

  let logoUrl = manualLogoUrl
  if (logoFile instanceof File && logoFile.size > 0) {
    const uploadResult = await uploadClubLogo({
      clubId: String(formData.get('clubId') ?? '').trim() || 'club',
      file: logoFile,
    })

    if (!uploadResult.ok) {
      return { error: uploadResult.message }
    }

    logoUrl = uploadResult.publicUrl
  }

  const result = await updateCurrentClubSettings({
    name,
    cui,
    city,
    county,
    email,
    phone,
    address,
    website,
    socialMedia,
    logoUrl,
    themeKey,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}
