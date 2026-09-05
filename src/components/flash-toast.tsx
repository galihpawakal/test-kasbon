'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function FlashToast({ message }: { message?: string }) {
  const hasFired = useRef(false)

  useEffect(() => {
    if (message && !hasFired.current) {
      toast.success(message)
      document.cookie = 'flash_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      hasFired.current = true
    }
  }, [message])

  return null
}
