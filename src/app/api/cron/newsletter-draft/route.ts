export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function generateFallbackNewsletter(
  listings: { name: string; area: string }[],
  events: { title: string; area: string; start_datetime: string }[],
  dateLabel: string
): string {
  const listingLines = listings
    .map((l) => `• **${l.name}** (${l.area ?? 'Singapore'})`)
    .join('\n')

  const eventLines = events
    .map((e) => {
      const d = new Date(e.start_datetime).toLocaleDateString('en-SG', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
      return `• **${e.title}** — ${d}, ${e.area ?? 'Singapore'}`
    })
    .join('\n')

  return `# HumbleHalal Weekly — ${dateLabel}

Assalamu'alaikum, community!

Here's your weekly roundup of what's new on HumbleHalal.

## 🆕 New Listings This Week

${listingLines || '• No new listings this week — check back soon!'}

## 📅 Upcoming Events

${eventLines || '• No events this week — check /events for the latest.'}

## 🔗 Explore More

- Browse halal restaurants: https://humblehalal.sg/halal-food?utm_source=newsletter&utm_medium=email&utm_campaign=weekly
- Find mosques near you: https://humblehalal.sg/mosque?utm_source=newsletter&utm_medium=email&utm_campaign=weekly
- Upcoming events: https://humblehalal.sg/events?utm_source=newsletter&utm_medium=email&utm_campaign=weekly

Jazakallah khair for being part of our community. 🌿

— The HumbleHalal Team
`
}

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  const db = getServiceClient() as any

  const dateLabel = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  try {
    const [{ data: newListings }, { data: upcomingEvents }] = await Promise.all([
      db.from('listings')
        .select('name, area, vertical, slug')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      db.from('events')
        .select('title, area, start_datetime, slug')
        .eq('status', 'active')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(3),
    ])

    let content: string

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const listingLines = (newListings ?? [])
          .map((l: { name: string; area: string }) => `- ${l.name} (${l.area ?? 'Singapore'})`)
          .join('\n')

        const eventLines = (upcomingEvents ?? [])
          .map((e: { title: string; area: string; start_datetime: string }) => {
            const d = new Date(e.start_datetime).toLocaleDateString('en-SG', {
              weekday: 'short', day: 'numeric', month: 'short',
            })
            return `- ${e.title} (${e.area ?? 'Singapore'}, ${d})`
          })
          .join('\n')

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Write a friendly weekly newsletter for HumbleHalal, Singapore's Muslim community halal directory.

New listings this week:
${listingLines || 'None'}

Upcoming events:
${eventLines || 'None'}

Guidelines:
- Warm, community-focused tone for Singapore's Muslim community
- Under 400 words
- Use appropriate Islamic greetings (Assalamu'alaikum, Jazakallah)
- Include UTM-tracked links: https://humblehalal.sg/halal-food?utm_source=newsletter&utm_medium=email&utm_campaign=weekly
- Format in Markdown with headings and bullet points`,
          }],
        })

        content = message.content[0].type === 'text'
          ? message.content[0].text
          : generateFallbackNewsletter(newListings ?? [], upcomingEvents ?? [], dateLabel)
      } catch (aiErr) {
        console.warn('[newsletter-draft] AI generation failed, using fallback:', aiErr)
        content = generateFallbackNewsletter(newListings ?? [], upcomingEvents ?? [], dateLabel)
      }
    } else {
      content = generateFallbackNewsletter(newListings ?? [], upcomingEvents ?? [], dateLabel)
    }

    const { error: insertErr } = await db
      .from('ai_content_drafts')
      .insert({
        content_type: 'newsletter',
        title: `Weekly Newsletter — ${dateLabel}`,
        body: content,
        status: 'draft',
        keyword: 'weekly newsletter',
        created_at: new Date().toISOString(),
      })

    if (insertErr) {
      console.error('[newsletter-draft] insert error:', insertErr)
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, draftSaved: true, dateLabel })
  } catch (err: unknown) {
    console.error('[newsletter-draft] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
