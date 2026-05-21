/**
 * Script para obtener el refresh token de Google OAuth2.
 * Ejecutar UNA SOLA VEZ (con credenciales en .env.local):
 *   node --env-file=.env.local scripts/get-refresh-token.mjs
 *
 * Variables requeridas:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 */

import { google } from "googleapis"
import * as readline from "readline"

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "http://localhost"

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Faltan GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en el entorno (.env.local).",
  )
  process.exit(1)
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"],
  prompt: "consent",
})

console.log("\n1. Abre esta URL en tu navegador:")
console.log("\n" + authUrl + "\n")
console.log("2. Autoriza con tu cuenta de Google (la que tiene la carpeta de Drive)")
console.log("3. Después de autorizar, el navegador intentará abrir localhost y fallará — eso es normal")
console.log("4. Copia el parámetro 'code' de la URL de la barra del navegador")
console.log("   Ejemplo: http://localhost/?code=4/0AX4XfWi...  ← copia solo el valor del code\n")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question("Pega el código aquí: ", async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2.getToken(code.trim())
    console.log("\n✅ Agrega estas líneas a tu .env.local:\n")
    console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`)
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`)
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log("\n⚠️  Guarda el refresh_token — solo aparece una vez.")
  } catch (err) {
    console.error("\n❌ Error:", err.message)
    console.error("Asegúrate de copiar el código completo de la URL")
  }
})
