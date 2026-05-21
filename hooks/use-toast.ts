'use client'

import { toast as sonnerToast } from 'sonner'

function toast(props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) {
  if (props.variant === 'destructive') {
    sonnerToast.error(props.title, { description: props.description })
  } else {
    sonnerToast(props.title, { description: props.description })
  }
}

function useToast() {
  return { toast }
}

export { useToast, toast }
