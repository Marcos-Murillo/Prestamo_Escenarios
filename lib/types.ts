import type { TipoEscenario } from "./tipos-escenario"
import type { Sede, SedeFiltro } from "./sede"

export type UserRol = "solicitante" | "admin" | "superadmin"

/** Sesión del usuario (solicitante gym o admin SSO). */
export interface SessionUser {
  uid: string
  rol: UserRol
  /** Sede asignada al admin (desde cdr-landing SSO). */
  sede?: Sede
  /** Sede que el superadmin elige para operar. */
  adminSedeActiva?: SedeFiltro

  // Solicitante — perfil gym_cdu
  gymUserId?: string
  nombres?: string
  correo?: string
  numeroDocumento?: string
  codigoEstudiantil?: string
  estamento?: string
  facultad?: string
  programaAcademico?: string
  telefono?: string

  // Admin SSO
  nombre?: string
  cedula?: string
}

export interface Cancha {
  id: string
  nombre: string
  tipo: TipoEscenario
  capacidad: number
  ubicacion: string
  imagen?: string
  estado: "disponible" | "mantenimiento" | "reservada"
  horariosDisponibles: string[]
  cantidad: number
  sede: Sede
}

export interface UnidadEscenario {
  id: string
  escenarioId: string
  numero: number
  estado: "disponible" | "mantenimiento"
}

export interface ParticipanteReserva {
  gymUserId: string
  nombres: string
  correo: string
  numeroDocumento: string
  codigoEstudiantil?: string
  estamento?: string
  programaAcademico?: string
}

export interface Reserva {
  id: string
  sede: Sede
  /** @deprecated usar solicitanteGymUserId */
  usuarioId?: string
  solicitanteGymUserId: string
  solicitanteNumeroDocumento: string
  usuarioNombre: string
  usuarioEmail: string
  codigoEstudiantil?: string
  canchaId: string
  canchaNombre: string
  unidadAsignada?: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: "pendiente" | "aprobada" | "rechazada" | "cancelada" | "completada"
  motivoRechazo?: string
  createdAt: Date
  updatedAt: Date
  comprobantePDF?: string
  cartaFirmada?: string
  participantes?: ParticipanteReserva[]
  totalParticipantes?: number
  solicitante?: string
  oficio?: string
}

export interface HorarioDisponible {
  hora: string
  disponible: boolean
  reservaId?: string
}

/** @deprecated Usar SessionUser */
export type Usuario = SessionUser
