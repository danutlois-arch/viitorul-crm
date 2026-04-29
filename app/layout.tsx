import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/app-config'
import { getPublicAppUrl } from '@/lib/env'
import './globals.css'

const publicAppUrl = getPublicAppUrl()
const metadataBase = (() => {
  if (!publicAppUrl) {
    return undefined
  }

  try {
    return new URL(publicAppUrl)
  } catch {
    return undefined
  }
})()

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Platformă SaaS pentru cluburi și academii de fotbal din România.',
  metadataBase,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
