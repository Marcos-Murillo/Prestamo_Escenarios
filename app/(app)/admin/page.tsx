"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Inbox, MapPin, BarChart3, ArrowRight, CalendarDays } from "lucide-react"
import { AdminSedeSelector, AdminSedeBadge } from "@/components/admin-sede-selector"

const ACCESOS = [
  { href: "/admin/peticiones", label: "Peticiones", desc: "Aprobar o rechazar solicitudes de préstamo", icon: Inbox, color: "text-warning" },
  { href: "/admin/escenarios", label: "Escenarios", desc: "Gestionar espacios deportivos de tu sede", icon: MapPin, color: "text-primary" },
  { href: "/admin/calendario", label: "Calendario", desc: "Vista mensual de reservas", icon: CalendarDays, color: "text-secondary" },
  { href: "/admin/estadisticas", label: "Estadísticas", desc: "Resumen de préstamos por sede", icon: BarChart3, color: "text-success" },
]

export default function AdminPage() {
  const router = useRouter()
  const { usuario, loading, isStaff } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!usuario) router.replace("/login")
      else if (!isStaff) router.replace("/mis-reservas")
    }
  }, [loading, usuario, isStaff, router])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>
  if (!usuario || !isStaff) return null

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
            <p className="mt-1 text-muted-foreground">Bienvenido, {usuario.nombre ?? "Administrador"}</p>
          </div>
          <div className="flex items-center gap-3">
            <AdminSedeBadge />
            <AdminSedeSelector />
          </div>
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
