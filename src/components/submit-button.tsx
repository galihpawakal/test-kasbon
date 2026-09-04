'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ComponentProps } from 'react'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  pendingText?: string
}

export function SubmitButton({ children, pendingText = 'Memproses...', ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? pendingText : children}
    </Button>
  )
}
