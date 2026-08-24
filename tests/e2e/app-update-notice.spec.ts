import { expect, test } from '@playwright/test'

test('alerts the athlete when a new build is ready and offers a direct refresh', async ({ page }) => {
  await page.route('**/source-version.txt?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: `${'b'.repeat(40)}\n` })
  })

  await page.goto('/')

  const notice = page.getByRole('alert')
  await expect(notice).toContainText('Update ready')
  await expect(notice).toContainText('Refresh the page')
  await expect(notice.getByRole('button', { name: 'Refresh now' })).toBeVisible()
  await expect(notice.getByRole('button', { name: /dismiss|close/i })).toHaveCount(0)

  const box = await notice.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
})
