import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/HumbleHalal/i)
    // Navbar should be visible
    await expect(page.locator('nav')).toBeVisible()
  })

  test('halal food directory loads', async ({ page }) => {
    await page.goto('/halal-food')
    await expect(page.locator('h1')).toContainText(/halal/i)
  })

  test('mosque directory loads', async ({ page }) => {
    await page.goto('/mosque')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('events page loads', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('classifieds page loads', async ({ page }) => {
    await page.goto('/classifieds')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('community page loads', async ({ page }) => {
    await page.goto('/community')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('prayer times page loads', async ({ page }) => {
    await page.goto('/prayer-times/singapore')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('business directory loads', async ({ page }) => {
    await page.goto('/business')
    await expect(page.locator('h1')).toContainText(/business/i)
  })

  test('catering page loads', async ({ page }) => {
    await page.goto('/catering')
    await expect(page.locator('h1')).toContainText(/catering/i)
  })

  test('products page loads', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('h1')).toContainText(/product/i)
  })

  test('services page loads', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('h1')).toContainText(/service/i)
  })

  test('privacy policy loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('navbar has key links', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('footer is present', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})

test.describe('SEO', () => {
  test('homepage has meta description', async ({ page }) => {
    await page.goto('/')
    const metaDesc = page.locator('meta[name="description"]')
    await expect(metaDesc).toHaveAttribute('content', /.+/)
  })

  test('halal food page has JSON-LD', async ({ page }) => {
    await page.goto('/halal-food')
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await expect(jsonLd).toBeAttached()
  })
})
