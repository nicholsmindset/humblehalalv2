import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

// Model selection per CLAUDE.md: Sonnet for speed, Opus for quality
export const AI_MODELS = {
  FAST: 'claude-sonnet-4-20250514' as const,
  QUALITY: 'claude-opus-4-20250514' as const,
} as const

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]
