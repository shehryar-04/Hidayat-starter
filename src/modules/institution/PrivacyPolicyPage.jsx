import LegalPage from './LegalPage'
import { PRIVACY_SECTIONS } from './legalContent'

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="How Hidayat collects, uses, and protects the information you share with us through this platform."
      sections={PRIVACY_SECTIONS}
    />
  )
}
