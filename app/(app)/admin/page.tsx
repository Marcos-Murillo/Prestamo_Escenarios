"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Inbox, Users, MapPin, BarChart3, ArrowRight } from "lucide-react"

const ACCESOS = [
  { href: "/admin/peticiones",   label: "Peticiones",   desc: "Aprobar o rechazar solicitudes de reserva", icon: Inbox,    color: "text-warning" },
  { href: "/admin/usuarios",     label: "Usuarios",     desc: "Ver todos los usuarios registrados",        icon: Users,    color: "text-secondary" },
  { href: "/admin/escenarios",   label: "Escenarios",   desc: "Gestionar canchas y espacios deportivos",   icon: MapPin,   color: "text-primary" },
  { href: "/admin/estadisticas", label: "Estadísticas", desc: "Resumen de préstamos y reservas",           icon: BarChart3, color: "text-success" },
]

export default function AdminPage() {
  const router = useRouter()
  const { usuario, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!usuario) { router.replace("/login"); return }
      if (usuario.rol === "estudiante") { router.replace("/reservas"); return }
    }
  }, [loading, usuario, router])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  if (!usuario || usuario.rol === "estudiante") return null

  return (
    <div className="min-h-screen bg-background pl-20">
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
          <p className="mt-1 text-muted-foreground">
            Bienvenido, {usuario.nombre} {usuario.apellido}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ACCESOS.map(({ href, label, desc, icon: Icon, color }) => (
            <Card key={href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{desc}</p>
                <Button asChild size="sm" variant="ghost">
                  <Link href={href}><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
