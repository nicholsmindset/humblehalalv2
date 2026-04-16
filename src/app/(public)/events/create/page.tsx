import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateEventForm from './CreateEventForm'

export default async function CreateEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/events/create')

  return <CreateEventForm />
}
