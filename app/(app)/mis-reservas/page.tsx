"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, getSolicitanteId } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { obtenerReservasSolicitante, formatHora } from "@/lib/reservas-service"
import { generarComprobantePDF } from "@/lib/pdf-genrator"
import { Reserva } from "@/lib/types"
import { SEDE_LABELS, resolveSede } from "@/lib/sede"
import { toast } from "sonner"
import { Calendar, Download, Eye, Plus, CheckCircle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const estadoConfig: Record<Reserva["estado"], { label: string; color: string; icon: typeof CheckCircle }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  aprobada: { label: "Aprobada", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  rechazada: { label: "Rechazada", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  cancelada: { label: "Cancelada", color: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: XCircle },
  completada: { label: "Completada", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle },
}

export default function MisReservasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading, isSolicitante } = useAuth()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !usuario) router.push("/login")
    if (!authLoading && usuario && !isSolicitante) router.push("/admin")
  }, [authLoading, usuario, isSolicitante, router])

  useEffect(() => {
    async function cargarReservas() {
      if (!usuario || !isSolicitante) return
      try {
        const data = await obtenerReservasSolicitante(getSolicitanteId(usuario))
        setReservas(data)
      } catch {
        toast.error("Error al cargar los préstamos")
      } finally {
        setLoading(false)
      }
    }
    cargarReservas()
  }, [usuario, isSolicitante])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 md:mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mis Préstamos</h1>
              <p className="mt-1 text-muted-foreground text-sm md:text-base">
                Historial de préstamos en Meléndez y San Fernando
              </p>
            </div>
            <Button asChild className="w-full md:w-auto">
              <Link href="/reservas">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo préstamo
              </Link>
            </Button>
          </div>

          {reservas.length === 0 ? (
            <Card className="mx-auto max-w-md text-center">
              <CardContent className="py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No tienes préstamos</h2>
                <Button className="mt-6" asChild>
                  <Link href="/reservas">Solicitar un escenario</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historial</CardTitle>
                <CardDescription>
                  {reservas.length} préstamo{reservas.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sede</TableHead>
                      <TableHead>Escenario</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.map((reserva) => {
                      const estado = estadoConfig[reserva.estado]
                      const EstadoIcon = estado.icon
                      const sedeLabel = SEDE_LABELS[resolveSede(reserva.sede)] ?? reserva.sede
                      return (
                        <TableRow key={reserva.id}>
                          <TableCell className="text-sm">{sedeLabel}</TableCell>
                          <TableCell className="font-medium">{reserva.canchaNombre}</TableCell>
                          <TableCell>
                            {new Date(reserva.fecha).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            {formatHora(reserva.horaInicio)} – {formatHora(reserva.horaFin)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", estado.color)}>
                              <EstadoIcon className="h-3 w-3" />
                              {estado.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/reserva/${reserva.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => generarComprobantePDF(reserva)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
