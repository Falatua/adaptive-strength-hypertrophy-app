#!/usr/bin/env node
// Copies a local sprite pack into public/sprite-pack/ so the avatar uses your own art.
// The destination is gitignored on purpose: this repository and its site are public, and a personal
// sprite pack is for the machine it was installed on, not for redistribution.
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises'
import { resolve, basename } from 'node:path'

const [, , ...args] = process.argv
if (args.length < 4) {
  console.error('Usage: node scripts/install-sprite-pack.mjs <stage1.png> <stage2.png> <stage3.png> <stage4.png> [packName]')
  process.exit(1)
}

const [one, two, three, four, packName = 'Local pack'] = args
const destination = resolve('public/sprite-pack')
await mkdir(destination, { recursive: true })

const stages = ['apprentice', 'forged', 'champion', 'apex']
const sources = [one, two, three, four]
const files = []
const installed = []

for (const [index, source] of sources.entries()) {
  const from = resolve(source)
  try {
    await access(from)
  } catch {
    console.error(`Missing source file: ${from}`)
    process.exit(1)
  }
  const file = `${stages[index]}.png`
  await copyFile(from, resolve(destination, file))
  files.push({ stage: stages[index], file })
  installed.push(`${stages[index]} <- ${basename(from)}`)
}

await writeFile(resolve(destination, 'manifest.json'), `${JSON.stringify({ name: packName, installedAt: new Date().toISOString(), stages: files }, null, 2)}\n`)
console.log(`Installed "${packName}" into public/sprite-pack/`)
for (const line of installed) console.log(`  ${line}`)
console.log('\nThis folder is gitignored. It stays on this machine and is never published.')
