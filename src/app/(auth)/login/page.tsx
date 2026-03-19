import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In | HumbleHalal',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
