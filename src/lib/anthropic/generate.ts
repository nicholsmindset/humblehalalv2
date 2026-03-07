import { createClient } from '@supabase/supabase-js'
import { getAnthropicClient, AI_MODELS, type AIModel } from './client'

// ── Cost tracking ──────────────────────────────────────────────

// Approximate pricing per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = PRICING[model] ?? { input: 3, output: 15 }
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function logCost(
  taskType: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  costUsd: number
) {
  try {
    const db = getServiceClient()
    await db.from('ai_cost_log').insert({
      task_type: taskType,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost_usd: costUsd,
    })
  } catch (err) {
    console.error('[ai/cost-log] Failed to log cost:', err)
  }
}

async function logActivity(
  action: string,
  details?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const db = getServiceClient()
    await db.from('ai_activity_log').insert({ action, details, metadata })
  } catch (err) {
    console.error('[ai/activity-log] Failed to log activity:', err)
  }
}

// ── Core generate function ─────────────────────────────────────

export interface GenerateOptions {
  taskType: string
  prompt: string
  systemPrompt?: string
  model?: AIModel
  maxTokens?: number
  temperature?: number
}

export interface GenerateResult {
  text: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  model: string
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const {
    taskType,
    prompt,
    systemPrompt,
    model = AI_MODELS.FAST,
    maxTokens = 4096,
    temperature = 0.7,
  } = opts

  const client = getAnthropicClient()

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: 'user', content: prompt }],
  })

  const text =
    response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('') || ''

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd = estimateCost(model, inputTokens, outputTokens)

  // Fire-and-forget cost + activity logging
  logCost(taskType, model, inputTokens, outputTokens, costUsd)
  logActivity(`ai:${taskType}`, `Generated ${outputTokens} tokens`, {
    model,
    inputTokens,
    outputTokens,
    costUsd,
  })

  return { text, inputTokens, outputTokens, costUsd, model }
}

// ── Convenience wrappers ───────────────────────────────────────

/** Fast generation (Sonnet) — moderation, meta gen, descriptions */
export function generateFast(
  taskType: string,
  prompt: string,
  systemPrompt?: string
) {
  return generate({ taskType, prompt, systemPrompt, model: AI_MODELS.FAST })
}

/** Quality generation (Opus) — blog posts, travel guides */
export function generateQuality(
  taskType: string,
  prompt: string,
  systemPrompt?: string
) {
  return generate({
    taskType,
    prompt,
    systemPrompt,
    model: AI_MODELS.QUALITY,
    maxTokens: 8192,
  })
}
