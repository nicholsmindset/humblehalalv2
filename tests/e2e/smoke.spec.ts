import { test, expect } from '@playwright/test'

// ── Homepage ──────────────────────────────────────────────────────────────────
test.describe('Homepage', () => {
  test('loads and shows key sections', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/HumbleHalal/i)
    // Navbar brand
    await expect(page.locator('text=Humble')).toBeVisible()
  })
})

// ── Halal Food listing page ───────────────────────────────────────────────────
test.describe('Halal Food page', () => {
  test('loads /halal-food without error', async ({ page }) => {
    const res = await page.goto('/halal-food')
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator('h1')).toBeVisible()
  })
})

// ── Catering pSEO pages ───────────────────────────────────────────────────────
test.describe('Catering category pages', () => {
  const SLUGS = ['wedding-catering', 'corporate-catering', 'aqiqah-catering', 'buffet-catering']

  for (const slug of SLUGS) {
    test(`/catering/${slug} renders`, async ({ page }) => {
      const res = await page.goto(`/catering/${slug}`)
      expect(res?.status()).toBeLessThan(500)
      await expect(page.locator('h1')).toBeVisible()
      // Breadcrumb contains Catering
      await expect(page.locator('nav').first()).toContainText('Catering')
    })
  }
})

// ── Services pSEO pages ───────────────────────────────────────────────────────
test.describe('Services category pages', () => {
  const SLUGS = ['muslim-finance', 'muslim-healthcare', 'muslim-wedding']

  for (const slug of SLUGS) {
    test(`/services/${slug} renders`, async ({ page }) => {
      const res = await page.goto(`/services/${slug}`)
      expect(res?.status()).toBeLessThan(500)
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})

// ── Products pSEO pages ───────────────────────────────────────────────────────
test.describe('Products category pages', () => {
  const SLUGS = ['halal-meat', 'halal-groceries', 'halal-fashion']

  for (const slug of SLUGS) {
    test(`/products/${slug} renders`, async ({ page }) => {
      const res = await page.goto(`/products/${slug}`)
      expect(res?.status()).toBeLessThan(500)
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})

// ── Prayer times ──────────────────────────────────────────────────────────────
test('/prayer-times/singapore loads', async ({ page }) => {
  const res = await page.goto('/prayer-times/singapore')
  expect(res?.status()).toBeLessThan(500)
})

// ── New listing form ──────────────────────────────────────────────────────────
test.describe('New listing form', () => {
  test('renders step 1 with vertical options', async ({ page }) => {
    await page.goto('/listings/new')
    await expect(page.locator('h1')).toContainText('List Your Halal Business')
    // All 4 vertical buttons visible
    await expect(page.locator('button', { hasText: 'Restaurant' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Catering' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Service' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Product' })).toBeVisible()
  })

  test('can advance from step 1 to step 2', async ({ page }) => {
    await page.goto('/listings/new')
    // Choose a vertical
    await page.click('button:has-text("Restaurant")')
    await page.click('button:has-text("Next")')
    // Step 2 visible
    await expect(page.locator('text=Business Name')).toBeVisible()
  })

  test('Next button disabled when name or area is empty in step 2', async ({ page }) => {
    await page.goto('/listings/new')
    await page.click('button:has-text("Restaurant")')
    await page.click('button:has-text("Next")')
    // Next button should be disabled with empty fields
    const nextBtn = page.locator('button:has-text("Next →")').last()
    await expect(nextBtn).toBeDisabled()
  })
})

// ── Mosque page ───────────────────────────────────────────────────────────────
test('/mosque loads', async ({ page }) => {
  const res = await page.goto('/mosque')
  expect(res?.status()).toBeLessThan(500)
})

// ── Events page ───────────────────────────────────────────────────────────────
test('/events loads', async ({ page }) => {
  const res = await page.goto('/events')
  expect(res?.status()).toBeLessThan(500)
})

// ── Login page ────────────────────────────────────────────────────────────────
test('/login loads', async ({ page }) => {
  const res = await page.goto('/login')
  expect(res?.status()).toBeLessThan(500)
  await expect(page.locator('h1, h2').first()).toBeVisible()
})

// ── Sitemap ───────────────────────────────────────────────────────────────────
test('/sitemap.xml is valid XML', async ({ page }) => {
  const res = await page.goto('/sitemap.xml')
  expect(res?.status()).toBe(200)
  const content = await page.content()
  expect(content).toContain('<urlset')
  expect(content).toContain('<url>')
  // Should include catering and services pages
  expect(content).toContain('/catering/')
  expect(content).toContain('/services/')
  expect(content).toContain('/products/')
})

// ── API: GET /api/listings ────────────────────────────────────────────────────
test('GET /api/listings returns JSON', async ({ request }) => {
  const res = await request.get('/api/listings?limit=5')
  expect(res.status()).toBeLessThan(500)
  const json = await res.json()
  expect(json).toHaveProperty('data')
  expect(json).toHaveProperty('count')
})

// ── API: POST /api/listings — unauthenticated returns 401 ────────────────────
test('POST /api/listings without auth returns 401', async ({ request }) => {
  const res = await request.post('/api/listings', {
    data: { name: 'Test', vertical: 'food', area: 'Bedok' },
  })
  expect(res.status()).toBe(401)
})
