#!/usr/bin/env node
/**
 * Master seed runner — runs all seed scripts in order.
 * Usage: npm run seed
 *
 * Prerequisites:
 *   - Supabase local stack running (npx supabase start)
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { execSync } = require('child_process')
const path = require('path')

const scripts = [
  { name: 'MUIS Halal Directory', file: 'muis.js' },
  { name: 'Mosques', file: 'mosques.js' },
  { name: 'Sample Listings', file: 'sample-listings.js' },
]

console.log('🌱 HumbleHalal Seed Runner\n')

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script.file)
  console.log(`▶ Running: ${script.name} (${script.file})`)
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' })
    console.log(`✓ ${script.name} complete\n`)
  } catch (err) {
    console.error(`✗ ${script.name} failed — ${err.message}`)
    process.exit(1)
  }
}

console.log('✅ All seed scripts complete.')
