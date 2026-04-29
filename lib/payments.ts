import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logClubActivity } from '@/lib/activity-log'
import { getAppViewer } from '@/lib/auth'
import {
  contributions as demoContributions,
  payments as demoPayments,
  players as demoPlayers,
} from '@/lib/demo-data'
import { isSupabaseConfigured } from '@/lib/env'
import { monthToLabel } from '@/lib/payment-utils'
import { ensureViewerCanManage } from '@/lib/permissions'
import { getPlayersForCurrentClub } from '@/lib/players'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'
import type {
  Contribution,
  ContributionProvider,
  ContributionStatus,
  ContributionType,
  Payment,
  PaymentStatus,
  Player,
} from '@/lib/types'

interface SupabasePaymentRow {
  id: string
  player_id: string
  month: number
  year: number
  due_amount: number | null
  paid_amount: number | null
  status: PaymentStatus
  paid_at: string | null
  payment_method: Payment['method'] | null
  notes: string | null
}

interface SupabaseContributionRow {
  id: string
  club_id: string
  contributor_name: string
  contributor_email: string | null
  contributor_phone: string | null
  contribution_type: ContributionType
  amount: number | null
  status: ContributionStatus
  source: 'online' | 'manual'
  provider: ContributionProvider | null
  checkout_url: string | null
  external_checkout_id: string | null
  sponsor_company: string | null
  notes: string | null
  paid_at: string | null
}

function mapContributionRow(row: SupabaseContributionRow): Contribution {
  return {
    id: row.id,
    clubId: row.club_id,
    contributorName: row.contributor_name,
    contributorEmail: row.contributor_email ?? '',
    contributorPhone: row.contributor_phone ?? '',
    type: row.contribution_type,
    amount: Number(row.amount ?? 0),
    status: row.status,
    source: row.source,
    provider: row.provider ?? 'manual',
    checkoutUrl: row.checkout_url ?? '',
    externalCheckoutId: row.external_checkout_id ?? '',
    sponsorCompany: row.sponsor_company ?? '',
    notes: row.notes ?? '',
    paidAt: row.paid_at,
  }
}

function mapPaymentRow(row: SupabasePaymentRow): Payment {
  return {
    id: row.id,
    playerId: row.player_id,
    month: monthToLabel(row.month),
    year: row.year,
    dueAmount: Number(row.due_amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    status: row.status,
    paidAt: row.paid_at,
    method: row.payment_method ?? 'cash',
    notes: row.notes ?? '',
  }
}

export async function getPaymentsForCurrentClub() {
  const viewer = await getAppViewer()
  const playerData = await getPlayersForCurrentClub()

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return buildPaymentView(demoPayments, demoPlayers, demoContributions)
  }

  const supabase = createSupabaseServerClient()
  const [
    { data: paymentRows, error: paymentsError },
    { data: contributionRows, error: contributionsError },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select(
        `
          id,
          player_id,
          month,
          year,
          due_amount,
          paid_amount,
          status,
          paid_at,
          payment_method,
          notes
        `
      )
      .eq('club_id', viewer.club.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
    supabase
      .from('funding_contributions')
      .select(
        `
          id,
          club_id,
          contributor_name,
          contributor_email,
          contributor_phone,
          contribution_type,
          amount,
          status,
          source,
          checkout_url,
          sponsor_company,
          notes,
          paid_at
        `
      )
      .eq('club_id', viewer.club.id)
      .order('paid_at', { ascending: false, nullsFirst: false }),
  ])

  if (paymentsError || !paymentRows) {
    return buildPaymentView(demoPayments, demoPlayers, demoContributions)
  }

  const mappedContributions =
    !contributionsError && contributionRows
      ? (contributionRows as SupabaseContributionRow[]).map(mapContributionRow)
      : demoContributions

  return buildPaymentView(
    (paymentRows as SupabasePaymentRow[]).map(mapPaymentRow),
    playerData.players,
    mappedContributions
  )
}

