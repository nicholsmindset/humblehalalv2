/**
 * Hardcoded prompt templates — used as fallbacks when ai_prompts table
 * has no active entry for a given name.
 *
 * Each export is a function that takes context and returns the full prompt string.
 * System prompts are kept separate from user prompts so the client can cache them.
 */

// ── Shared system context ─────────────────────────────────────────────────────
export const SYSTEM_HUMBLEHALAL = `You are the content engine for HumbleHalal.sg — Singapore's leading halal ecosystem directory. Your audience is Singapore's Muslim community (Malay, Indian Muslim, converts). Always write in British English. Be warm, helpful, and culturally respectful. Never mention pork, alcohol, or haram content. Prioritise accuracy over creativity.`

// ── Moderation ────────────────────────────────────────────────────────────────
export const SYSTEM_MODERATOR = `${SYSTEM_HUMBLEHALAL}

You are a content moderator. Assess user-submitted content for: spam, hate speech, explicit content, misinformation about halal status, competitor attacks, or irrelevant content. Be strict but fair.`

export function buildModeratePrompt(params: {
  contentType: 'review' | 'forum_post' | 'classified' | 'listing_description'
  content: string
  entityName?: string
}): string {
  return `Moderate this ${params.contentType}${params.entityName ? ` about "${params.entityName}"` : ''}:

---
${params.content}
---

Respond with ONLY valid JSON in this exact shape:
{
  "action": "approve" | "reject" | "flag",
  "score": 0.0–1.0,
  "reasoning": "one sentence explanation"
}

approve = safe to publish
reject = violates guidelines (spam, hate, explicit, misinformation)
flag = borderline, needs human review`
}

// ── Listing enrichment ────────────────────────────────────────────────────────
export const SYSTEM_ENRICHER = `${SYSTEM_HUMBLEHALAL}

You enrich halal business listings for a Singapore directory. Write descriptions that are SEO-friendly, factual, and compelling. Include relevant Singapore context (area, cuisine type, halal certification status). Keep descriptions 80–120 words.`

export function buildEnrichListingPrompt(params: {
  name: string
  category: string
  area: string
  halalStatus: string
  existingDescription?: string
  cuisine?: string
  tags?: string[]
}): string {
  return `Enrich this halal listing for HumbleHalal.sg:

Business: ${params.name}
Category: ${params.category}${params.cuisine ? `\nCuisine: ${params.cuisine}` : ''}
Area: ${params.area}, Singapore
Halal Status: ${params.halalStatus}${params.existingDescription ? `\nExisting description: ${params.existingDescription}` : ''}${params.tags?.length ? `\nExisting tags: ${params.tags.join(', ')}` : ''}

Respond with ONLY valid JSON:
{
  "description": "80–120 word SEO-friendly description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seo_score": 1–100,
  "meta_title": "under 60 chars",
  "meta_description": "150–160 chars"
}`
}

// ── Blog post generation ──────────────────────────────────────────────────────
export const SYSTEM_BLOG_WRITER = `${SYSTEM_HUMBLEHALAL}

You write SEO-optimised blog posts for HumbleHalal.sg. Posts should: target a specific long-tail keyword, provide genuine value to Singapore Muslims, include practical tips, reference real Singapore areas/landmarks where appropriate, and follow E-E-A-T principles. Use markdown formatting.`

export function buildBlogPostPrompt(params: {
  keyword: string
  area?: string
  title?: string
  wordCount?: number
}): string {
  return `Write a blog post for HumbleHalal.sg.

Target keyword: "${params.keyword}"${params.area ? `\nFocus area: ${params.area}, Singapore` : ''}${params.title ? `\nSuggested title: ${params.title}` : ''}
Target word count: ${params.wordCount ?? 800}–${(params.wordCount ?? 800) + 200} words

Requirements:
- H1 title (include keyword naturally)
- H2/H3 subheadings
- Practical, local Singapore content
- Call to action linking back to relevant HumbleHalal directory pages
- Do NOT fabricate specific business names or addresses

Output in markdown. Start directly with the H1 title.`
}

// ── Travel guide generation ───────────────────────────────────────────────────
export const SYSTEM_TRAVEL_WRITER = `${SYSTEM_HUMBLEHALAL}

You write halal travel guides for Muslim travellers. Guides should cover: halal food options, Muslim-friendly accommodation, prayer facilities, local cultural tips, and transport advice. Be specific and practical.`

export function buildTravelGuidePrompt(params: {
  destination: string
  guideType?: 'halal-food' | 'weekend-guide' | 'full-guide'
}): string {
  return `Write a halal travel guide for: ${params.destination}

Guide type: ${params.guideType ?? 'halal-food'}

Include:
- Overview of halal food scene
- Top halal restaurant recommendations (note: describe the type, don't fabricate specific addresses)
- Prayer facility information
- Muslim-friendly tips
- Best time to visit
- Getting there from Singapore

Target: 600–900 words. Use markdown with H2/H3 headings.`
}

