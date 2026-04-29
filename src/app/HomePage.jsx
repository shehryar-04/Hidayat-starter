import { useNavigate } from 'react-router-dom'
import { useRole } from './RoleProvider'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

// ─── Shared TopNav ───────────────────────────────────────────
function TopNav() {
  const navigate = useNavigate()
  const { role } = useRole()

  const handleCurriculumClick = (e) => {
    e.preventDefault()
    navigate(role ? '/short-courses' : '/login')
  }

  const links = [
    { label: 'Home', href: '#', active: true },
    { label: 'Darse Nizami', href: '#programs' },
    { label: 'Hifz & Nazrah', href: '#programs' },
    { label: 'Short Courses', href: '#', onClick: handleCurriculumClick },
    { label: 'Darul Ifta', href: '/darul-ifta' },
    { label: 'Research Center', href: '#' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-outline bg-background/95 backdrop-blur-md">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-serif font-bold text-primary">HIDAYAT</div>
        <div className="hidden md:flex items-center space-x-8">
          {links.map(({ label, href, active, onClick }) => (
            <a key={label} href={href} onClick={onClick}
              className={`font-serif font-medium text-sm cursor-pointer transition-colors ${
                active ? 'text-primary border-b-2 border-primary pb-1 font-bold' : 'text-slate-600 hover:text-primary'
              }`}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <Icon name="search" className="text-slate-500 cursor-pointer hover:text-primary transition-colors hidden lg:block" />
          <button onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-lg font-serif font-medium hover:opacity-90 transition-all active:scale-95">
            Student Login
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative min-h-[820px] flex items-center overflow-hidden bg-white pt-20">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/30 via-transparent to-transparent" />
      </div>
      <div className="max-w-7xl mx-auto px-8 w-full grid grid-cols-12 gap-8 items-center relative z-10">
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-secondary/10 text-primary px-4 py-1 rounded-full border border-secondary/20">
            <Icon name="menu_book" className="text-[18px]" />
            <span className="text-label-sm font-bold tracking-wider">ENROLLMENT OPEN 2024</span>
          </div>
          <h1 className="font-serif text-headline-xl text-primary leading-tight">
            Cultivating Spiritual Clarity & <span className="text-secondary italic">Scholarly Excellence</span>
          </h1>
          <p className="text-body-lg text-slate-500 max-w-xl">
            A modern sanctuary for traditional Islamic sciences. Bridging authentic heritage with contemporary intellectual rigor for seekers of truth worldwide.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={() => navigate(('/login'))}
              className="bg-primary text-white px-8 py-4 rounded-xl font-label-lg flex items-center space-x-3 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all">
              <span>Explore Courses</span>
              <Icon name="arrow_forward" />
            </button>
            <button onClick={() => navigate('/darul-ifta')}
              className="border-2 border-secondary text-secondary px-8 py-4 rounded-xl font-label-lg flex items-center space-x-3 hover:bg-secondary/10 transition-all">
              <span>Darul Ifta</span>
            </button>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 relative mt-12 lg:mt-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-outline bg-primary aspect-[4/3]">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20" />
            <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Icon name="history_edu" className="text-white" />
                </div>
                <div>
                  <p className="font-serif text-white text-lg font-semibold">Traditional Wisdom</p>
                  <p className="text-label-sm text-white/80">Reviving the legacy of Islamic scholarship</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary/10 rounded-full flex items-center justify-center p-8 border border-secondary/30">
            <div className="text-center">
              <Icon name="token" className="text-secondary text-6xl" />
              <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mt-2">Ihsan</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Vision Section ──────────────────────────────────────────
function Vision() {
  const cards = [
    { icon: 'school', title: 'Academic Rigor', desc: 'Systematic study of Darse Nizami using authentic texts and classical methodologies of interpretation.', color: 'primary' },
    { icon: 'psychology', title: 'Intellectual Clarity', desc: 'Fostering critical thinking through the lens of divine revelation to navigate modern ethical dilemmas.', color: 'secondary' },
    { icon: 'self_improvement', title: 'Spiritual Tarbiyah', desc: 'Focusing on Tazkiyah (purification) of the heart and the embodiment of prophetic character.', color: 'slate' },
  ]
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-serif text-headline-lg text-primary mb-4">A Vision Rooted in Tradition</h2>
            <p className="text-body-lg text-slate-500">HIDAYAT is committed to producing scholars who are deeply grounded in the Qur'an and Sunnah while equipped to address the complexities of the 21st century.</p>
          </div>
          <div className="h-px flex-grow bg-outline mx-8 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map(({ icon, title, desc, color }) => (
            <div key={title} className="p-8 rounded-2xl bg-white border border-outline hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                color === 'primary' ? 'bg-primary/10 group-hover:bg-primary' :
                color === 'secondary' ? 'bg-secondary/10 group-hover:bg-secondary' :
                'bg-slate-100 group-hover:bg-primary'
              }`}>
                <Icon name={icon} className={`text-3xl transition-colors ${
                  color === 'primary' ? 'text-primary group-hover:text-white' :
                  color === 'secondary' ? 'text-secondary group-hover:text-white' :
                  'text-slate-500 group-hover:text-white'
                }`} />
              </div>
              <h3 className="font-serif text-headline-md text-primary mb-4">{title}</h3>
              <p className="text-body-md text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Courses Bento Grid ─────────────────────────────
function Courses() {
  const navigate = useNavigate()
  return (
    <section id="programs" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <span className="text-label-sm text-secondary tracking-[0.3em] uppercase font-bold">Academic Paths</span>
          <h2 className="font-serif text-headline-lg text-primary mt-2">Discover Our Curriculum</h2>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* Large featured card */}
          <div className="col-span-12 lg:col-span-7 group relative rounded-3xl overflow-hidden bg-primary shadow-2xl h-[400px]">
            <div className="absolute inset-0 pattern-overlay opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
            <div className="relative h-full p-10 flex flex-col justify-end max-w-lg">
              <span className="bg-secondary text-white px-3 py-1 rounded-md text-xs font-label-lg w-fit mb-4">8 YEAR PROGRAM</span>
              <h3 className="font-serif text-headline-lg text-white mb-4">Darse Nizami (Alim Course)</h3>
              <p className="text-background text-body-md mb-8">Comprehensive study of Arabic linguistics, Fiqh, Usul, Hadith, and Tafsir following the classical curriculum.</p>
              <button className="text-white font-label-lg flex items-center space-x-2 group-hover:translate-x-2 transition-transform">
                <span>Learn More</span>
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
          {/* Hifz card */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-background rounded-3xl p-8 border border-outline flex flex-col h-[400px]">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <Icon name="auto_stories" className="text-secondary text-3xl" />
            </div>
            <h3 className="font-serif text-headline-md text-primary mb-3">Hifz-ul-Qur'an</h3>
            <p className="text-body-md text-slate-500 mb-auto leading-relaxed">Dedicated environment for the memorization of the Holy Qur'an with focus on Tajweed and correct articulation.</p>
            <div className="pt-6 border-t border-outline mt-6 flex justify-between items-center">
              <span className="text-label-sm font-bold text-primary">Limited Seats</span>
              <a href="#" className="text-secondary font-label-lg underline underline-offset-4">Enroll Now</a>
            </div>
          </div>
          {/* Small cards */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-outline rounded-3xl p-8 hover:bg-background transition-colors">
            <div className="flex justify-between items-start mb-6">
              <Icon name="history_edu" className="text-primary text-4xl" />
              <span className="text-label-sm px-2 py-1 bg-background rounded text-primary font-bold">3 Months</span>
            </div>
            <h3 className="font-serif text-headline-md text-primary mb-3">Arabic Language</h3>
            <p className="text-body-md text-slate-500">Master classical Arabic grammar and morphology for direct access to sacred texts.</p>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-outline rounded-3xl p-8 hover:bg-background transition-colors">
            <div className="flex justify-between items-start mb-6">
              <Icon name="balance" className="text-primary text-4xl" />
              <span className="text-label-sm px-2 py-1 bg-background rounded text-primary font-bold">Weekend</span>
            </div>
            <h3 className="font-serif text-headline-md text-primary mb-3">Islamic Finance</h3>
            <p className="text-body-md text-slate-500">A specialized course on modern financial transactions according to Shari'ah principles.</p>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-outline rounded-3xl p-8 hover:bg-background transition-colors">
            <div className="flex justify-between items-start mb-6">
              <Icon name="lightbulb" className="text-primary text-4xl" />
              <span className="text-label-sm px-2 py-1 bg-background rounded text-primary font-bold">Open Now</span>
            </div>
            <h3 className="font-serif text-headline-md text-primary mb-3">Foundations of Belief</h3>
            <p className="text-body-md text-slate-500">Strengthening the Aqeedah (creed) of Ahlus-Sunnah wal-Jama'ah for the common seeker.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Darul Ifta / Fatwas Section ─────────────────────────────
function FatwaSection() {
  const navigate = useNavigate()
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <span className="text-label-sm text-secondary tracking-widest uppercase font-bold">Darul Ifta Guidance</span>
              <h2 className="font-serif text-headline-lg text-primary">Recent Legal Rulings & Queries</h2>
              <p className="text-body-md text-slate-500 leading-relaxed">
                Our Darul Ifta provides scholarly answers to your personal and communal questions based on the Hanafi school of jurisprudence.
              </p>
              <button onClick={() => navigate('/darul-ifta')}
                className="bg-primary text-white px-8 py-3 rounded-lg font-serif font-medium hover:opacity-90 transition-all">
                Submit a Question
              </button>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            {[
              { cat: 'Zakat & Wealth', date: 'Oct 24, 2024', title: 'Ruling on Zakat for Long-term Retirement Investments', desc: 'The question pertains to the calculation of Zakat on modern retirement accounts where access is restricted until a certain age...' },
              { cat: 'Modern Ethics', date: 'Oct 20, 2024', title: 'Artificial Intelligence and Copyright: A Shari\'ah Perspective', desc: 'Navigating the complexities of intellectual property in the age of generative AI and its impact on the scholarly community...' },
              { cat: 'Family Law', date: 'Oct 15, 2024', title: 'The Status of Electronic Signatures in Nikah Contracts', desc: 'An analysis of modern digital authentication methods and their validity in formalizing Islamic marriage contracts...' },
            ].map(({ cat, date, title, desc }) => (
              <div key={title} onClick={() => navigate('/darul-ifta')}
                className="bg-white p-8 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-sm text-primary bg-background px-3 py-1 rounded font-bold">{cat}</span>
                  <span className="text-label-sm text-slate-400">{date}</span>
                </div>
                <h4 className="font-serif text-headline-md text-primary mb-3 group-hover:text-secondary transition-colors">{title}</h4>
                <p className="text-body-md text-slate-500 line-clamp-2">{desc}</p>
                <div className="mt-4 flex items-center text-primary font-label-lg">
                  <Icon name="verified" className="mr-2" />
                  <span>Mufti's Conclusion Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Newsletter CTA ──────────────────────────────────────────
function Newsletter() {
  const navigate = useNavigate()
  return (
    <section className="py-24 bg-primary text-white relative overflow-hidden">
      <div className="absolute inset-0 pattern-overlay opacity-20" />
      <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-headline-lg mb-6">Join Our Global Scholarly Community</h2>
          <p className="text-body-lg text-white/80 mb-10">Subscribe to receive monthly insights, newly published Fatwas, and updates on our upcoming short courses.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input className="flex-grow bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-secondary" placeholder="Your email address" type="email" />
            <button className="bg-secondary text-white px-10 py-4 rounded-xl font-label-lg hover:bg-white hover:text-primary transition-colors">Subscribe</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full border-t border-outline bg-background">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto">
        <div className="col-span-1">
          <span className="text-xl font-bold font-serif text-primary mb-4 block">HIDAYAT</span>
          <p className="font-sans text-sm leading-relaxed text-slate-600">Dedicated to the preservation and dissemination of classical Islamic sciences through modern pedagogy and intellectual rigor.</p>
        </div>
        <div>
          <h4 className="font-serif text-primary font-bold text-lg mb-6">Programs</h4>
          <ul className="space-y-4">
            {['Darse Nizami', 'Hifz & Nazrah', 'Short Courses', 'Darul Ifta'].map(l => (
              <li key={l}><a href="#" className="font-sans text-sm text-slate-500 hover:text-primary transition-all">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-primary font-bold text-lg mb-6">Resources</h4>
          <ul className="space-y-4">
            {['Research Journal', 'Fatwa Archive', 'Student Portal', 'Library'].map(l => (
              <li key={l}><a href="#" className="font-sans text-sm text-slate-500 hover:text-primary transition-all">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-primary font-bold text-lg mb-6">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3 text-slate-500">
              <Icon name="location_on" className="text-[18px]" />
              <span className="font-sans text-sm">12 Scholars Row, Educational District</span>
            </li>
            <li className="flex items-center space-x-3 text-slate-500">
              <Icon name="mail" className="text-[18px]" />
              <span className="font-sans text-sm">info@hidayat.edu</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto border-t border-outline">
        <p className="font-sans text-sm text-slate-500">© {new Date().getFullYear()} HIDAYAT Academy. Preserving Sacred Tradition.</p>
        <div className="flex space-x-8 mt-4 md:mt-0">
          {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(l => (
            <a key={l} href="#" className="text-slate-500 hover:text-primary font-sans text-sm transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Page Assembly ───────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="font-sans scroll-smooth bg-background text-slate-800 selection:bg-secondary selection:text-white">
      <TopNav />
      <Hero />
      <Vision />
      <Courses />
      <FatwaSection />
      <Newsletter />
      <Footer />
    </div>
  )
}
