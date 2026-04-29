'use server'

import { createContributionForCurrentClub } from '@/lib/payments'
import type { ContributionType } from '@/lib/types'

export interface ContributionFormState {
  error?: string
  success?: string
}

const validTypes = new Set<ContributionType>(['donatie', 'sponsorizare'])
const validSources = new Set(['online', 'manual'])

export async function createContributionAction(
  _prevState: ContributionFormState,
  formData: FormData
): Promise<ContributionFormState> {
  const contributorName = String(formData.get('contributorName') ?? '').trim()
  const contributorEmail = String(formData.get('contributorEmail') ?? '').trim()
  const contributorPhone = String(formData.get('contributorPhone') ?? '').trim()
  const type = String(formData.get('type') ?? '').trim() as ContributionType
  const amount = Number(formData.get('amount') ?? 0)
  const source = String(formData.get('source') ?? '').trim()
  const sponsorCompany = String(formData.get('sponsorCompany') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!contributorName || amount <= 0) {
    return { error: 'Completează numele contribuabilului și suma.' }
  }

  if (!validTypes.has(type)) {
    return { error: 'Tipul contribuției nu este valid.' }
  }

  if (!validSources.has(source)) {
    return { error: 'Sursa contribuției nu este validă.' }
  }

  if (type === 'sponsorizare' && !sponsorCompany) {
    return { error: 'Pentru sponsorizare completează și compania.' }
  }

  const result = await createContributionForCurrentClub({
    contributorName,
    contributorEmail,
    contributorPhone,
    type,
    amount,
    source: source as 'online' | 'manual',
    sponsorCompany,
    notes,
  })

  return result.ok ? { success: result.message } : { error: result.message }
}
