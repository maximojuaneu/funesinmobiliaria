import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import type { Metadata } from 'next'
import MetricasClient from './MetricasClient'

export const metadata: Metadata = { title: 'Métricas | Funes Inmobiliaria', robots: { index: false } }

export default async function MetricasPage() {
  const session = await requireAuth()
  if (!session || session.role !== 'admin') redirect('/dashboard')
  return <MetricasClient />
}
