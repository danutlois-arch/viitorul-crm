export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  html: string
  text: string
}) {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      message: 'Configurează RESEND_API_KEY și EMAIL_FROM pentru trimiterea emailurilor.',
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!response.ok) {
    return {
      ok: false,
      message: 'Providerul de email a respins trimiterea. Verifică datele Resend.',
    }
  }

  const data = (await response.json()) as { id?: string }
  return {
    ok: true,
    messageId: data.id ?? '',
  }
}
