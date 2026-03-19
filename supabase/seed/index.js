/**
 * Seed: Main entry point
 * Runs all seed scripts in order.
 * Run: node supabase/seed/index.js
 */
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function run(script, label) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`[seed] Running: ${label}`)
  console.log('='.repeat(50))
  try {
    execSync(`node ${join(__dirname, script)}`, { stdio: 'inherit' })
  } catch {
    console.error(`[seed] ${label} failed — continuing`)
  }
}

run('mosques.js',  'Mosques')
run('muis.js',    'MUIS Listings')
run('places.js',  'Google Places Enrichment')

console.log('\n[seed] All seeds complete.')
