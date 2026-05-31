"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, getSolicitanteDisplayName } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Home, User, LogOut, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { usuario, signOut, loading } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/reservas", label: "Reservar Cancha", icon: Calendar },
  ]

  if (usuario?.rol === "admin" || usuario?.rol === "superadmin") {
    navLinks.push({ href: "/admin", label: "Administracion", icon: Shield })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">ReservasCanchas</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : usuario ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {(getSolicitanteDisplayName(usuario) || "U").charAt(0)}
                  </div>
                  <span className="hidden md:inline">{getSolicitanteDisplayName(usuario)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{getSolicitanteDisplayName(usuario)}</p>
                  <p className="text-xs text-muted-foreground">{usuario.correo ?? usuario.cedula}</p>
                  {(usuario.numeroDocumento || usuario.codigoEstudiantil) && (
                    <p className="text-xs text-muted-foreground">
                      {[usuario.numeroDocumento, usuario.codigoEstudiantil].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-reservas" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mis Reservas
                  </Link>
                </DropdownMenuItem>
                {usuario.rol === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Panel de Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Identificarse</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
