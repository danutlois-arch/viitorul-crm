'use client'

import type { MouseEvent } from 'react'
import { useFormStatus } from 'react-dom'

interface ConfirmSubmitButtonProps {
  label: string
  pendingLabel?: string
  confirmMessage: string
  className?: string
}

export function ConfirmSubmitButton({
  label,
  pendingLabel = 'Se procesează...',
  confirmMessage,
  className,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus()

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (pending) {
      return
    }

    if (!window.confirm(confirmMessage)) {
      event.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
