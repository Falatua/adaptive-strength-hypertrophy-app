import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

const root = new URL('../', import.meta.url)
const failures = []

async function collect(path) {
  const entries = await readdir(new URL(path, root), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) files.push(...await collect(child))
    else if (['.png', '.svg'].includes(extname(entry.name))) files.push(child)
  }
  return files
}

function pngMetadata(bytes, file) {
  const signature = bytes.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') {
    failures.push(`${file} is not a valid PNG.`)
    return null
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] }
}

const expected = {
  'public/icons/navigation': ['today', 'plan', 'progress', 'library', 'you'],
  'public/icons/body-regions': ['all', 'chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'trunk'],
  'public/athlete-forms': ['apprentice', 'forged', 'champion', 'apex'],
  'public/locations': ['bodyweight', 'commercial-gym', 'custom', 'home-gym', 'hotel', 'travel']
}

for (const [directory, names] of Object.entries(expected)) {
  const found = (await readdir(new URL(directory, root))).filter((file) => file.endsWith('.png')).map((file) => file.replace(/\.png$/, '')).sort()
  const wanted = [...names].sort()
  if (JSON.stringify(found) !== JSON.stringify(wanted)) failures.push(`${directory} inventory differs from the required ${wanted.length}-image set.`)
}

const files = await collect('public')
for (const file of files) {
  const bytes = await readFile(new URL(file, root))
  if (file.endsWith('.svg')) {
    const source = bytes.toString('utf8')
    if (!/<svg\b/.test(source) || !/viewBox=/.test(source)) failures.push(`${file} is missing a valid SVG root or viewBox.`)
    continue
  }
  const metadata = pngMetadata(bytes, file)
  if (!metadata) continue
  if (metadata.width < 64 || metadata.height < 64) failures.push(`${file} is too small at ${metadata.width}x${metadata.height}.`)
  if (file.includes('/body-regions/') || file.includes('/movements/')) {
    if (![4, 6].includes(metadata.colorType)) failures.push(`${file} must preserve alpha transparency.`)
  }
}

const movementFiles = files.filter((file) => file.startsWith('public/icons/movements/') && file.endsWith('.png'))
if (movementFiles.length !== 40) failures.push(`Expected 40 movement image files, found ${movementFiles.length}.`)

const sourceFiles = await collect('src')
const sources = await Promise.all(sourceFiles.filter((file) => ['.ts', '.tsx', '.css'].includes(extname(file))).map(async (file) => [file, await readFile(new URL(file, root), 'utf8')]))
for (const [file, source] of sources) {
  for (const match of source.matchAll(/(?:icons\/navigation|icons\/body-regions|icons\/movements|athlete-forms|locations)\/([a-z0-9-]+)\.png/g)) {
    const asset = `public/${match[0]}`
    if (!files.includes(asset)) failures.push(`${file} references missing image ${asset}.`)
  }
}

if (failures.length) {
  console.error(`Image asset QC failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Image asset QC passed across ${files.length} shipped images, including 40 movement scenes and 12 body-region emblems.`)
}
