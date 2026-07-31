/**
 * institutionData.js
 *
 * Single source of truth for Hidayat's institutional content.
 * All content below is transcribed from the official
 * "Hidayat — Academy of Islamic Sciences" Company Profile (2026 edition).
 *
 * Keep this file as the only place these facts live so the About, Services,
 * Training, Trainers, Consultancy, Events and Contact pages stay consistent.
 */

// ─── Identity & contact ──────────────────────────────────────
export const ORG = {
  fullName: 'Hidayat — Academy of Islamic Sciences',
  shortName: 'Hidayat',
  tagline: 'Learning Today, Leading Tomorrow',
  established: '2018',
  website: 'www.hidayat.pk',
  websiteUrl: 'https://www.hidayat.pk',
  phone: '0320 7386145',
  phoneIntl: '+923207386145',
  city: 'Lahore',
  country: 'Pakistan',
  headquarters: 'Lahore, Pakistan',
  registration: 'SECP Private Limited Company',
  chamber: 'Lahore Chamber of Commerce & Industry (LCCI)',
  parentCompany: 'International Halal Inspection & Certification (IHIC)',
  sector: 'Education, Training, Research & Consultancy',
  pillars: ['Professional Excellence', 'Islamic Guidance', 'Capacity Building'],
}

// "WHO WE ARE" fact table (profile page 4)
export const IDENTITY_FACTS = [
  { label: 'Full Name', value: ORG.fullName },
  { label: 'Established', value: ORG.established },
  { label: 'Website', value: ORG.website },
  { label: 'Headquarters', value: ORG.headquarters },
  { label: 'Registration', value: ORG.registration },
  { label: 'Chamber', value: ORG.chamber },
  { label: 'Parent Company', value: ORG.parentCompany },
  { label: 'Sector', value: ORG.sector },
]

// ─── About (profile page 3) ──────────────────────────────────
export const ABOUT_INTRO = [
  'Hidayat is a dynamic platform dedicated to professional excellence, intellectual development, Islamic guidance, and capacity building. Established in 2018, Hidayat serves public and private sectors across Pakistan through modern education, training, research, and consultancy services.',
  'We believe true success comes from the balanced integration of professional competence, ethical values, and continuous learning.',
]

export const ABOUT_STATS = [
  { value: '3', label: 'Core Pillars' },
  { value: '10+', label: 'Service Areas' },
  { value: '2018', label: 'Year Founded' },
  { value: '16+', label: 'Expert Trainers' },
]

export const CREDENTIALS = [
  'Registered with SECP (Pvt. Ltd.)',
  'Public & private sector clients',
  'Affiliated with LCCI Lahore',
  'National & international reach',
  'Parent company: IHIC',
  'Shariah-compliant services',
]

// ─── Why choose Hidayat (profile page 15) ────────────────────
export const WHY_CHOOSE = [
  'Qualified scholars & industry experts',
  'Shariah-compliant services & guidance',
  'Modern learning with Islamic values',
  'Proven track record since 2018',
  'National & international outreach',
  'Flexible online & in-person formats',
  'Customized solutions for every client',
  'Comprehensive 3-pillar approach',
]

// ─── Director's message (profile page 5) ─────────────────────
export const DIRECTOR = {
  name: 'Dr. Mufti Munib Siddiqui',
  title: 'Director & Head of Research and Trainings',
  organisation: ORG.fullName,
  greeting: 'Welcome to Hidayat',
  paragraphs: [
    'Since its inception, Hidayat has remained committed to providing quality education, professional development, and intellectual growth opportunities that prepare individuals to excel academically, professionally, and spiritually. Our mission is to inspire individuals to become responsible professionals, ethical leaders, and valuable contributors to society.',
    'At Hidayat, education is the foundation of transformation. We continuously strive to maintain the highest standards of teaching, training, and research in line with international benchmarks. Our approach is practical and development-focused — ensuring knowledge is translated into real-world application.',
    'We bridge the gap between academic concepts and professional practice through active participation, industry collaboration, and skill-based training programs. Whether through professional training, virtual learning, consultancy, or Islamic guidance — our goal is to enable every participant to grow intellectually, discover their potential, and achieve excellence.',
    'The achievements of our students and alumni reflect our commitment to quality. We take pride in nurturing individuals who not only excel professionally but also uphold strong moral and ethical values.',
  ],
  closingDua:
    'We pray that Allah grants us wisdom, sincerity, and strength to continue fulfilling this noble mission with dedication and excellence.',
}

