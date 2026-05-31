import type { Sede } from "./sede"

export function requiereCartaFirmada(sede: Sede): boolean {
  return sede === "melendez"
}

export function requiereParticipantes(_sede: Sede): boolean {
  return true
}