// ── Newsletter generation ─────────────────────────────────────────────────────
export const SYSTEM_NEWSLETTER = `${SYSTEM_HUMBLEHALAL}

You write the weekly HumbleHalal newsletter. Tone: friendly community digest, not corporate. Use emojis sparingly. Each section should be scannable.`

export function buildNewsletterPrompt(params: {
  newListingsCount: number
  topSearches: string[]
  upcomingEvents: Array<{ name: string; date: string; area: string }>
  featuredAreas?: string[]
  weekOf: string
}): string {
  return `Write the HumbleHalal weekly newsletter for the week of ${params.weekOf}.

Data this week:
- New listings added: ${params.newListingsCount}
- Top searches: ${params.topSearches.slice(0, 5).join(', ')}
- Upcoming events: ${params.upcomingEvents.slice(0, 3).map(e => `${e.name} (${e.date}, ${e.area})`).join('; ')}${params.featuredAreas?.length ? `\n- Featured areas this week: ${params.featuredAreas.join(', ')}` : ''}

Newsletter sections to include:
1. Brief intro (2–3 sentences)
2. "What's New" — new listings highlight
3. "This Week's Events" — 2–3 upcoming events
4. "Trending Searches" — what people are looking for
5. Brief closing call-to-action

Output as HTML-ready content with simple tags (p, h2, ul, li). Keep total length under 400 words.`
}

// ── Meta tag generation ───────────────────────────────────────────────────────
export function buildMetaPrompt(params: {
  pageType: 'listing' | 'category' | 'area' | 'event' | 'blog' | 'mosque' | 'travel'
  primaryKeyword: string
  area?: string
  entityName?: string
}): string {
  return `Generate SEO meta tags for a HumbleHalal.sg page.

Page type: ${params.pageType}
Primary keyword: "${params.primaryKeyword}"${params.area ? `\nArea: ${params.area}, Singapore` : ''}${params.entityName ? `\nEntity: ${params.entityName}` : ''}

Rules:
- Title: under 60 chars, include keyword, end with "| HumbleHalal"
- Description: 150–160 chars, include keyword, include Singapore, compelling CTA

Respond with ONLY valid JSON:
{
  "title": "...",
  "description": "..."
}`
}

// ── Morning briefing ──────────────────────────────────────────────────────────
export const SYSTEM_BRIEFING = `${SYSTEM_HUMBLEHALAL}

You generate a concise daily briefing for the solo admin of HumbleHalal.sg. Tone: direct, actionable. Use bullet points. Highlight anything that needs immediate attention.`

export function buildMorningBriefingPrompt(params: {
  date: string
  newListings: number
  newReviews: number
  pendingModeration: number
  eventsToday: number
  topSearchesYesterday: string[]
  revenueYesterday?: number
  activeBookings?: number
}): string {
  return `Generate a morning briefing for HumbleHalal.sg admin — ${params.date}

Yesterday's metrics:
- New listings submitted: ${params.newListings}
- New reviews: ${params.newReviews}
- Items pending moderation: ${params.pendingModeration}
- Events today: ${params.eventsToday}
- Top searches: ${params.topSearchesYesterday.slice(0, 5).join(', ')}${params.revenueYesterday !== undefined ? `\n- Revenue: SGD ${params.revenueYesterday.toFixed(2)}` : ''}${params.activeBookings !== undefined ? `\n- Active travel bookings: ${params.activeBookings}` : ''}

Generate:
1. One-paragraph executive summary (what matters most today)
2. "Action Required" bullet list (items needing attention)
3. "Good News" — one positive highlight
4. One suggested content/SEO task for today

Keep total response under 300 words.`
}

// ── SEO page audit ────────────────────────────────────────────────────────────
export function buildSeoAuditPrompt(params: {
  url: string
  title?: string
  metaDescription?: string
  h1?: string
  wordCount?: number
  hasSchema: boolean
  hasInternalLinks: boolean
  keyword?: string
}): string {
  return `Audit this HumbleHalal.sg page for SEO:

URL: ${params.url}
Title: ${params.title ?? 'MISSING'}
Meta description: ${params.metaDescription ?? 'MISSING'}
H1: ${params.h1 ?? 'MISSING'}
Word count: ${params.wordCount ?? 'unknown'}
Has JSON-LD schema: ${params.hasSchema ? 'yes' : 'NO'}
Has internal links: ${params.hasInternalLinks ? 'yes' : 'NO'}${params.keyword ? `\nTarget keyword: "${params.keyword}"` : ''}

Score this page 0–100 and identify the top 3 improvements.

Respond with ONLY valid JSON:
{
  "score": 0–100,
  "issues": ["issue 1", "issue 2", "issue 3"],
  "meta_status": "good" | "missing" | "too_long" | "too_short",
  "schema_status": "present" | "missing",
  "recommendation": "one actionable sentence"
}`
}
