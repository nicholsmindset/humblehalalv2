import { Resend } from 'resend'

// Lazily instantiated so build-time does not fail without env var
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const FROM_ADDRESS = 'HumbleHalal <tickets@humblehalal.sg>'
