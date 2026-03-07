import { generateFast } from './generate'
import { SYSTEM_PROMPTS } from './prompts'

export interface SeoMeta {
  meta_title: string
  meta_description: string
}

export async function generateSeoMeta(
  pageType: string,
  pageData: Record<string, unknown>
): Promise<SeoMeta> {
  const prompt = `Page type: ${pageType}\nPage data: ${JSON.stringify(pageData, null, 2)}`

  const result = await generateFast('seo-meta', prompt, SYSTEM_PROMPTS.SEO_META)

  try {
    return JSON.parse(result.text) as SeoMeta
  } catch {
    return {
      meta_title: `${pageData.name ?? pageType} | HumbleHalal`,
      meta_description: `Discover ${pageData.name ?? pageType} on HumbleHalal — Singapore's halal directory.`,
    }
  }
}
