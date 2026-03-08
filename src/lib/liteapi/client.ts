// All LiteAPI calls are SERVER-SIDE ONLY. Never expose LITEAPI_API_KEY to client.
import LiteApi from 'liteapi-node-sdk'

let _client: ReturnType<typeof LiteApi> | null = null

export function getLiteApiClient() {
  if (!_client) {
    const apiKey = process.env.LITEAPI_API_KEY
    if (!apiKey) {
      throw new Error('LITEAPI_API_KEY is not set')
    }
    _client = LiteApi(apiKey)
  }
  return _client
}

/** Returns true when running against LiteAPI production (prod_ key prefix) */
export function isLiteApiProduction(): boolean {
  return process.env.LITEAPI_API_KEY?.startsWith('prod_') ?? false
}

/** Returns 'sandbox' | 'live' based on the NEXT_PUBLIC_LITEAPI_ENV env var */
export function getLiteApiEnv(): 'sandbox' | 'live' {
  return process.env.NEXT_PUBLIC_LITEAPI_ENV === 'live' ? 'live' : 'sandbox'
}
