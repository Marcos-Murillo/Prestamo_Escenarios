"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { obtenerReservasUsuario, formatHora } from "@/lib/reservas-service"
import { generarComprobantePDF } from "@/lib/pdf-genrator"
import { Reserva } from "@/lib/types"
import { toast } from "sonner"
import { 
  Calendar, 
  Download, 
  Eye, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

const estadoConfig: Record<Reserva["estado"], { 
  label: string
  color: string
  icon: typeof CheckCircle 
}> = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: Clock
  },
  aprobada: {
    label: "Aprobada",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle
  },
  rechazada: {
    label: "Rechazada",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: XCircle
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: XCircle
  },
  completada: {
    label: "Completada",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: CheckCircle
  }
}

export default function MisReservasPage() {
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !usuario) {
      router.push("/login")
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    async function cargarReservas() {
      if (usuario) {
        try {
          const data = await obtenerReservasUsuario(usuario.uid)
          setReservas(data)
        } catch (error) {
          console.error("Error cargando reservas:", error)
          toast.error("Error al cargar las reservas")
        } finally {
          setLoading(false)
        }
      }
    }
    if (usuario) {
      cargarReservas()
    }
  }, [usuario])

  const handleDescargarPDF = (reserva: Reserva) => {
    generarComprobantePDF(reserva)
    toast.success("Comprobante descargado!")
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-3xl">
        <div className="mb-6 md:mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mis Reservas</h1>
            <p className="mt-1 text-muted-foreground text-sm md:text-base">
              Historial de todas tus reservas de canchas
            </p>
          </div>
          <Button asChild className="w-full md:w-auto">
            <Link href="/reservas">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Link>
          </Button>
        </div>

        {reservas.length === 0 ? (
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No tienes reservas</h2>
              <p className="mt-2 text-muted-foreground">
                Aun no has realizado ninguna reserva de cancha.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/reservas">Hacer mi primera reserva</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile: cards apiladas */}
            <div className="md:hidden space-y-3">
              {reservas.map((reserva) => {
                const estado = estadoConfig[reserva.estado]
                const EstadoIcon = estado.icon
                const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
                  day: "numeric", month: "short", year: "numeric",
                })
                return (
                  <Card key={reserva.id}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-tight">{reserva.canchaNombre}</p>
                        <Badge variant="outline" className={cn("gap-1 shrink-0 text-xs", estado.color)}>
                          <EstadoIcon className="h-3 w-3" />
                          {estado.label}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{fechaFormateada}</span>
                        <span>{formatHora(reserva.horaInicio)} – {formatHora(reserva.horaFin)}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/reserva/${reserva.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDescargarPDF(reserva)}>
                          <Download className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Desktop: tabla */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Historial de Reservas</CardTitle>
                <CardDescription>
                  {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} en total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cancha</TableHead>
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
                        const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })
                        return (
                          <TableRow key={reserva.id}>
                            <TableCell className="font-medium">{reserva.canchaNombre}</TableCell>
                            <TableCell>{fechaFormateada}</TableCell>
                            <TableCell>{formatHora(reserva.horaInicio)} - {formatHora(reserva.horaFin)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", estado.color)}>
                                <EstadoIcon className="h-3 w-3" />
                                {estado.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/reserva/${reserva.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDescargarPDF(reserva)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </main>
    </div>
  )
}
