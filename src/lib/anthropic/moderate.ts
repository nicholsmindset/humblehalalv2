import { generateFast } from './generate'
import { SYSTEM_PROMPTS } from './prompts'

export interface ModerationResult {
  action: 'approve' | 'reject' | 'flag'
  score: number
  reasoning: string
}

export async function moderateContent(
  contentType: string,
  content: string
): Promise<ModerationResult> {
  const prompt = `Content type: ${contentType}\n\nContent to moderate:\n${content}`

  const result = await generateFast('moderation', prompt, SYSTEM_PROMPTS.MODERATION)

  try {
    const parsed = JSON.parse(result.text)
    return {
      action: parsed.action ?? 'flag',
      score: parsed.score ?? 50,
      reasoning: parsed.reasoning ?? 'Unable to parse reasoning',
    }
  } catch {
    return { action: 'flag', score: 50, reasoning: 'Failed to parse AI response' }
  }
}