// ─── Mission, vision & core values (profile page 6) ──────────
export const MISSION =
  'To promote a balanced, purpose-driven way of life by providing authentic, ethical, and Shariah-compliant services across education, professional development, Islamic guidance, research, consultancy, and welfare — contributing to a knowledgeable, morally responsible, and progressive Islamic society.'

export const VISION =
  'To build a welfare-oriented society that is intellectually strong, professionally competent, socially responsible, and firmly rooted in Islamic values — nurturing individuals who positively contribute to their families, communities, organizations, and the Ummah.'

export const CORE_VALUES = [
  { title: 'Educational Excellence', desc: 'Highest standards in teaching, training, learning, and research.' },
  { title: 'Student-Centered Approach', desc: 'Placing learners at the heart of every experience.' },
  { title: 'Service to Humanity', desc: 'Beneficial knowledge, ethical guidance, and community development.' },
  { title: 'Lifelong Learning', desc: 'Continuous personal, professional, and spiritual growth.' },
  { title: 'Respect & Dignity', desc: 'Mutual respect, compassion, and professionalism in all interactions.' },
  { title: 'Diversity & Inclusion', desc: 'Valuing diverse perspectives and fostering unity.' },
  { title: 'Entrepreneurship & Innovation', desc: 'Creativity and entrepreneurial thinking for future challenges.' },
  { title: 'Partnership & Collaboration', desc: 'Strong partnerships with institutions and communities.' },
  { title: 'Sustainability & Responsibility', desc: 'Responsible leadership and long-term positive contributions.' },
  { title: 'Integrity & Transparency', desc: 'Honesty, accountability, and Islamic ethical principles in all operations.' },
]

// ─── Complete service portfolio (profile page 7) ─────────────
export const SERVICES = [
  {
    title: 'Banking & Finance Training',
    desc: 'Specialized programs for banking professionals covering Islamic finance, risk, and operations.',
    icon: 'Landmark',
  },
  {
    title: 'Customized Corporate Training',
    desc: 'Tailored in-house training solutions designed for organizations and corporate teams.',
    icon: 'Building2',
  },
  {
    title: 'Research, Surveys & Gap Analysis',
    desc: 'Evidence-based research and analytical services for institutions and businesses.',
    icon: 'LineChart',
  },
  {
    title: 'Business & Shariah Consultancy',
    desc: 'Strategic advisory for businesses seeking ethical and Shariah-compliant growth.',
    icon: 'Briefcase',
  },
  {
    title: 'Virtual & Distance Learning',
    desc: 'Online courses accessible globally for professionals, students, and overseas Muslims.',
    icon: 'MonitorPlay',
  },
  {
    title: 'Online Dar-ul-Ifta Services',
    desc: 'Authentic Islamic rulings on personal, financial, and contemporary matters.',
    icon: 'Scale',
  },
  {
    title: 'Seminars & Professional Workshops',
    desc: 'Structured events for knowledge sharing, networking, and skill development.',
    icon: 'Presentation',
  },
  {
    title: 'Leadership & Capacity Building',
    desc: 'Programs developing future leaders across public and private sectors.',
    icon: 'Users',
  },
  {
    title: 'Career Grooming & Skill Enhancement',
    desc: 'Practical career guidance and professional skill building initiatives.',
    icon: 'GraduationCap',
  },
  {
    title: 'Halal Food Advisory & Certification',
    desc: 'Halal compliance, food safety systems, and certification support.',
    icon: 'BadgeCheck',
  },
]

export const SERVED_AUDIENCES = [
  'Students',
  'Professionals',
  'Entrepreneurs',
  'Corporate Teams',
  'Public & Private Institutions',
]

// ─── Training & workshops (profile page 8) ───────────────────
export const TRAINING_INTRO =
  "Hidayat's training and workshop programs bridge the gap between theory and practice through interactive learning, industry-focused methodologies, and Islamic ethical principles. We deliver result-oriented, skill-based training for individuals and organizations."

export const TRAINING_AREAS = [
  'Islamic Studies & Contemporary Issues',
  'Islamic Banking, Takaful & Finance',
  'Research Methodology & Academic Writing',
  'Shariah Compliance & Advisory Training',
  'Food Safety & Halal Assurance Systems',
  'Insurance & Risk Management',
  'Self-Management & Personal Development',
  'Corporate Skill Enhancement Programs',
  'Entrepreneurship & Business Development',
  'Leadership & Organizational Development',
]

