import { expect, test } from '@playwright/test'

async function enterRecommendedProfile(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: 'Use the recommended profile and start now' }).click()
  await expect(page.getByRole('heading', { name: 'Your next useful win.' })).toBeVisible()
}

test('validates an athlete-controlled PR without changing the prescription', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'Start without check-in' }).click()
  await expect(page.getByRole('heading', { name: 'Bench Strength + Upper Body' })).toBeVisible()
  await expect(page.getByText('Productive hold:', { exact: false }).first()).toBeVisible()

  const firstLoad = page.getByLabel('Set 1 load').first()
  await firstLoad.fill('185')
  await expect(page.getByText('Productive hold:', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Log set' }).first().click()
  await expect(page.getByText('Provisional until the workout is finished and saved.').first()).toBeVisible()

  await page.getByRole('button', { name: 'Finish workout' }).click()
  await page.getByRole('button', { name: 'Finish without survey' }).click()
  await expect(page.getByRole('heading', { name: 'PRs and micro wins' })).toBeVisible()
  await expect(page.getByText('Strength PR').first()).toBeVisible()
  await expect(page.getByText('185 heaviest completed load', { exact: false }).first()).toBeVisible()
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/progress-achievements-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})

test('keeps achievement controls optional and mobile layouts contained', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await enterRecommendedProfile(page)
  await page.getByRole('button', { name: 'You' }).click()
  await expect(page.getByRole('heading', { name: 'Achievement controls' })).toBeVisible()
  const quietMode = page.getByRole('checkbox', { name: 'Quiet mode' })
  await quietMode.check()
  await page.reload()
  await page.getByRole('button', { name: 'You' }).click()
  await expect(page.getByRole('checkbox', { name: 'Quiet mode' })).toBeChecked()

  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  if (testInfo.project.name === 'mobile-chromium') await page.screenshot({ path: 'output/playwright/gamification-mobile.png', fullPage: true })
  expect(browserErrors).toEqual([])
})
