"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { obtenerReserva, formatHora } from "@/lib/reservas-service"
import { generarComprobantePDF } from "@/lib/pdf-genrator"
import { Reserva } from "@/lib/types"
import { toast } from "sonner"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Hash, 
  Download, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
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
    icon: AlertCircle
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

export default function ReservaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { usuario, loading: authLoading } = useAuth()
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !usuario) {
      router.push("/login")
    }
  }, [authLoading, usuario, router])

  useEffect(() => {
    async function cargarReserva() {
      try {
        const data = await obtenerReserva(id)
        setReserva(data)
      } catch (error) {
        console.error("Error cargando reserva:", error)
        toast.error("Error al cargar la reserva")
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      cargarReserva()
    }
  }, [id])

  const handleDescargarPDF = () => {
    if (reserva) {
      generarComprobantePDF(reserva)
      toast.success("Comprobante descargado!")
    }
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

  if (!reserva) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-8 md:px-6">
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Reserva no encontrada</h2>
              <p className="mt-2 text-muted-foreground">
                La reserva que buscas no existe o ha sido eliminada.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/reservas">Hacer nueva reserva</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const estado = estadoConfig[reserva.estado]
  const EstadoIcon = estado.icon
  const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/mis-reservas" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis reservas
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Detalle de Reserva</CardTitle>
                  <CardDescription className="mt-1">
                    ID: {reserva.id}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={cn("gap-1", estado.color)}>
                  <EstadoIcon className="h-3 w-3" />
                  {estado.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Informacion de la cancha */}
              <div>
                <h3 className="mb-3 font-semibold text-foreground">Cancha Reservada</h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-lg font-medium">{reserva.canchaNombre}</p>
                </div>
              </div>

              {/* Fecha y hora */}
              <div>
                <h3 className="mb-3 font-semibold text-foreground">Fecha y Horario</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium capitalize">{fechaFormateada}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horario</p>
                      <p className="font-medium">
                        {formatHora(reserva.horaInicio)} - {formatHora(reserva.horaFin)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informacion del estudiante */}
              <div>
                <h3 className="mb-3 font-semibold text-foreground">Datos del Estudiante</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{reserva.usuarioNombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                    <Hash className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Codigo de Estudiante</p>
                      <p className="font-medium">{reserva.codigoEstudiantil ?? reserva.solicitanteNumeroDocumento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{reserva.usuarioEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivo de rechazo si aplica */}
              {reserva.estado === "rechazada" && reserva.motivoRechazo && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="mb-2 font-semibold text-red-800">Motivo de Rechazo</h3>
                  <p className="text-red-700">{reserva.motivoRechazo}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col gap-3 pt-4 md:flex-row">
                <Button onClick={handleDescargarPDF} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Comprobante PDF
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/reservas">Nueva Reserva</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
