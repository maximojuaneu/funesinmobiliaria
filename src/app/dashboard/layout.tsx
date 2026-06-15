import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar initialRole={session.role} initialName={session.name} />
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
