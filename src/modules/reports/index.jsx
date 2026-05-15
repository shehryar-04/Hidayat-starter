import { EmptyState, PageWrapper, PageHeader } from '../../shared/ui'
import { BarChart3 } from 'lucide-react'

export default function ReportsModule() {
  return (
    <PageWrapper>
      <PageHeader title="Reports" subtitle="Schema-driven institutional reports." />
      <EmptyState
        icon={BarChart3}
        title="No reports available"
        description="Report schemas are configured by an Admin. No reports are available yet."
      />
    </PageWrapper>
  )
}
