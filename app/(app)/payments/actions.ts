'use server'

import { redirect } from 'next/navigation'
import { getActionRedirectUrl } from '@/lib/flash'
import {
  createPaymentForCurrentClub,
  deletePaymentForCurrentClub,
  updatePaymentForCurrentClub,
} from '@/lib/payments'
import type { PaymentStatus } from '@/lib/types'

export interface PaymentFormState {
  error?: string
  success?: string
}

const validStatuses = new Set<PaymentStatus>(['platit', 'partial', 'restant', 'scutit'])
const validMethods = new Set(['cash', 'transfer_bancar', 'card'])

export async function createPaymentAction(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const paymentId = String(formData.get('paymentId') ?? '').trim()
  const mode = String(formData.get('mode') ?? 'create').trim()
  const playerId = String(formData.get('playerId') ?? '').trim()
  const month = Number(formData.get('month') ?? 0)
  const year = Number(formData.get('year') ?? 0)
  const dueAmount = Number(formData.get('dueAmount') ?? 0)
  const paidAmount = Number(formData.get('paidAmount') ?? 0)
  const status = String(formData.get('status') ?? '').trim() as PaymentStatus
  const method = String(formData.get('method') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!playerId || !month || !year) {
    return { error: 'Completează jucătorul, luna și anul.' }
  }

  if (month < 1 || month > 12) {
    return { error: 'Luna selectată nu este validă.' }
  }

  if (year < 2024 || year > 2100) {
    return { error: 'Anul selectat nu este valid.' }
  }

  if (dueAmount < 0 || paidAmount < 0) {
    return { error: 'Sumele nu pot fi negative.' }
  }

  if (!validStatuses.has(status)) {
    return { error: 'Statusul plății nu este valid.' }
  }

  if (!validMethods.has(method)) {
    return { error: 'Metoda de plată nu este validă.' }
  }

  const result =
    mode === 'edit' && paymentId
      ? await updatePaymentForCurrentClub({
          paymentId,
          playerId,
          month,
          year,
          dueAmount,
          paidAmount,
          status,
          method: method as 'cash' | 'transfer_bancar' | 'card',
          notes,
        })
      : await createPaymentForCurrentClub({
          playerId,
          month,
          year,
          dueAmount,
          paidAmount,
          status,
          method: method as 'cash' | 'transfer_bancar' | 'card',
          notes,
        })

  return result.ok ? { success: result.message } : { error: result.message }
}

export async function deletePaymentAction(formData: FormData) {
  const paymentId = String(formData.get('paymentId') ?? '').trim()

  if (!paymentId) {
    return
  }

  const result = await deletePaymentForCurrentClub(paymentId)
  redirect(
    getActionRedirectUrl({
      fallbackPath: '/payments',
      message: result.message,
      tone: result.ok ? 'success' : 'error',
      clearKeys: ['editPayment'],
    })
  )
}
