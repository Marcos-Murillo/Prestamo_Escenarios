import { existsSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { Readable } from "stream"
import { google } from "googleapis"

const TOKEN_FILE = path.join(process.cwd(), "secrets.drive-oauth.json")
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

function redirectFallback() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/api/drive/oauth/callback"
}

export function getOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET en Préstamos")
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri || redirectFallback())
}

export function getStoredRefreshToken() {
  if (process.env.GOOGLE_OAUTH_REFRESH_TOKEN) return process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  try {
    if (!existsSync(TOKEN_FILE)) return ""
    const parsed = JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as { refresh_token?: string }
    return parsed.refresh_token || ""
  } catch {
    return ""
  }
}

export function saveRefreshToken(refreshToken: string) {
  writeFileSync(TOKEN_FILE, JSON.stringify({ refresh_token: refreshToken }, null, 2), "utf8")
}

export function createDriveAuthUrl(redirectUri?: string) {
  return getOAuth2Client(redirectUri).generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: DRIVE_SCOPES,
  })
}

function getAuthClient() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    throw new Error("El Drive de Préstamos no está conectado. Ábrelo en /conectar-drive de la app de escenarios.")
  }
  const oauth = getOAuth2Client()
  oauth.setCredentials({ refresh_token: refreshToken })
  return oauth
}

export type DriveAuthState = "ok" | "missing" | "invalid"

export async function probeDriveAuth(): Promise<DriveAuthState> {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) return "missing"
  if (!getStoredRefreshToken()) return "missing"
  try {
    const token = await getAuthClient().getAccessToken()
    const value = typeof token === "string" ? token : token?.token
    return value ? "ok" : "invalid"
  } catch {
    return "invalid"
  }
}

export function driveAuthMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  if (/invalid_grant|invalid_rapt|expired|revoked/i.test(message)) {
    return "El permiso del Drive de Préstamos venció o fue revocado. Entra a /conectar-drive en la app de escenarios y vuelve a autorizar."
  }
  if (/storageQuotaExceeded|Service Accounts do not have storage quota|403/i.test(message)) {
    return "Google Drive rechazó la carta por cuota. Conecta el Gmail dueño de la carpeta de Préstamos en /conectar-drive."
  }
  return message || "No se pudo guardar la carta en el Drive de Préstamos."
}

export async function uploadPublicPdf(name: string, body: Buffer) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) {
    throw new Error("Falta GOOGLE_DRIVE_FOLDER_ID en Préstamos")
  }
  const drive = google.drive({ version: "v3", auth: getAuthClient() })
  const uploaded = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      mimeType: "application/pdf",
    },
    media: {
      mimeType: "application/pdf",
      body: Readable.from(body),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  })
  const fileId = uploaded.data.id
  if (!fileId) throw new Error("Drive no devolvió el archivo")

  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    })
  } catch (error) {
    console.warn("[prestamos-drive] No se pudo publicar el enlace:", error)
  }

  const published = await drive.files.get({
    fileId,
    fields: "webViewLink",
    supportsAllDrives: true,
  })
  return {
    fileId,
    url: published.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
  }
}
