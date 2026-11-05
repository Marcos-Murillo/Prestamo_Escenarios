export const ASISTENCIA_URL = "https://asistencia-cdr.vercel.app/"
export const ASISTENCIA_LOCAL_URL = "http://localhost:3001/"

export function isLocalHost() {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host === "localhost" || host === "127.0.0.1"
}

/** En local no salimos del puerto 3000. En el sitio publicado, el solicitante va a Asistencias. */
export function goToAsistencia() {
  if (typeof window === "undefined") return
  if (isLocalHost()) {
    if (window.location.pathname !== "/") window.location.assign("/")
    return
  }
  window.location.replace(ASISTENCIA_URL)
}
