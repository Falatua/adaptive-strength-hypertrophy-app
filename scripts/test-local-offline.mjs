import { chromium, webkit, devices } from '@playwright/test'
import assert from 'node:assert/strict'

const url = process.env.FORGEPATH_OFFLINE_URL || 'http://127.0.0.1:4173/adaptive-strength-hypertrophy-app-pages/'
const iphone = process.env.FORGEPATH_OFFLINE_ENGINE === 'webkit'
const browser = await (iphone ? webkit : chromium).launch()
try {
  const context = await browser.newContext({ ...devices[iphone ? 'iPhone 13' : 'Pixel 5'] })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  const cloudRequests = []
  const errors = []
  page.on('request', (request) => { if (request.url().includes('.supabase.co')) cloudRequests.push(request.url()) })
  page.on('pageerror', (error) => errors.push(error.message))
  console.log('Opening production app')
  await page.goto(url)
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated', undefined, { timeout: 30000 })
  console.log('Reopening app')
  await page.goto('about:blank')
  await page.goto(url)
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.getByRole('button', { name: 'Quick Start' }).click()
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')).state)
  console.log('Service worker active; disconnecting network')
  await context.setOffline(true)
  console.log('Reopening app')
  await page.goto('about:blank')
  await page.goto(url)
  await page.getByRole('heading', { name: 'Your next useful win.' }).waitFor()
  for (const name of ['Plan', 'Progress', 'Library', 'You']) {
    await page.getByRole('button', { name, exact: true }).click()
    await page.waitForTimeout(200)
  }
  await page.getByText('Your training stays on this device').waitFor()
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')).state)
  assert.deepEqual(after.athlete, before.athlete)
  assert.deepEqual(after.sessions, before.sessions)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download device backup' }).click()
  assert.match((await download).suggestedFilename(), /forgepath-device-backup/)
  await page.screenshot({ path: `output/playwright/local-offline-${iphone ? 'iphone' : 'android'}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Today', exact: true }).click()
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  const row = page.locator('.set-row').first()
  await row.locator('input[inputmode="decimal"]').fill('125')
  await row.locator('input[inputmode="numeric"]').fill('5')
  await row.locator('select').selectOption('2')
  await row.getByRole('button', { name: 'Log set' }).click()
  await page.goto('about:blank')
  await page.goto(url)
  await page.getByRole('button', { name: 'Done', exact: true }).first().waitFor()
  const saved = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')).state
    return state.sessions.find((session) => session.id === state.activeSessionId).exercises[0].sets[0]
  })
  assert.equal(saved.completed, true)
  assert.equal(saved.completedLoad, 125)
  assert.equal(saved.completedReps, 5)
  assert.deepEqual(cloudRequests, [])
  assert.deepEqual(errors, [])
  console.log('Production mobile offline PASS: cached cold reload, offline set logging and active-workout recovery, all five screens, backup download, no Supabase requests, no page errors or horizontal overflow.')
} finally { await browser.close() }
