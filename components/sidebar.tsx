"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  Calendar, ClipboardList, User,
  Shield, MapPin, BarChart3,
  LogOut, Trophy, Inbox, CalendarDays
} from "lucide-react"

type Rol = "solicitante" | "admin" | "superadmin"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: Rol[]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/mis-reservas",         label: "Mis Préstamos",  icon: ClipboardList, roles: ["solicitante"] },
  { href: "/reservas",             label: "Pedir Préstamo", icon: Calendar,      roles: ["solicitante"] },
  { href: "/perfil",               label: "Perfil",         icon: User,          roles: ["solicitante"] },
  { href: "/admin/peticiones",     label: "Peticiones",     icon: Inbox,         roles: ["admin", "superadmin"] },
  { href: "/reservas",             label: "Crear Reserva",  icon: Calendar,      roles: ["admin", "superadmin"] },
  { href: "/admin",                label: "Panel Admin",    icon: Shield,        roles: ["admin", "superadmin"] },
  { href: "/admin/calendario",     label: "Calendario",     icon: CalendarDays,  roles: ["admin", "superadmin"] },
  { href: "/admin/escenarios",     label: "Escenarios",     icon: MapPin,        roles: ["admin", "superadmin"] },
  { href: "/admin/estadisticas",   label: "Estadísticas",   icon: BarChart3,     roles: ["admin", "superadmin"] },
]

const PUBLIC_PATHS = ["/", "/login", "/registro", "/auth/sso"]

interface DockItemProps {
  title: string
  icon: React.ReactNode
  href: string
  active: boolean
  onClick?: () => void
}

function DockItem({ title, icon, href, active, onClick }: DockItemProps) {
  const [hovered, setHovered] = useState(false)

  const inner = (
    <div className={cn(
      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
      active
        ? "bg-primary text-primary-foreground ring-2 ring-accent"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}>
      <div className="h-5 w-5">{icon}</div>
    </div>
  )

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-lg pointer-events-none"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      {onClick ? (
        <button onClick={onClick} className="flex items-center" aria-label={title}>{inner}</button>
      ) : (
        <Link href={href} className="flex items-center" aria-label={title}>{inner}</Link>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { usuario, loading } = useAuth()

  if (PUBLIC_PATHS.includes(pathname)) return null

  if (loading) {
    return (
      <>
        <div className="hidden md:block fixed left-4 top-1/2 z-50 -translate-y-1/2">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl opacity-40">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-4 py-2">
          <div className="flex justify-around">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!usuario) return null

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(usuario.rol))
  const mobileItems = visibleItems.slice(0, 5)

  return (
    <>
      <div className="hidden md:block fixed left-4 top-1/2 z-50 -translate-y-1/2">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="my-1 h-px w-6 bg-border" />
          {visibleItems.map((item) => (
            <DockItem
              key={`${item.href}-${item.label}`}
              title={item.label}
              icon={<item.icon className="w-full h-full" />}
              href={item.href}
              active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))}
            />
          ))}
          <div className="my-1 h-px w-6 bg-border" />
          <LogoutButton />
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-0",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                <span className="text-[10px] font-medium truncate max-w-[56px] text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            )
          })}
          <MobileLogoutButton />
        </div>
      </div>
    </>
  )
}

function LogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [hovered, setHovered] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="relative flex items-center" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-lg pointer-events-none"
          >
            Cerrar sesión
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={handleLogout} className="flex items-center" aria-label="Cerrar sesión">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="w-full h-full h-5 w-5" />
        </div>
      </button>
    </div>
  )
}

function MobileLogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <button
      onClick={async () => {
        await signOut()
        router.push("/login")
      }}
      className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-muted-foreground hover:text-destructive"
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span className="text-[10px] font-medium">Salir</span>
    </button>
  )
}
