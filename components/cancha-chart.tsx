"use client"

import { Cancha } from "@/lib/types"
import { getCanchaColor } from "@/lib/canchas-data"
import { labelTipoEscenario } from "@/lib/tipos-escenario"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CanchaCardProps {
  cancha: Cancha
  selected?: boolean
  onSelect: (cancha: Cancha) => void
}

export function CanchaCard({ cancha, selected, onSelect }: CanchaCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onSelect(cancha)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{cancha.nombre}</CardTitle>
          <Badge variant="outline" className={cn("text-xs", getCanchaColor(cancha.tipo))}>
            {labelTipoEscenario(cancha.tipo)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{cancha.ubicacion}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Capacidad: {cancha.capacidad} personas</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={cn(
            "h-3 w-3 fill-current",
            cancha.estado === "disponible" ? "text-green-500" : "text-red-500"
          )} />
          <span className="text-sm capitalize">{cancha.estado}</span>
        </div>
        <Button 
          variant={selected ? "default" : "outline"} 
          className="w-full mt-2"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onSelect(cancha)
          }}
        >
          {selected ? "Seleccionada" : "Seleccionar"}
        </Button>
      </CardContent>
    </Card>
  )
}