function buildPaymentView(
  payments: Payment[],
  players: Player[],
  contributions: Contribution[]
) {
  const totalCollected = payments.reduce((total, item) => total + item.paidAmount, 0)
  const totalOutstanding = payments.reduce(
    (total, item) => total + Math.max(item.dueAmount - item.paidAmount, 0),
    0
  )
  const debtors = payments.filter(
    (item) => item.status === 'partial' || item.status === 'restant'
  ).length
  const onlineContributionTotal = contributions
    .filter((item) => item.status === 'paid')
    .reduce((total, item) => total + item.amount, 0)
  const pendingContributions = contributions.filter(
    (item) => item.status === 'pending' || item.status === 'draft'
  ).length

  const rows = payments.map((payment) => {
    const player = players.find((entry) => entry.id === payment.playerId)
    return {
      id: payment.id,
      playerId: payment.playerId,
      playerName: player ? `${player.firstName} ${player.lastName}` : '-',
      month: payment.month,
      year: payment.year,
      dueAmount: payment.dueAmount,
      paidAmount: payment.paidAmount,
      status: payment.status,
      method: payment.method,
      notes: payment.notes,
    }
  })

  const contributionRows = contributions.map((contribution) => ({
    id: contribution.id,
    contributorName: contribution.contributorName,
    sponsorCompany: contribution.sponsorCompany || '-',
    type: contribution.type,
    amount: contribution.amount,
    status: contribution.status,
    source: contribution.source,
    provider: contribution.provider,
    checkoutUrl: contribution.checkoutUrl,
    externalCheckoutId: contribution.externalCheckoutId,
    paidAt: contribution.paidAt ?? '-',
  }))

  return {
    payments,
    players,
    contributions,
    rows,
    contributionRows,
    summary: {
      totalCollected,
      totalOutstanding,
      debtors,
      onlineContributionTotal,
      pendingContributions,
    },
  }
}

export async function createPaymentForCurrentClub(input: {
  playerId: string
  month: number
  year: number
  dueAmount: number
  paidAmount: number
  status: PaymentStatus
  method: Payment['method']
  notes: string
}) {
  const permission = await ensureViewerCanManage('payments')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva plăți reale în baza de date.',
    }
  }

  const paidAt = input.paidAmount > 0 ? new Date().toISOString().slice(0, 10) : null
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('payments').insert({
    club_id: viewer.club.id,
    player_id: input.playerId,
    month: input.month,
    year: input.year,
    due_amount: input.dueAmount,
    paid_amount: input.paidAmount,
    status: input.status,
    paid_at: paidAt,
    payment_method: input.method,
    notes: input.notes || null,
  })

  if (error) {
    return {
      ok: false,
      message: 'Nu am putut salva plata. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/payments')
  await logClubActivity({
    area: 'payments',
    action: 'create',
    entityLabel: `${monthToLabel(input.month)} ${input.year}`,
    details: 'Plată înregistrată pentru un jucător din club.',
  })

  return {
    ok: true,
    message: 'Plata a fost înregistrată cu succes.',
  }
}

export async function getPaymentByIdForCurrentClub(paymentId: string) {
  const paymentData = await getPaymentsForCurrentClub()
  return paymentData.payments.find((payment) => payment.id === paymentId) ?? null
}

export async function updatePaymentForCurrentClub(input: {
  paymentId: string
  playerId: string
  month: number
  year: number
  dueAmount: number
  paidAmount: number
  status: PaymentStatus
  method: Payment['method']
  notes: string
}) {
  const permission = await ensureViewerCanManage('payments')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a actualiza plăți reale în baza de date.',
    }
  }

  const paidAt = input.paidAmount > 0 ? new Date().toISOString().slice(0, 10) : null
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('payments')
    .update({
      player_id: input.playerId,
      month: input.month,
      year: input.year,
      due_amount: input.dueAmount,
      paid_amount: input.paidAmount,
      status: input.status,
      paid_at: paidAt,
      payment_method: input.method,
      notes: input.notes || null,
    })
    .eq('id', input.paymentId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: 'Nu am putut actualiza plata. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'payments',
    action: 'update',
    entityLabel: `${monthToLabel(input.month)} ${input.year}`,
    details: 'Plata a fost actualizată.',
  })

  return {
    ok: true,
    message: 'Plata a fost actualizată cu succes.',
  }
}

export async function deletePaymentForCurrentClub(paymentId: string) {
  const permission = await ensureViewerCanManage('payments')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a șterge plăți reale din baza de date.',
    }
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('club_id', viewer.club.id)

  if (error) {
    return {
      ok: false,
      message: 'Nu am putut șterge plata. Verifică rolul curent și politicile RLS.',
    }
  }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  await logClubActivity({
    area: 'payments',
    action: 'delete',
    entityLabel: paymentId,
    details: 'Plată ștearsă din evidență.',
  })

  return {
    ok: true,
    message: 'Plata a fost ștearsă cu succes.',
  }
}

