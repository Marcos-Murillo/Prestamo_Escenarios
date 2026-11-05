"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ASISTENCIA_URL } from "@/lib/asistencia-url"

export function GymRegisterPrompt({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground">
        ¿No aparece?{" "}
        <a href={ASISTENCIA_URL} target="_blank" rel="noopener noreferrer" className="underline text-secondary">
          Regístrate en Asistencias
        </a>
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm space-y-3">
      <p className="text-foreground">
        Esta persona debe registrarse en Asistencias antes de participar en un préstamo.
      </p>
      <Button variant="outline" size="sm" className="gap-2" asChild>
        <a href={ASISTENCIA_URL} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
          Ir al registro de Asistencias
        </a>
      </Button>
    </div>
  )
}
