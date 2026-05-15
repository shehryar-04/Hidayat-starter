import { EligibilityEvaluation } from './EligibilityEvaluation'
import { DisbursementReport } from './DisbursementReport'
import { Tabs, PageWrapper, PageHeader } from '../../shared/ui'

export default function WazifaModule() {
  const tabItems = [
    { label: 'Eligibility Evaluation', content: <EligibilityEvaluation /> },
    { label: 'Disbursement Report', content: <DisbursementReport /> },
  ]

  return (
    <PageWrapper>
      <PageHeader title="Wazifa — Stipend Management" subtitle="Evaluate eligibility and manage disbursements" />
      <Tabs items={tabItems} />
    </PageWrapper>
  )
}
