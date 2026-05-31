export const SEDES_ACTIVAS = ["melendez", "san_fernando"] as const
export type Sede = (typeof SEDES_ACTIVAS)[number]

export const DEFAULT_SEDE: Sede = "melendez"

export const SEDE_LABELS: Record<Sede, string> = {
  melendez: "Meléndez",
  san_fernando: "San Fernando",
}

export type SedeFiltro = Sede | "todas"

const ALIASES: Record<string, Sede> = {
  melendez: "melendez",
  meléndez: "melendez",
  "san fernando": "san_fernando",
  sanfernando: "san_fernando",
}

export function resolveSede(value?: string | null): Sede {
  if (!value) return DEFAULT_SEDE
  const key = value.trim().toLowerCase().replace(/\s+/g, " ")
  if (key in ALIASES) return ALIASES[key]
  const slug = key.replace(/\s+/g, "_")
  if (slug in ALIASES) return ALIASES[slug]
  if (SEDES_ACTIVAS.includes(slug as Sede)) return slug as Sede
  return DEFAULT_SEDE
}

export function filterBySede<T extends { sede?: string }>(
  items: T[],
  sedeFiltro?: SedeFiltro,
): T[] {
  if (!sedeFiltro || sedeFiltro === "todas") return items
  const target = resolveSede(sedeFiltro)
  return items.filter((item) => resolveSede(item.sede) === target)
}
