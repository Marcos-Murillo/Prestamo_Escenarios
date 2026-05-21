import { Cancha } from "./types"
import { TIPOS_ESCENARIO } from "./tipos-escenario"

export const canchasData: Cancha[] = [
  {
    id: "futbol-1",
    nombre: "Cancha de Fútbol",
    tipo: "futbol",
    capacidad: 22,
    ubicacion: "Zona Deportiva Norte",
    estado: "disponible",
    cantidad: 2,
    horariosDisponibles: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  },
  {
    id: "baloncesto-1",
    nombre: "Cancha de Baloncesto",
    tipo: "baloncesto",
    capacidad: 10,
    ubicacion: "Polideportivo Central",
    estado: "disponible",
    cantidad: 1,
    horariosDisponibles: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
  },
  {
    id: "voleibol-1",
    nombre: "Cancha de Voleibol",
    tipo: "voleibol",
    capacidad: 12,
    ubicacion: "Polideportivo Central",
    estado: "disponible",
    cantidad: 1,
    horariosDisponibles: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  },
  {
    id: "tenis-1",
    nombre: "Cancha de Tenis",
    tipo: "tenis",
    capacidad: 4,
    ubicacion: "Zona Deportiva Este",
    estado: "disponible",
    cantidad: 2,
    horariosDisponibles: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  },
  {
    id: "futbol-sala-1",
    nombre: "Cancha de Fútbol Sala",
    tipo: "futbol_sala",
    capacidad: 14,
    ubicacion: "Gimnasio Principal",
    estado: "disponible",
    cantidad: 1,
    horariosDisponibles: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
  },
]

export const tiposCancha = [
  { value: "all", label: "Todas las canchas" },
  ...TIPOS_ESCENARIO,
]

export function getCanchaIcon(tipo: Cancha["tipo"] | string) {
  switch (tipo) {
    case "futbol":
    case "futbol_sala":
      return "goal"
    case "baloncesto":
    case "basquet":
      return "basketball"
    case "voleibol":
    case "voley":
      return "volleyball"
    case "tenis":
      return "racket"
    default:
      return "activity"
  }
}

export function getCanchaColor(tipo: Cancha["tipo"] | string) {
  switch (tipo) {
    case "futbol":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    case "futbol_sala":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "baloncesto":
    case "basquet":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "voleibol":
    case "voley":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "tenis":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    default:
      return "bg-primary/10 text-primary border-primary/20"
  }
}

export function getCanchaStripeColor(tipo: string): string {
  switch (tipo) {
    case "futbol":
    case "futbol_sala":
      return "bg-secondary"
    case "baloncesto":
    case "basquet":
      return "bg-accent"
    case "tenis":
      return "bg-warning"
    case "voleibol":
    case "voley":
      return "bg-blue-500"
    default:
      return "bg-primary"
  }
}
