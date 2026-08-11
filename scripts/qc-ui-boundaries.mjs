import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

const root = new URL('../', import.meta.url)
const scanRoots = ['src', 'public']
const allowedExtensions = new Set(['.css', '.html', '.js', '.jsx', '.svg', '.ts', '.tsx'])
const failures = []

async function collect(path) {
  const entries = await readdir(new URL(path, root), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) files.push(...await collect(child))
    else if (allowedExtensions.has(extname(entry.name))) files.push(child)
  }
  return files
}

const files = ['index.html', ...(await Promise.all(scanRoots.map(collect))).flat()]
const rules = [
  {
    name: 'copied game reference',
    pattern: /\b(pok[eé]mon|machop|machoke|machamp|firered|leafgreen)\b/i,
    help: 'Use original characters, language, and assets in the shipped product.'
  },
  {
    name: 'technique-video product surface',
    pattern: /\b(technique video|form video|exercise demo|watch (?:the )?demo)\b|<video\b/i,
    help: 'ForgePath intentionally excludes technique-video browsing and playback.'
  },
  {
    name: 'gradient text',
    pattern: /(?:-webkit-)?background-clip\s*:\s*text/i,
    help: 'Keep product typography solid and readable.'
  },
  {
    name: 'decorative side stripe',
    pattern: /border-(?:left|right)\s*:\s*(?:[2-9]|\d{2,})px\b/i,
    help: 'Use a full subtle boundary instead of a thick colored side stripe.'
  }
]

for (const file of files) {
  const source = await readFile(new URL(file, root), 'utf8')
  for (const rule of rules) {
    const match = source.match(rule.pattern)
    if (!match || match.index === undefined) continue
    const line = source.slice(0, match.index).split('\n').length
    failures.push(`${file}:${line} ${rule.name}. ${rule.help}`)
  }
}

const styles = await readFile(new URL('src/styles.css', root), 'utf8')
for (const [name, pattern, help] of [
  ['keyboard focus', /:focus-visible/, 'Add a visible keyboard focus state.'],
  ['reduced motion', /prefers-reduced-motion:\s*reduce/, 'Honor the system reduced-motion preference.'],
  ['compact viewport', /@media\s*\(max-width:\s*620px\)/, 'Keep the compact mobile layout explicit.']
]) {
  if (!pattern.test(styles)) failures.push(`src/styles.css missing ${name}. ${help}`)
}

for (const required of ['PRODUCT.md', 'DESIGN.md', 'DESIGN.json']) {
  try {
    await readFile(new URL(required, root), 'utf8')
  } catch {
    failures.push(`${required} is required for context-grounded product work.`)
  }
}

if (failures.length) {
  console.error(`UI boundary QC failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`UI boundary QC passed across ${files.length} shipped interface files.`)
}
