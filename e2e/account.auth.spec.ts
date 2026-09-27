import { expect, test } from '@playwright/test'

test('signed-in user sees profile, likes and the admin area', async ({ page }) => {
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(page.getByText('e2e@partymap.local')).toBeVisible()

  await page.getByRole('link', { name: 'Admin page' }).click()
  await expect(page).toHaveURL(/\/admin\/places$/)
  await expect(page.getByRole('heading', { name: 'Places admin' })).toBeVisible()

  await page.getByRole('link', { name: 'Likes' }).first().click()
  await expect(page.getByRole('heading', { name: 'Your likes' })).toBeVisible()
})
