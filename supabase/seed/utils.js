// Shared utilities for seed scripts
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '../../.env.local')
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/)
      if (match) process.env[match[1]] = match[2].trim()
    }
  } catch {
    // env file missing — rely on existing process.env
  }
}

loadEnv()

export function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export function slugify(name, area = '') {
  const base = `${name}${area ? '-' + area : ''}`.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return base
}

export function point(lng, lat) {
  return `SRID=4326;POINT(${lng} ${lat})`
}

export function log(msg) {
  console.log(`[seed] ${msg}`)
}

export function logErr(msg, err) {
  console.error(`[seed] ERROR ${msg}:`, err?.message ?? err)
}
