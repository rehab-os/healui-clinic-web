import { test, expect } from '@playwright/test'

/**
 * Example E2E Test - Homepage
 *
 * This is a basic example to verify Playwright is working.
 * You'll write actual screening flow tests later.
 */

test('homepage loads successfully', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Check if page loaded (adjust selector based on your actual homepage)
  await expect(page).toHaveTitle(/HealUI/)
})

// Example: Test login flow (adjust based on your actual login)
test.skip('user can navigate to login page', async ({ page }) => {
  await page.goto('/')

  // Click login button/link (adjust selector)
  await page.click('text=Login')

  // Verify we're on login page
  await expect(page).toHaveURL(/.*login/)
})
