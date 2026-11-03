import { expect, test } from '@playwright/test'

test('local training opens without auth and survives reload with Supabase unavailable', async ({ page }) => {
  const cloudRequests: string[] = []
  page.on('request', (request) => { if (request.url().includes('.supabase.co')) cloudRequests.push(request.url()) })
  await page.route('**/*.supabase.co/**', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick Start' }).click()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await expect(page.getByText('Your training stays on this device')).toBeVisible()
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')!).state)
  expect(before.onboardingComplete).toBe(true)
  await page.reload()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  await expect(page.getByText('Your training stays on this device')).toBeVisible()
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')!).state)
  expect(after.athlete).toEqual(before.athlete)
  expect(after.sessions).toEqual(before.sessions)
  expect(cloudRequests).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('invalid interrupted cloud recovery is preserved and cannot replace local data', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('forgepath-cloud-outbox-v1', '{invalid original'))
  await page.getByText('Recover existing training', { exact: true }).click()
  await page.getByRole('button', { name: 'Preview interrupted cloud save' }).click()
  await expect(page.getByRole('button', { name: 'Use this training on this device' })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('forgepath-cloud-outbox-v1'))).toBe('{invalid original')
  await expect(page.getByRole('button', { name: 'Quick Start' })).toBeVisible()
})

test('failed saves expose emergency export rather than silently claiming success', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'forgepath-private-alpha-v1') throw new DOMException('full', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Quick Start' }).click()
  await expect(page.getByRole('heading', { name: 'Device save needs attention' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download emergency backup' }).click()
  expect((await download).suggestedFilename()).toContain('forgepath-device-backup')
})

test('a downloaded device backup can be previewed and restored on a fresh device', async ({ page, browser }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick Start' }).click()
  await page.getByRole('button', { name: 'You', exact: true }).click()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download device backup' }).click()
  const path = await (await downloaded).path()
  expect(path).toBeTruthy()
  const context = await browser.newContext()
  const fresh = await context.newPage()
  await fresh.goto('http://127.0.0.1:5173/')
  await fresh.getByText('Recover existing training', { exact: true }).click()
  await fresh.getByLabel('Recover training from backup').setInputFiles(path!)
  await expect(fresh.getByText(/Verified backup for/)).toBeVisible()
  await fresh.getByRole('button', { name: 'Use this training on this device' }).click()
  await expect(fresh.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  await fresh.reload()
  await expect(fresh.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
  expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('forgepath-private-alpha-v1')!).state.recoverySnapshot)).toBeTruthy()
  await context.close()
})