export const TRAINING_METHODOLOGY = [
  'Interactive sessions led by industry experts and Islamic scholars',
  'Real-world case studies and hands-on practical exercises',
  'Customized in-house programs tailored to organizational needs',
  'Seminars, workshops, and conferences for ongoing development',
  'Online and hybrid learning formats for maximum accessibility',
  'Islamic ethical principles integrated throughout all programs',
]

// ─── Expert trainers (profile pages 9–10) ────────────────────
export const TRAINER_GROUPS = [
  {
    category: 'Islamic Studies',
    members: [
      {
        name: 'Dr. Molana Khalil Ahmad Thanvi',
        credentials: 'PhD — University of Karachi · Muhaddith, Jamia Darul Uloom Islamia Lahore',
        bio: 'Author of 20+ books. Expert in Islamic banking, Shariah advisory, and financial engineering.',
      },
      {
        name: 'Dr. Muhammad Saad Siddiqui',
        credentials: 'PhD — University of Punjab · Post Doctorate — Malaysia · Professor & Chairman, Islamic Studies Dept.',
        bio: '25+ years in academia. Supervised numerous M.Phil. & PhD theses. Multiple publications.',
      },
      {
        name: 'Mufti Muhammad Akram',
        credentials: 'Dars-e-Nizami · Takhassus fil Fiqh — Jamia Darul Uloom Islamia Lahore',
        bio: 'Expert in Islamic auditing, financial evaluation, and management systems.',
      },
      {
        name: 'Hafiz Muhammad Ibrahim Salik',
        credentials: 'Dars-e-Nizami · M.Phil. (ongoing) UMT Lahore · Researcher, Idara Ashraf-ul-Tehqiq',
        bio: 'Specialist in Hadith studies, Islamic organizational management, and personal development.',
      },
    ],
  },
  {
    category: 'Research & Self-Help',
    members: [
      {
        name: 'Ms. Hafsa Siddiqui',
        credentials: 'M.Phil. in Management Sciences, University of the Punjab',
        bio: 'Expert in academic writing, HR, business management, and research methodology.',
      },
      {
        name: 'Muhammad Mudassir',
        credentials: 'Scholar with a background in Computer Science & Islamic Studies',
        bio: 'Specialist in self-management, productivity, networking, and personal growth training.',
      },
    ],
  },
  {
    category: 'Islamic Banking, Takaful & Finance',
    members: [
      {
        name: 'Mufti Muhammad Nadeem Ahmad',
        credentials: 'Darul Uloom Karachi · Jamia Darul Uloom Islamia Lahore',
        bio: 'Specialist in Islamic banking, Takaful applications, and Shariah-compliant financial products.',
      },
      {
        name: 'Dr. Mufti Munib Siddiqui',
        credentials: 'Dars-e-Nizami · MBA · PhD in Management · Multiple Islamic finance certifications',
        bio: 'Head of Research & Trainings, Hidayat. Expert in Shariah advisory, research, and strategic consultancy.',
      },
    ],
  },
  {
    category: 'Food Safety & Halal Assurance',
    members: [
      {
        name: 'Dr. Muhammad Ashraf Ali Farooqui',
        credentials: 'Genetic Modification & Halal Food · Jamia Darul Uloom Islamia Lahore',
        bio: 'Expert in Halal certification, food processing, slaughtering systems, and Halal industry research.',
      },
      {
        name: 'Dr. M. Asif Iftikhar Siddiqui',
        credentials: 'PhD — Dairy Technology, UVAS · 35+ years industry experience',
        bio: 'Expert in ISO standards, HACCP, FSSC auditing, and Halal food quality management systems.',
      },
    ],
  },
  {
    category: 'Insurance, Risk & Entrepreneurship',
    members: [
      {
        name: 'Mr. Tassawar Abbas Jaffery',
        credentials: 'MBA — Hailey College · VP Operations, Century Insurance',
        bio: '15+ years in multinational & local insurance. Author of research articles and industry reports.',
      },
      {
        name: 'Mr. Zulfiqar Ali Khan',
        credentials: 'ACII London · ARe USA · EVP, EFU General Insurance · Vice Chairman, Lahore Insurance Institute',
        bio: 'Expert in insurance, reinsurance, finance, and risk management.',
      },
      {
        name: 'Ms. Farkhanda Jabeen',
        credentials: 'Fellow — CII London · VP, EFU General Insurance · Founding Member, Hidayat',
        bio: 'Expert in underwriting, brokerage, risk management, and reinsurance operations.',
      },
      {
        name: 'Dr. Sheikh Usman Yousaf',
        credentials: 'PhD — Malaysia · MBA · Asst. Professor, Hailey College of Banking & Finance',
        bio: 'Expert in entrepreneurship, business development, leadership, and motivational training.',
      },
      {
        name: 'Mr. Tahir Iftikhar',
        credentials: 'Director, Hidayat · CEO, Atlantic Logistics',
        bio: 'Renowned entrepreneur with diversified experience in business management, logistics, and leadership.',
      },
    ],
  },
]

