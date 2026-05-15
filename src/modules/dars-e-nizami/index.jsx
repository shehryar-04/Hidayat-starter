import { GraduationCap, Construction } from 'lucide-react'
import { Badge, PageWrapper } from '../../shared/ui'

export default function DarsENizamiModule() {
  return (
    <PageWrapper className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <GraduationCap className="w-9 h-9 text-primary-500" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-primary-600 mb-3">Dars-e-Nizami Program</h1>
      <p className="text-base text-neutral-500 max-w-md mb-6">
        Multi-year Islamic curriculum with levels, subjects, evaluations, transcripts, and student promotion.
      </p>
      <Badge variant="warning" dot>
        <span className="flex items-center gap-2">
          <Construction className="w-4 h-4" />
          Under Construction
        </span>
      </Badge>
      <p className="text-sm text-neutral-400 mt-4">This module is being developed. Check back soon.</p>
    </PageWrapper>
  )
}
