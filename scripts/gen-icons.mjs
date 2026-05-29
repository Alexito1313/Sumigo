/* Genera los iconos PNG de la PWA desde public/icon-src.svg (torii sobre rojo).
   Uso: node scripts/gen-icons.mjs */
import sharp from 'sharp'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const SRC = path.resolve('public/icon-src.svg')
const OUT = path.resolve('public/icons')
await mkdir(OUT, { recursive: true })
const svg = await readFile(SRC)

const jobs = [
  [192, 'pwa-192.png'],
  [512, 'pwa-512.png'],
  [512, 'maskable-512.png'],
  [180, 'apple-touch-icon.png'],
]
for (const [size, name] of jobs) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(OUT, name))
}
console.log('iconos generados:', jobs.map((j) => j[1]).join(', '))
