import { readFile, readdir } from 'node:fs/promises'

const base = '/adaptive-strength-hypertrophy-app-pages/'
const failures = []

async function required(path) {
  try {
    return await readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8')
  } catch {
    failures.push(`dist/${path} is missing.`)
    return ''
  }
}

const html = await required('index.html')
const manifestSource = await required('manifest.webmanifest')
const serviceWorker = await required('sw.js')
const assetNames = await readdir(new URL('../dist/assets/', import.meta.url))
const javascript = (await Promise.all(
  assetNames.filter((name) => name.endsWith('.js')).map((name) => required(`assets/${name}`))
)).join('\n')

for (const marker of [`href="${base}forgepath-mark.svg"`, `href="${base}manifest.webmanifest"`, `src="${base}assets/`]) {
  if (!html.includes(marker)) failures.push(`dist/index.html is missing the Pages-safe marker ${marker}.`)
}

const absoluteReferences = [...html.matchAll(/\b(?:href|src)="(\/[^"#]*)"/g)].map((match) => match[1])
for (const reference of absoluteReferences) {
  if (!reference.startsWith(base)) failures.push(`dist/index.html contains root-only reference ${reference}.`)
}

if (manifestSource) {
  const manifest = JSON.parse(manifestSource)
  if (manifest.start_url !== base) failures.push(`Manifest start_url must be ${base}.`)
  if (manifest.scope !== base) failures.push(`Manifest scope must be ${base}.`)
}

if (!serviceWorker.includes('index.html')) failures.push('The service worker is missing its navigation fallback.')
if (!javascript.includes('Build my starting profile')) failures.push('The public artifact is missing the clean new-athlete onboarding path.')
if (!javascript.includes('Email me a sign-in link') || !javascript.includes('shouldCreateUser')) failures.push('The public artifact is missing the invitation-only email-link login path.')
if (/I have a password|Forgot password\?|Set a password|Change password/.test(javascript)) failures.push('The public artifact still exposes a password authentication path.')
const expectedSourceVersion = process.env.VITE_FORGEPATH_SOURCE_VERSION?.trim()
if (expectedSourceVersion && !javascript.includes(expectedSourceVersion)) failures.push('The public artifact does not contain its exact source version.')
if (javascript.includes('Demo Athlete') || javascript.includes('Local demo data restored.')) failures.push('The public artifact still contains demo-athlete runtime state.')
if (/\bname\s*:\s*["']JB["']/.test(javascript)) failures.push('The public artifact contains the JB-named personal seed.')

if (failures.length) {
  console.error(`GitHub Pages build QC failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`GitHub Pages build QC passed for ${base}.`)
}
