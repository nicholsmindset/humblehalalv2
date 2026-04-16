import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads with brand in title and renders navbar', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/HumbleHalal/i)
    await expect(page.getByRole('link', { name: /humble\s*halal/i }).first()).toBeVisible()
  })
})

test.describe('pSEO pages', () => {
  test('/halal-food/malay/geylang renders JSON-LD and has indexable meta', async ({ page }) => {
    const response = await page.goto('/halal-food/malay/geylang')
    expect(response?.status()).toBeLessThan(500)
    const schemas = await page.locator('script[type="application/ld+json"]').all()
    expect(schemas.length).toBeGreaterThan(0)
    const robots = await page.locator('meta[name="robots"]').first().getAttribute('content')
    if (robots) expect(robots).not.toMatch(/noindex/i)
  })

  test('/mosque listing page renders', async ({ page }) => {
    const response = await page.goto('/mosque')
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Search', () => {
  test('search page responds and accepts a query', async ({ page }) => {
    const response = await page.goto('/search?q=halal')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Auth protection', () => {
  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /admin redirects', async ({ page }) => {
    await page.goto('/admin')
    // Admin redirects to /login (unauthed) or / (authed non-admin)
    await expect(page).toHaveURL(/\/(login|)$/)
  })
})

test.describe('Error pages', () => {
  test('unknown route renders branded 404', async ({ page }) => {
    const response = await page.goto('/this-route-definitely-does-not-exist-zzz')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/404/).first()).toBeVisible()
  })
})
