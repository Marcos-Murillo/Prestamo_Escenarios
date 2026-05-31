"use client"

import { useAuth } from "@/lib/auth-context"
import { SEDES_ACTIVAS, SEDE_LABELS, type SedeFiltro } from "@/lib/sede"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin } from "lucide-react"

export function AdminSedeSelector({ className }: { className?: string }) {
  const { usuario, adminSede, setAdminSedeActiva } = useAuth()

  if (!usuario || usuario.rol !== "superadmin") return null

  return (
    <div className={className}>
      <Select
        value={adminSede}
        onValueChange={(v) => setAdminSedeActiva(v as SedeFiltro)}
      >
        <SelectTrigger className="h-9 w-[200px] gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Sede" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las sedes</SelectItem>
          {SEDES_ACTIVAS.map((s) => (
            <SelectItem key={s} value={s}>
              {SEDE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function AdminSedeBadge() {
  const { usuario, adminSede } = useAuth()
  if (!usuario || usuario.rol === "solicitante") return null

  const label =
    adminSede === "todas"
      ? "Todas las sedes"
      : SEDE_LABELS[adminSede as keyof typeof SEDE_LABELS] ?? adminSede

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <MapPin className="h-3 w-3" />
      {label}
    </span>
  )
}
