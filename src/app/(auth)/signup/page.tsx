import type { Metadata } from 'next'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Create Account | HumbleHalal',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <SignupForm />
}
