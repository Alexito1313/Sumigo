/* Genera las imágenes fuente para @capacitor/assets (icono + adaptativo + splash)
   desde el torii de marca, y se procesan con `npx capacitor-assets generate --android`.
   Uso: node scripts/gen-cap-assets.mjs */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const RED = '#C8102E'
const NAVY = '#0E1E33'
const torii = (fill) =>
  `<rect x="92" y="150" width="328" height="32" rx="8" fill="${fill}"/>` +
  `<rect x="158" y="214" width="196" height="24" rx="4" fill="${fill}"/>` +
  `<rect x="176" y="158" width="34" height="224" fill="${fill}"/>` +
  `<rect x="302" y="158" width="34" height="224" fill="${fill}"/>`

const iconOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${RED}"/>${torii('#fff')}</svg>`
// Foreground del icono adaptativo: torii dentro de la zona segura (~66%), fondo transparente.
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(256,256) scale(0.62) translate(-256,-266)">${torii('#fff')}</g></svg>`
const background = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${RED}"/></svg>`
const splash = (bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${bg}"/><g transform="translate(512,512) translate(-256,-266)">${torii('#fff')}</g></svg>`

await mkdir('assets', { recursive: true })
const jobs = [
  [iconOnly, 1024, 'assets/icon-only.png'],
  [foreground, 1024, 'assets/icon-foreground.png'],
  [background, 1024, 'assets/icon-background.png'],
  [splash(RED), 2732, 'assets/splash.png'],
  [splash(NAVY), 2732, 'assets/splash-dark.png'],
]
for (const [svg, size, out] of jobs) {
  await sharp(Buffer.from(svg), { density: 512 }).resize(size, size).png().toFile(out)
}
console.log('Fuentes de assets de Capacitor generadas en assets/')
