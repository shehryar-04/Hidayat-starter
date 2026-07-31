/**
 * legalContent.js
 *
 * Privacy Policy and Terms of Service copy for the Hidayat platform.
 *
 * Organisation details (legal name, registration, jurisdiction, contact) come
 * from the official company profile via institutionData.js. The clauses below
 * describe how this application actually behaves — accounts, role-based access,
 * fatwa submissions, course enrolment, uploads, and certificates.
 *
 * This is plain-language policy copy, not legal advice. Have it reviewed by a
 * qualified legal adviser before relying on it for compliance purposes.
 */

import { ORG } from './institutionData'

export const LAST_UPDATED = 'July 2026'

export const PRIVACY_SECTIONS = [
  {
    heading: 'Who we are',
    paragraphs: [
      `${ORG.fullName} ("Hidayat", "we", "us") is a ${ORG.registration} based in ${ORG.headquarters}, operating in ${ORG.sector}. This policy explains what personal information we collect through this platform, why we collect it, and the choices you have.`,
    ],
  },
  {
    heading: 'Information we collect',
    list: [
      'Account details you provide when registering or being enrolled — name, email address, contact number, and role (student, scholar, mufti, or administrator).',
      'Academic records created as you progress through our programs — evaluations, Hifz and Nazra progress, course enrolments, attendance, and certificates.',
      'Content you submit — Darul Ifta questions, research publications, articles, uploaded documents, and profile photos.',
      'Payment references you supply to confirm course fees. We do not store card numbers on this platform.',
      'Technical and usage data — pages visited, searches performed, device and browser information, and error logs used to keep the service reliable.',
    ],
  },
  {
    heading: 'How we use your information',
    list: [
      'To operate your account, verify your identity, and apply the correct role-based access to your records.',
      'To deliver programs and services — recording evaluations, tracking progress, issuing certificates, and answering Darul Ifta questions.',
      'To assess eligibility for stipends (Wazifa) using the rules configured by the administration.',
      'To communicate service updates, enrolment confirmations, and responses to your submissions.',
      'To improve the platform — measuring how features and search are used, and diagnosing faults.',
      'To meet record-keeping obligations and to detect or prevent misuse of the platform.',
    ],
  },
  {
    heading: 'Publishing fatwas and publications',
    paragraphs: [
      'Questions submitted to Darul Ifta may be published, together with the response, in our public fatwa archive so that others can benefit. Before publication we remove personally identifying details from the question. If you do not want your question published, tell us when you submit it.',
      'Research publications and articles are published under the author name supplied at submission and are approved by our editorial review before appearing in the public repository.',
    ],
  },
  {
    heading: 'Who can see your data',
    list: [
      'Students can see their own records only.',
      'Scholars and Muftis can see the records of the students, subjects, and submissions assigned to them.',
      'Administrators can access records across the platform to run the institution.',
      'Service providers who host and operate the platform on our behalf, under agreements that restrict their use of the data.',
      'Authorities, where disclosure is required by applicable law.',
    ],
    paragraphs: ['We do not sell your personal information, and we do not use it for third-party advertising.'],
  },
  {
    heading: 'Security',
    paragraphs: [
      'Access is protected by authenticated accounts and row-level database policies, so records are only readable by the roles entitled to see them. Privileged operations run on the server, never in your browser. Data in transit is encrypted. No system is completely secure, so please keep your password confidential and tell us promptly if you believe your account has been compromised.',
    ],
  },
  {
    heading: 'How long we keep data',
    paragraphs: [
      'Academic and certification records are retained for as long as necessary to evidence a student\u2019s enrolment, results, and awards. Operational logs are kept for a limited period for security and troubleshooting. Where a record is no longer required, we delete it or anonymise it.',
    ],
  },
  {
    heading: 'Your choices',
    list: [
      'You can view and update your profile details from within your account.',
      'You can ask us for a copy of the personal information we hold about you.',
      'You can ask us to correct information that is inaccurate or incomplete.',
      'You can ask us to delete information that we are not required to retain.',
      'You can withdraw consent for optional communications at any time.',
    ],
    paragraphs: [`To make any of these requests, contact us on ${ORG.phone} or via ${ORG.website}.`],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Some of our programs enrol students who are minors. In those cases we accept enrolment details from a parent, guardian, or the enrolling institution, and we limit the student account to their own records.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      `We may update this policy as the platform develops. The revision date at the top of this page shows when it last changed. Material changes will be announced on the platform. This policy is governed by the laws of ${ORG.country}.`,
    ],
  },
]

