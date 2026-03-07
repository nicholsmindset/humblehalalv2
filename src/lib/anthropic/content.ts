import { generateQuality, generateFast } from './generate'
import { SYSTEM_PROMPTS } from './prompts'

export interface BlogPostResult {
  title: string
  body: string
  meta_title: string
  meta_description: string
  target_keyword: string
}

export async function generateBlogPost(
  topic: string,
  keyword: string,
  vertical?: string,
  area?: string
): Promise<BlogPostResult> {
  const prompt = [
    `Topic: ${topic}`,
    `Target keyword: ${keyword}`,
    vertical ? `Vertical: ${vertical}` : '',
    area ? `Area: ${area}` : '',
    '',
    'Write a complete blog post. At the end, provide these in a JSON block:',
    '```json',
    '{ "meta_title": "...", "meta_description": "..." }',
    '```',
  ]
    .filter(Boolean)
    .join('\n')

  const result = await generateQuality('blog-post', prompt, SYSTEM_PROMPTS.BLOG_POST)

  // Parse meta from JSON block at end
  const jsonMatch = result.text.match(/```json\s*(\{[\s\S]*?\})\s*```/)
  let meta = { meta_title: '', meta_description: '' }
  if (jsonMatch) {
    try {
      meta = JSON.parse(jsonMatch[1])
    } catch {
      // use defaults
    }
  }

  const body = result.text.replace(/```json[\s\S]*?```/, '').trim()
  const titleMatch = body.match(/^#\s+(.+)/m)

  return {
    title: titleMatch?.[1] ?? topic,
    body,
    meta_title: meta.meta_title || `${topic} | HumbleHalal`,
    meta_description:
      meta.meta_description ||
      `Read about ${topic} on HumbleHalal — Singapore's halal lifestyle platform.`,
    target_keyword: keyword,
  }
}

export interface NewsletterResult {
  subject: string
  preview_text: string
  body_html: string
}

export async function generateNewsletter(
  highlights: {
    newListings: Array<{ name: string; area: string; cuisine?: string }>
    upcomingEvents: Array<{ title: string; date: string }>
    topSearches: string[]
    blogPosts: Array<{ title: string; slug: string }>
  }
): Promise<NewsletterResult> {
  const prompt = `Generate a weekly newsletter based on this data:\n${JSON.stringify(highlights, null, 2)}`

  const result = await generateFast(
    'newsletter-draft',
    prompt,
    SYSTEM_PROMPTS.NEWSLETTER
  )

  try {
    return JSON.parse(result.text) as NewsletterResult
  } catch {
    return {
      subject: 'This Week on HumbleHalal',
      preview_text: 'New halal spots, events, and community highlights',
      body_html: result.text,
    }
  }
}

export async function generateTravelGuide(
  city: string,
  country: string
): Promise<{ title: string; body: string }> {
  const prompt = `Write a Muslim-friendly travel guide for ${city}, ${country}. Focus on halal food, prayer facilities, and Muslim-friendly accommodation.`

  const result = await generateQuality(
    'travel-guide',
    prompt,
    SYSTEM_PROMPTS.TRAVEL_GUIDE
  )

  const titleMatch = result.text.match(/^#\s+(.+)/m)
  return {
    title: titleMatch?.[1] ?? `Halal Travel Guide: ${city}`,
    body: result.text,
  }
}
