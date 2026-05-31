"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getGymCduRegistrationUrl } from "@/lib/gym-user-client"

export function GymRegisterPrompt({ compact }: { compact?: boolean }) {
  const gymUrl = getGymCduRegistrationUrl()

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        ¿No aparece?{" "}
        <a href={gymUrl} target="_blank" rel="noopener noreferrer" className="underline text-secondary">
          Regístrate en Gym Control
        </a>
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm space-y-3">
      <p className="text-foreground">
        Esta persona debe registrarse en Gym Control CDU antes de participar en un préstamo.
      </p>
      <Button variant="outline" size="sm" className="gap-2" asChild>
        <a href={gymUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
          Ir al registro de Gym Control
        </a>
      </Button>
    </div>
  )
}