export const TERMS_SECTIONS = [
  {
    heading: 'Agreement',
    paragraphs: [
      `These terms govern your use of the ${ORG.fullName} platform. By creating an account, enrolling in a program, submitting a question, or otherwise using the platform, you agree to them. If you are using the platform on behalf of an organisation, you confirm you are authorised to accept these terms for that organisation.`,
    ],
  },
  {
    heading: 'Accounts and roles',
    list: [
      'Provide accurate registration details and keep them up to date.',
      'Keep your login credentials confidential; you are responsible for activity under your account.',
      'Use only the access granted to your role. Attempting to reach records outside your role is not permitted.',
      'Accounts are personal and may not be shared or transferred.',
      'Tell us immediately if you suspect unauthorised use of your account.',
    ],
  },
  {
    heading: 'Programs, enrolment and fees',
    paragraphs: [
      'Program availability, schedules, curricula, and fees are set by the administration and may change. Enrolment is confirmed once the required fee has been received and verified. Where a course is time-bounded, access to its materials may end after the course closes.',
      'Fee refunds are handled case by case according to the policy in force at the time of enrolment. Contact the administration to discuss a refund request.',
    ],
  },
  {
    heading: 'Certificates and records',
    paragraphs: [
      'Certificates are issued only on satisfactory completion of the relevant program requirements and carry a verification code. A certificate remains our record of an award; we may correct or revoke one that was issued in error or obtained through misrepresentation. Altering, forging, or misrepresenting a Hidayat certificate or academic record is prohibited.',
    ],
  },
  {
    heading: 'Darul Ifta guidance',
    paragraphs: [
      'Responses issued through Darul Ifta are religious guidance based on the facts you present, given in accordance with the Qur\u2019an and Sunnah. They are not legal, financial, medical, or professional advice, and they should not be treated as a ruling on facts other than those described in your question. Where a matter has legal or financial consequences, seek qualified professional advice as well.',
    ],
  },
  {
    heading: 'Content you submit',
    paragraphs: [
      'You keep ownership of the questions, publications, articles, and files you submit. By submitting them you grant us a licence to store, review, edit for clarity, and publish that content on the platform as part of delivering our services.',
    ],
    list: [
      'Submit only content you are entitled to share.',
      'Do not submit unlawful, abusive, misleading, or plagiarised material.',
      'Do not upload malicious files or attempt to disrupt the platform.',
      'We may decline, edit, or remove submissions that do not meet our editorial and Shariah review standards.',
    ],
  },
  {
    heading: 'Our content',
    paragraphs: [
      'Course materials, publications, fatwa texts, reports, branding, and the platform itself belong to Hidayat or its licensors. You may use them for your own study and reference. Redistributing, republishing, or commercially exploiting them without written permission is not allowed. Where you quote our published material, attribute it to Hidayat.',
    ],
  },
  {
    heading: 'Consultancy and training engagements',
    paragraphs: [
      'Consultancy, corporate training, and certification engagements are delivered under a separate written agreement that sets out scope, deliverables, fees, and timelines. Where that agreement conflicts with these terms, the agreement prevails for that engagement.',
    ],
  },
  {
    heading: 'Availability',
    paragraphs: [
      'We aim to keep the platform available and accurate, but we provide it on an "as available" basis. Features may change, and access may be interrupted for maintenance or reasons beyond our control. We are not liable for indirect or consequential loss arising from use of the platform, and our total liability is limited to the fees you paid for the affected service.',
    ],
  },
  {
    heading: 'Suspension',
    paragraphs: [
      'We may suspend or close an account that breaches these terms, misuses the platform, or puts other users or our records at risk. Where practical we will tell you why and give you an opportunity to respond.',
    ],
  },
  {
    heading: 'Governing law and contact',
    paragraphs: [
      `These terms are governed by the laws of ${ORG.country}, and the courts of ${ORG.city} have jurisdiction over any dispute. Questions about these terms can be directed to us on ${ORG.phone} or via ${ORG.website}.`,
    ],
  },
]
