'use client'

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface ClubLogoProps {
  src?: string | null
  alt: string
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ClubLogo({
  src,
  alt,
  className,
  imageClassName,
  fallbackClassName,
}: ClubLogoProps) {
  const [hasError, setHasError] = useState(false)
  const initials = useMemo(() => getInitials(alt), [alt])
  const shouldRenderImage = Boolean(src && !hasError)

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-2xl bg-white/95',
        className
      )}
    >
      {shouldRenderImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={cn('h-full w-full object-contain', imageClassName)}
        />
      ) : (
        <div
          aria-label={alt}
          title={alt}
          className={cn(
            'flex h-full w-full items-center justify-center bg-brand-50 text-lg font-semibold uppercase tracking-[0.18em] text-brand-700',
            fallbackClassName
          )}
        >
          {initials || 'FC'}
        </div>
      )}
    </div>
  )
}
