import LegalPage from './LegalPage'
import { TERMS_SECTIONS } from './legalContent'

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The terms that apply when you use the Hidayat platform, enrol in a program, or submit content to us."
      sections={TERMS_SECTIONS}
    />
  )
}