// ─── Distance learning (profile page 11) ─────────────────────
export const DISTANCE_LEARNING_INTRO =
  "Hidayat's online learning platform makes quality education and Islamic knowledge accessible to individuals worldwide. Students, professionals, and overseas Muslims can study flexibly without geographical barriers."

export const DISTANCE_LEARNING_FEATURES = [
  'Online specialized professional courses',
  'Flexible, self-paced learning system',
  'Islamic education for Muslims abroad',
  'Quran, Hadith & Islamic Studies online',
  'Expert-led interactive digital sessions',
  'Professional certification programs',
]

// ─── Online Dar-ul-Ifta (profile page 12) ────────────────────
export const IFTA_INTRO =
  "Hidayat's Online Dar-ul-Ifta provides authentic Islamic guidance and Shariah solutions for everyday matters. Qualified Muftis are available via our web portal for questions on worship, finance, family matters, business transactions, and contemporary issues."

export const IFTA_FEATURES = [
  'Direct online chat with qualified Muftis',
  'Guidance based on Qur\u2019an & Sunnah',
  'Halal practices and worship queries',
  'Family and personal matter guidance',
  'Quran, Hadith & Islamic Studies online',
  'Contemporary issues for Muslims globally',
]

// ─── Consultancy (profile page 12) ───────────────────────────
export const CONSULTANCY_INTRO =
  "Hidayat provides professional consultancy across Food, Finance, Business Development, and Shariah Compliance. Our team develops practical, result-oriented solutions tailored to each client's unique requirements."

export const CONSULTANCY_SERVICES = [
  'Halal Food Processing & Certification',
  'Islamic Banking & Finance Advisory',
  'Takaful & Risk Management',
  'Business Process Improvement',
  'Organizational Development',
  'Research & Gap Analysis',
  'Shariah Compliance & Advisory',
  'Operational Efficiency & Strategic Planning',
]

export const CONSULTANCY_CLOSING =
  'Hidayat Consulting integrates proven methodologies, industry expertise, and Shariah-compliant practices to help organizations achieve sustainable, ethical growth.'

// ─── Events (profile pages 13–14) ────────────────────────────
export const EVENTS_INTRO =
  'Hidayat actively conducts events, workshops, seminars, and ceremonies that reflect its commitment to professional development and community engagement.'

export const EVENTS = [
  {
    name: 'Professional Workshops 2020',
    description: 'Multi-day workshops with expert trainers and scholars for professionals.',
    focus: 'Finance, Islamic Studies, Leadership',
  },
  {
    name: 'Diploma Ceremony 2022',
    description: 'Certificate and diploma distribution for program graduates and achievers.',
    focus: 'Education, Recognition, Motivation',
  },
  {
    name: 'Darul Uloom Islamia Collaboration',
    description: 'Joint events and collaborative programs with Jamia Darul Uloom Islamia.',
    focus: 'Islamic Studies, Research, Scholarship',
  },
  {
    name: 'Corporate Training Sessions',
    description: 'Customized in-house training delivered for public and private organizations.',
    focus: 'Corporate Development, Skill Building',
  },
  {
    name: 'Seminars & Conferences',
    description: 'National seminars on Islamic finance, Halal, and professional development.',
    focus: 'Finance, Halal, Research',
  },
]

// Event highlight gallery — images already shipped in /public/gallery
export const EVENT_GALLERY = [
  { src: '/gallery/Workshop-Nov.-2017-Highlights-006.webp', caption: 'Workshop 2017' },
  { src: '/gallery/Workshop-Nov.-2017-Highlights-008.webp', caption: 'Workshop Participants' },
  { src: '/gallery/IMG-20181213-WA0023.webp', caption: 'Workshop 2019' },
  { src: '/gallery/IMG-20181223-WA0019.webp', caption: 'Diploma Students' },
  { src: '/gallery/IMG-20181223-WA0022.webp', caption: 'Diploma 2022' },
  { src: '/gallery/20230520_194340.webp', caption: 'Seminar Session' },
  { src: '/gallery/PicsArt_10-08-09.25.32.webp', caption: 'Certificate Distribution' },
]