export async function createContributionForCurrentClub(input: {
  contributorName: string
  contributorEmail: string
  contributorPhone: string
  type: ContributionType
  amount: number
  source: 'online' | 'manual'
  sponsorCompany: string
  notes: string
}) {
  const permission = await ensureViewerCanManage('contributions')
  const viewer = permission.viewer

  if (!permission.ok) {
    return { ok: false, message: permission.message }
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return {
      ok: false,
      message:
        'Conectează Supabase și autentifică-te pentru a salva donații sau sponsorizări reale.',
    }
  }

  const supabase = createSupabaseServerClient()
  const insertPayload = {
    club_id: viewer.club.id,
    contributor_name: input.contributorName,
    contributor_email: input.contributorEmail || null,
    contributor_phone: input.contributorPhone || null,
    contribution_type: input.type,
    amount: input.amount,
    status: input.source === 'online' ? 'pending' : 'paid',
    source: input.source,
    provider: input.source === 'online' ? 'stripe' : 'manual',
    checkout_url: null,
    external_checkout_id: null,
    sponsor_company: input.sponsorCompany || null,
    notes: input.notes || null,
    paid_at: input.source === 'manual' ? new Date().toISOString().slice(0, 10) : null,
  }

  const { data: contributionRow, error } = await supabase
    .from('funding_contributions')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !contributionRow?.id) {
    return {
      ok: false,
      message:
        'Nu am putut salva contribuția. Verifică tabela funding_contributions și politicile RLS.',
    }
  }

  if (input.source === 'online') {
    if (!isStripeConfigured()) {
      return {
        ok: false,
        message:
          'Configurează STRIPE_SECRET_KEY și NEXT_PUBLIC_APP_URL pentru plăți online Stripe.',
      }
    }

    const stripe = getStripeClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL as string
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/payments?contribution=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payments?contribution=cancelled&contribution_id=${contributionRow.id}`,
      customer_email: input.contributorEmail || undefined,
      client_reference_id: contributionRow.id,
      metadata: {
        contribution_id: contributionRow.id,
        club_id: viewer.club.id,
        contribution_type: input.type,
        contributor_name: input.contributorName,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'ron',
            unit_amount: Math.round(input.amount * 100),
            product_data: {
              name:
                input.type === 'donatie'
                  ? `Donație ${viewer.club.name}`
                  : `Sponsorizare ${viewer.club.name}`,
              description:
                input.sponsorCompany || input.notes || 'Contribuție procesată prin Stripe Checkout',
            },
          },
        },
      ],
    })

    await supabase
      .from('funding_contributions')
      .update({
        checkout_url: session.url,
        external_checkout_id: session.id,
      })
      .eq('id', contributionRow.id)

    await logClubActivity({
      area: 'contributions',
      action: 'create',
      entityLabel: input.contributorName,
      details: 'Contribuție online inițiată prin Stripe Checkout.',
    })

    revalidatePath('/payments')
    redirect(session.url as string)
  }

  revalidatePath('/payments')
  await logClubActivity({
    area: 'contributions',
    action: 'create',
    entityLabel: input.contributorName,
    details: 'Contribuție manuală înregistrată cu succes.',
  })

  return {
    ok: true,
    message: 'Contribuția a fost înregistrată cu succes.',
  }
}

export async function getContributionBySessionOrId(input: {
  sessionId?: string
  contributionId?: string
}) {
  const viewer = await getAppViewer()

  if (!input.sessionId && !input.contributionId) {
    return null
  }

  if (!isSupabaseConfigured() || viewer.source === 'demo') {
    return (
      demoContributions.find(
        (item) =>
          (input.sessionId && item.externalCheckoutId === input.sessionId) ||
          (input.contributionId && item.id === input.contributionId)
      ) ?? null
    )
  }

  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('funding_contributions')
    .select(
      `
        id,
        club_id,
        contributor_name,
        contributor_email,
        contributor_phone,
        contribution_type,
        amount,
        status,
        source,
        provider,
        checkout_url,
        external_checkout_id,
        sponsor_company,
        notes,
        paid_at
      `
    )
    .eq('club_id', viewer.club.id)
    .limit(1)

  if (input.sessionId) {
    query = query.eq('external_checkout_id', input.sessionId)
  } else if (input.contributionId) {
    query = query.eq('id', input.contributionId)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return null
  }

  return mapContributionRow(data as SupabaseContributionRow)
}
