import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers'

test.describe('Purchases', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
    await page.getByText('Purchases').click()
    await expect(page.locator('.sb-nav.active')).toContainText('Purchases')
    await page.waitForLoadState('networkidle')
  })

  // ── Page structure ────────────────────────────────────────────────────────────

  test('purchases page loads without error', async ({ page }) => {
    await expect(page.getByText('Purchases').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('KPI cards are all visible', async ({ page }) => {
    await expect(page.getByText('Purchase value')).toBeVisible()
    await expect(page.getByText('Awaiting payment')).toBeVisible()
    await expect(page.getByText('Paid')).toBeVisible()
    await expect(page.getByText('Suppliers')).toBeVisible()
  })

  test('tab bar shows Purchase bills and Suppliers tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /purchase bills/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /suppliers/i })).toBeVisible()
  })

  // ── Purchase bills list ───────────────────────────────────────────────────────

  test('purchase list renders rows', async ({ page }) => {
    const rows = page.locator('table:visible tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 8000 })
  })

  test('search field is present and accepts input', async ({ page }) => {
    const search = page.getByPlaceholder('Search purchase no…')
    await expect(search).toBeVisible()
    await search.fill('PO')
    await search.clear()
  })

  test('supplier filter dropdown is present', async ({ page }) => {
    await expect(page.getByText('All suppliers')).toBeVisible()
  })

  test('status filter chips are all rendered', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^all/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^draft/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /pending grn/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^billed/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^paid/i })).toBeVisible()
  })

  test('clicking a status chip filters the list', async ({ page }) => {
    await page.getByRole('button', { name: /^draft/i }).click()
    // chip becomes active
    await expect(page.getByRole('button', { name: /^draft/i })).toHaveClass(/\bon\b/)
    // table reloads without error
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    // reset
    await page.getByRole('button', { name: /^all/i }).click()
  })

  // ── Row click → detail drawer ─────────────────────────────────────────────────

  test('clicking a purchase row opens the detail drawer', async ({ page }) => {
    const firstRow = page.locator('table:visible tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 8000 })
    await firstRow.click()
    // drawer shows purchase number and supplier info
    await expect(page.locator('.drawer-overlay')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Grand total')).toBeVisible()
    await expect(page.getByText('Line items')).toBeVisible()
  })

  test('detail drawer closes with the close button', async ({ page }) => {
    const firstRow = page.locator('table:visible tbody tr').first()
    await firstRow.click()
    await expect(page.locator('.drawer-overlay')).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.drawer-overlay')).not.toBeVisible()
  })

  test('detail drawer closes when pressing Escape', async ({ page }) => {
    const firstRow = page.locator('table:visible tbody tr').first()
    await firstRow.click()
    await expect(page.locator('.drawer-overlay')).toBeVisible({ timeout: 8000 })
    await page.keyboard.press('Escape')
    await expect(page.locator('.drawer-overlay')).not.toBeVisible()
  })

  // ── Record purchase button ────────────────────────────────────────────────────

  test('Record purchase button is visible and opens the form modal', async ({ page }) => {
    const btn = page.getByRole('button', { name: /record purchase/i })
    await expect(btn).toBeVisible()
    await btn.click()
    await expect(page.locator('.overlay')).toBeVisible({ timeout: 6000 })
    await page.keyboard.press('Escape')
  })

  // ── Suppliers tab ─────────────────────────────────────────────────────────────

  test('switching to Suppliers tab shows supplier list', async ({ page }) => {
    await page.getByRole('button', { name: /suppliers/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.sb-nav.active')).toContainText('Purchases')
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('Add supplier button appears on Suppliers tab', async ({ page }) => {
    await page.getByRole('button', { name: /suppliers/i }).click()
    await expect(page.getByRole('button', { name: /add supplier/i })).toBeVisible()
  })
})
