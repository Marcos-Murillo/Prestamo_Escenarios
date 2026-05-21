import type { TipoEscenario } from "./tipos-escenario"

export interface Usuario {
  uid: string
  email: string
  nombre: string
  apellido: string
  codigoEstudiante?: string
  carnet?: string
  carrera: string
  telefono?: string
  rol: "estudiante" | "admin" | "superadmin"
  createdAt: Date
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
  cantidad: number          // cuántas unidades físicas hay de este espacio
}

// Representa una unidad física individual de un escenario (ej: "Cancha de Fútbol #3")
export interface UnidadEscenario {
  id: string
  escenarioId: string
  numero: number            // 1, 2, 3...
  estado: "disponible" | "mantenimiento"
}

export interface Reserva {
  id: string
  usuarioId: string
  usuarioNombre: string
  usuarioEmail: string
  codigoEstudiante?: string
  usuarioCarnet?: string
  canchaId: string
  canchaNombre: string
  unidadAsignada?: number   // número de unidad asignada por el admin al aprobar
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
}

export interface HorarioDisponible {
  hora: string
  disponible: boolean
  reservaId?: string
}

export interface ParticipanteReserva {
  uid: string
  nombre: string
  apellido: string
  email: string
  carnet?: string
  carrera?: string
  rol: string
}

