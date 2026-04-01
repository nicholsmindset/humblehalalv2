import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'

// ── Model aliases ─────────────────────────────────────────────────────────────
export const CLAUDE_SONNET = 'claude-sonnet-4-6'   // speed tasks
export const CLAUDE_OPUS   = 'claude-opus-4-6'     // quality tasks

// Pricing per 1M tokens (USD) — used for cost logging
const TOKEN_COST_USD: Record<string, { input: number; output: number }> = {
  [CLAUDE_SONNET]: { input: 3.00,  output: 15.00 },
  [CLAUDE_OPUS]:   { input: 15.00, output: 75.00 },
}

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const prices = TOKEN_COST_USD[model] ?? { input: 3.00, output: 15.00 }
  return (inputTokens / 1_000_000) * prices.input + (outputTokens / 1_000_000) * prices.output
}

// ── Singleton client (server-only) ────────────────────────────────────────────
let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}

// ── callClaude ────────────────────────────────────────────────────────────────
export interface ClaudeOptions {
  model?: typeof CLAUDE_SONNET | typeof CLAUDE_OPUS | string
  maxTokens?: number
  /** If set, system prompt will be cached (prompt caching, reduces cost on repeated calls) */
  cacheSystem?: boolean
  /** Logged to ai_cost_log for cost attribution */
  taskType: string
}

export interface ClaudeResult {
  text: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  model: string
}

export async function callClaude(
  userPrompt: string,
  systemPrompt: string,
  options: ClaudeOptions
): Promise<ClaudeResult> {
  const model     = options.model ?? CLAUDE_SONNET
  const maxTokens = options.maxTokens ?? 2048
  const client    = getClient()

  const systemContent: Anthropic.TextBlockParam = options.cacheSystem
    ? { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }
    : { type: 'text', text: systemPrompt }

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: [systemContent],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text        = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd     = calcCost(model, inputTokens, outputTokens)

  // Log cost asynchronously — don't block response
  logCost(model, options.taskType, inputTokens, outputTokens, costUsd).catch(() => {})

  return { text, inputTokens, outputTokens, costUsd, model }
}

// ── Cost logging ──────────────────────────────────────────────────────────────
async function logCost(
  model: string,
  taskType: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number
): Promise<void> {
  try {
    const supabase = await createAdminClient()
    await (supabase as any).from('ai_cost_log').insert({
      model,
      task_type: taskType,
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      cost_usd: costUsd,
    })
  } catch {
    // Non-critical — swallow silently
  }
}

// ── Prompt fetcher (from ai_prompts table with fallback) ──────────────────────
export async function getPromptTemplate(
  name: string,
  fallback: string
): Promise<string> {
  try {
    const supabase = await createAdminClient()
    const { data } = await (supabase as any)
      .from('ai_prompts')
      .select('prompt_template')
      .eq('name', name)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    return data?.prompt_template ?? fallback
  } catch {
    return fallback
  }
}
