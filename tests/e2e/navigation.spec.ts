import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('dashboard is the default active view', async ({ page }) => {
    await expect(page.locator('.sb-nav.active')).toContainText('Dashboard')
  })

  test('navigates to Billing / POS', async ({ page }) => {
    await page.getByText('Billing / POS').click()
    await expect(page.locator('.sb-nav.active')).toContainText('Billing / POS')
  })

  test('navigates to Sales bills', async ({ page }) => {
    await page.getByText('Sales bills').click()
    await expect(page.locator('.sb-nav.active')).toContainText('Sales bills')
  })

  test('navigates to Inventory', async ({ page }) => {
    await page.getByText('Inventory').click()
    await expect(page.locator('.sb-nav.active')).toContainText('Inventory')
  })

  test('navigates to Purchases', async ({ page }) => {
    await page.getByText('Purchases').click()
    await expect(page.locator('.sb-nav.active')).toContainText('Purchases')
  })

  test('sidebar shows logged-in user name', async ({ page }) => {
    await expect(page.locator('.sb-user .n')).not.toBeEmpty()
  })
})
