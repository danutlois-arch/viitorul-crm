import Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeClient } from '@/lib/stripe'

export async function POST(request: Request) {
  const signature = headers().get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return new NextResponse('Missing Stripe webhook secret or signature.', {
      status: 400,
    })
  }

  const body = await request.text()
  const stripe = getStripeClient()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return new NextResponse('Invalid Stripe signature.', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const contributionId = session.metadata?.contribution_id

    if (
      contributionId &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      await supabaseAdmin
        .from('funding_contributions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString().slice(0, 10),
          checkout_url: session.url,
          external_checkout_id: session.id,
        })
        .eq('id', contributionId)
    }
  }

  return NextResponse.json({ received: true })
}
