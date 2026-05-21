export const TIPOS_ESCENARIO = [
  { value: "futbol", label: "Fútbol" },
  { value: "baloncesto", label: "Baloncesto" },
  { value: "tenis", label: "Tenis" },
  { value: "voleibol", label: "Voleibol" },
  { value: "futbol_sala", label: "Fútbol sala" },
] as const

export type TipoEscenario = (typeof TIPOS_ESCENARIO)[number]["value"]

export const TIPOS_ESCENARIO_VALUES = TIPOS_ESCENARIO.map((t) => t.value)

export function labelTipoEscenario(tipo: string): string {
  const found = TIPOS_ESCENARIO.find((t) => t.value === tipo)
  if (found) return found.label
  const legacy: Record<string, string> = {
    basquet: "Baloncesto",
    voley: "Voleibol",
    multiuso: "Multiuso",
  }
  return legacy[tipo] ?? tipo
}
