import { type NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/utils/cron-auth'

export async function GET(request: NextRequest) {
  const deny = verifyCronSecret(request)
  if (deny) return deny

  // TODO: implement cron logic
  return NextResponse.json({ ok: true })
}
