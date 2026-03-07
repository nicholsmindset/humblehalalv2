// All LiteAPI calls are SERVER-SIDE ONLY. Never expose LITEAPI_API_KEY to client.
import LiteApi from 'liteapi-node-sdk'

let _client: ReturnType<typeof LiteApi> | null = null

export function getLiteApiClient() {
  if (!_client) {
    if (!process.env.LITEAPI_API_KEY) {
      throw new Error('LITEAPI_API_KEY is not set')
    }
    _client = LiteApi(process.env.LITEAPI_API_KEY)
  }
  return _client
}
