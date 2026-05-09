import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from './RoleProvider'
import PublicTopNav from './PublicTopNav'
import Logo from './Logo'

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>
}

// ─── Door Opening Overlay ────
// This sits ON TOP of the entire page. As user scrolls, doors open
// and the overlay fades away revealing the website beneath.
function DoorOverlay({ scrollProgress }) {
  // Image transitions:
  // 0.0 - 0.25: closed door
  // 0.25 - 0.45: crossfade closed → semi-open
  // 0.45 - 0.6: semi-open
  // 0.6 - 0.78: crossfade semi-open → open
  // 0.78 - 0.88: open door visible
  // 0.88 - 1.0: entire overlay fades out

  const getClosedOpacity = () => {
    if (scrollProgress <= 0.25) return 1
    if (scrollProgress <= 0.45) return 1 - (scrollProgress - 0.25) / 0.2
    return 0
  }

  const getSemiOpenOpacity = () => {
    if (scrollProgress <= 0.25) return 0
    if (scrollProgress <= 0.45) return (scrollProgress - 0.25) / 0.2
    if (scrollProgress <= 0.6) return 1
    if (scrollProgress <= 0.78) return 1 - (scrollProgress - 0.6) / 0.18
    return 0
  }

  const getOpenOpacity = () => {
    if (scrollProgress <= 0.6) return 0
    if (scrollProgress <= 0.78) return (scrollProgress - 0.6) / 0.18
    return 1
  }

  // The entire overlay fades out at the end
  const getOverlayOpacity = () => {
    if (scrollProgress <= 0.82) return 1
    if (scrollProgress >= 1) return 0
    return 1 - (scrollProgress - 0.82) / 0.18
  }

  // Scale up the open door slightly for a "zoom through" feel
  const getScale = () => {
    if (scrollProgress <= 0.78) return 1
    return 1 + (scrollProgress - 0.78) * 1.5
  }

  // Golden glow behind doors
  const getGlowOpacity = () => {
    if (scrollProgress <= 0.25) return 0
    if (scrollProgress <= 0.6) return (scrollProgress - 0.25) * 2
    return 0.7
  }

  // Don't render at all once fully faded
  if (scrollProgress >= 1) return null

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ opacity: getOverlayOpacity() }}
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#080808]">
        {/* Golden glow behind doors */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: getGlowOpacity() }}
        >
          <div className="w-[500px] h-[700px] rounded-full bg-gradient-radial from-amber-200/40 via-amber-100/15 to-transparent blur-3xl" />
        </div>

        {/* Closed door */}
        <img
          src="/assets/closed.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: getClosedOpacity() }}
          draggable={false}
        />

        {/* Semi-open door */}
        <img
          src="/assets/semi-open.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: getSemiOpenOpacity() }}
          draggable={false}
        />

        {/* Fully open door */}
        <img
          src="/assets/open.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            opacity: getOpenOpacity(),
            transform: `scale(${getScale()})`,
          }}
          draggable={false}
        />
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/70"
        style={{ opacity: scrollProgress < 0.08 ? 1 - scrollProgress * 12 : 0 }}
      >
        <span className="text-xl font-serif tracking-widest">Scroll to Enter</span>
        <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  const { role } = useRole()
  return (
    <section className="relative min-h-[50vh] lg:min-h-[600px] flex items-center overflow-hidden bg-white pt-2 sm:pt-4">

  {/* LEFT HALF LOGO WATERMARK */}
  <div className="absolute top-[15%] left-0 h-[80%] w-[45%] overflow-hidden pointer-events-none z-0">
    <img
      src="/assets/LOGO_HIDAYAT.png"
      alt="Hidayat Logo"
      className="h-full w-auto object-contain opacity-[0.25] scale-[1.5] -translate-x-[15%]"
    />
  </div>

  {/* BACKGROUND RADIAL EFFECT */}
  <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/30 via-transparent to-transparent" />
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 py-12 lg:py-0">

    {/* LEFT CONTENT */}
    <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left">
      <div className="inline-flex items-center space-x-2 bg-secondary/10 text-primary px-3 sm:px-4 py-1 rounded-full border border-secondary/20">
        <Icon name="menu_book" className="text-[16px] sm:text-[18px]" />
        <span className="text-[10px] sm:text-label-sm font-bold tracking-wider">
          ENROLLMENT OPEN 2024
        </span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl lg:text-headline-xl text-primary leading-tight">
        Cultivating Spiritual Clarity &{" "}
        <span className="text-secondary italic">Scholarly Excellence</span>
      </h1>

      <p className="text-base sm:text-body-lg text-slate-500 max-w-xl mx-auto lg:mx-0">
        A modern sanctuary for traditional Islamic sciences. Bridging authentic
        heritage with contemporary intellectual rigor for seekers of truth worldwide.
      </p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
        <button
          onClick={() => navigate(role ? "/short-courses" : "/login")}
          className="bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-label-lg flex items-center justify-center space-x-3 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
        >
          <span>Explore Courses</span>
          <Icon name="arrow_forward" />
        </button>

        <button
          onClick={() => navigate("/darul-ifta")}
          className="border-2 border-secondary text-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-label-lg flex items-center justify-center space-x-3 hover:bg-secondary/10 transition-all"
        >
          <span>Darul Ifta</span>
        </button>
      </div>
    </div>

    {/* RIGHT DECORATIVE CARD */}
    <div className="hidden lg:block lg:col-span-6 relative">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-outline bg-primary aspect-[4/3]">

        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVyIumR3cEwDm2nAkUwl9GiaqyYdFPZXH5ngcwRNI3P6DwEPdNH8dVXFIc1atFf9dKXuEDggXaSAU5fPhDMJcA7Amr4_QoAD6GD5ye3R8Y3_KM9Ec2T_kG-niClN5__EKORM8wMF15m9R_7ZviZPVLMonZOzHeMD1Jls1QqxTE2DKm519SRQxcEX7iJpuGVIpoZkifTUESDQYPTh5UxJThKoMjiQu9yCl5Nowa9kUYqaugENuMeFvgGeuj628lf9kh37ddmuOLIng"
          alt="Islamic scholarship"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-primary/10" />

        <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
              <Icon name="history_edu" className="text-white" />
            </div>
            <div>
              <p className="font-serif text-white text-lg font-semibold">
                Traditional Wisdom
              </p>
              <p className="text-label-sm text-white/80">
                Reviving the legacy of Islamic scholarship
              </p>
            </div>
          </div>
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
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl sm:text-headline-lg text-primary mb-3 sm:mb-4">A Vision Rooted in Tradition</h2>
            <p className="text-sm sm:text-body-lg text-slate-500">HIDAYAT is committed to producing scholars who are deeply grounded in the Qur'an and Sunnah while equipped to address the complexities of the 21st century.</p>
          </div>
          <div className="h-px flex-grow bg-outline mx-8 hidden md:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {cards.map(({ icon, title, desc, color }) => (
            <div key={title} className="p-6 sm:p-8 rounded-2xl bg-white border border-outline hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6 transition-colors ${
                color === 'primary' ? 'bg-primary/10 group-hover:bg-primary' :
                color === 'secondary' ? 'bg-secondary/10 group-hover:bg-secondary' :
                'bg-slate-100 group-hover:bg-primary'
              }`}>
                <Icon name={icon} className={`text-2xl sm:text-3xl transition-colors ${
                  color === 'primary' ? 'text-primary group-hover:text-white' :
                  color === 'secondary' ? 'text-secondary group-hover:text-white' :
                  'text-slate-500 group-hover:text-white'
                }`} />
              </div>
              <h3 className="font-serif text-lg sm:text-headline-md text-primary mb-2 sm:mb-4">{title}</h3>
              <p className="text-sm sm:text-body-md text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Courses Bento Grid ─────────────────────────────
function Courses() {
  return (
    <section id="programs" className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <span className="text-[10px] sm:text-label-sm text-secondary tracking-[0.3em] uppercase font-bold">Academic Paths</span>
          <h2 className="font-serif text-2xl sm:text-headline-lg text-primary mt-2">Discover Our Curriculum</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="sm:col-span-2 lg:col-span-7 group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-primary shadow-2xl h-[280px] sm:h-[400px]">
            <div className="absolute inset-0 pattern-overlay opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
            <div className="relative h-full p-6 sm:p-10 flex flex-col justify-end max-w-lg">
              <span className="bg-secondary text-white px-3 py-1 rounded-md text-[10px] sm:text-xs font-label-lg w-fit mb-3 sm:mb-4">8 YEAR PROGRAM</span>
              <h3 className="font-serif text-xl sm:text-headline-lg text-white mb-2 sm:mb-4">Darse Nizami (Alim Course)</h3>
              <p className="text-background text-sm sm:text-body-md mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-none">Comprehensive study of Arabic linguistics, Fiqh, Usul, Hadith, and Tafsir.</p>
              <button className="text-white font-label-lg flex items-center space-x-2 group-hover:translate-x-2 transition-transform">
                <span>Learn More</span>
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 bg-background rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-outline flex flex-col h-auto sm:h-[400px]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 sm:mb-6">
              <Icon name="auto_stories" className="text-secondary text-2xl sm:text-3xl" />
            </div>
            <h3 className="font-serif text-lg sm:text-headline-md text-primary mb-2 sm:mb-3">Hifz-ul-Qur'an</h3>
            <p className="text-sm sm:text-body-md text-slate-500 mb-4 sm:mb-auto leading-relaxed">Dedicated environment for the memorization of the Holy Qur'an with focus on Tajweed.</p>
            <div className="pt-4 sm:pt-6 border-t border-outline mt-4 sm:mt-6 flex justify-between items-center">
              <span className="text-label-sm font-bold text-primary">Limited Seats</span>
              <a href="#" className="text-secondary font-label-lg underline underline-offset-4">Enroll Now</a>
            </div>
          </div>
          {[
            { icon: 'history_edu', title: 'Arabic Language', desc: 'Master classical Arabic grammar and morphology.', badge: '3 Months' },
            { icon: 'balance', title: 'Islamic Finance', desc: 'Modern financial transactions according to Shari\'ah.', badge: 'Weekend' },
            { icon: 'lightbulb', title: 'Foundations of Belief', desc: 'Strengthening the Aqeedah of Ahlus-Sunnah.', badge: 'Open Now' },
          ].map(({ icon, title, desc, badge }) => (
            <div key={title} className="lg:col-span-4 bg-white border border-outline rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-background transition-colors">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <Icon name={icon} className="text-primary text-3xl sm:text-4xl" />
                <span className="text-[10px] sm:text-label-sm px-2 py-1 bg-background rounded text-primary font-bold">{badge}</span>
              </div>
              <h3 className="font-serif text-lg sm:text-headline-md text-primary mb-2 sm:mb-3">{title}</h3>
              <p className="text-sm sm:text-body-md text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Darul Ifta / Fatwas Section ─────────────────────────────
function FatwaSection() {
  const navigate = useNavigate()
  const fatwas = [
    { cat: 'Zakat & Wealth', date: 'Oct 24, 2024', title: 'Ruling on Zakat for Long-term Retirement Investments', desc: 'The question pertains to the calculation of Zakat on modern retirement accounts...' },
    { cat: 'Modern Ethics', date: 'Oct 20, 2024', title: 'Artificial Intelligence and Copyright: A Shari\'ah Perspective', desc: 'Navigating the complexities of intellectual property in the age of generative AI...' },
    { cat: 'Family Law', date: 'Oct 15, 2024', title: 'The Status of Electronic Signatures in Nikah Contracts', desc: 'An analysis of modern digital authentication methods and their validity...' },
  ]
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4 sm:space-y-6 text-center lg:text-left">
              <span className="text-label-sm text-secondary tracking-widest uppercase font-bold">Darul Ifta Guidance</span>
              <h2 className="font-serif text-2xl sm:text-headline-lg text-primary">Recent Legal Rulings & Queries</h2>
              <p className="text-sm sm:text-body-md text-slate-500 leading-relaxed max-w-md mx-auto lg:mx-0">
                Our Darul Ifta provides scholarly answers to your personal and communal questions.
              </p>
              <button onClick={() => navigate('/darul-ifta')}
                className="bg-primary text-white px-6 sm:px-8 py-3 rounded-lg font-serif font-medium hover:opacity-90 transition-all">
                Submit a Question
              </button>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {fatwas.map(({ cat, date, title, desc }) => (
              <div key={title} onClick={() => navigate('/darul-ifta')}
                className="bg-white p-5 sm:p-8 rounded-2xl border border-outline shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                  <span className="text-[10px] sm:text-label-sm text-primary bg-background px-3 py-1 rounded font-bold">{cat}</span>
                  <span className="text-[10px] sm:text-label-sm text-slate-400">{date}</span>
                </div>
                <h4 className="font-serif text-lg sm:text-headline-md text-primary mb-2 sm:mb-3 group-hover:text-secondary transition-colors">{title}</h4>
                <p className="text-sm sm:text-body-md text-slate-500 line-clamp-2">{desc}</p>
                <div className="mt-3 sm:mt-4 flex items-center text-primary font-label-lg text-xs sm:text-sm">
                  <Icon name="verified" className="mr-2 text-[18px]" />
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
  return (
    <section className="py-16 sm:py-24 bg-primary text-white relative overflow-hidden">
      <div className="absolute inset-0 pattern-overlay opacity-20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-headline-lg mb-4 sm:mb-6">Join Our Global Scholarly Community</h2>
          <p className="text-sm sm:text-body-lg text-white/80 mb-8 sm:mb-10">Subscribe to receive monthly insights, newly published Fatwas, and updates on our upcoming short courses.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input className="flex-grow bg-white/10 border border-white/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-secondary text-sm" placeholder="Your email address" type="email" />
            <button className="bg-secondary text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-label-lg hover:bg-white hover:text-primary transition-colors">Subscribe</button>
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 px-4 sm:px-8 py-10 sm:py-16 max-w-7xl mx-auto">
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <Logo size="md" className="mb-4" />
          <p className="font-sans text-xs sm:text-sm leading-relaxed text-slate-600">Dedicated to the preservation and dissemination of classical Islamic sciences.</p>
        </div>
        <div>
          <h4 className="font-serif text-primary font-bold text-base sm:text-lg mb-4 sm:mb-6">Programs</h4>
          <ul className="space-y-2 sm:space-y-4">
            {['Darse Nizami', 'Hifz & Nazrah', 'Short Courses', 'Darul Ifta'].map(l => (
              <li key={l}><a href="#" className="font-sans text-xs sm:text-sm text-slate-500 hover:text-primary transition-all">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-primary font-bold text-base sm:text-lg mb-4 sm:mb-6">Resources</h4>
          <ul className="space-y-2 sm:space-y-4">
            {['Research Journal', 'Fatwa Archive', 'Student Portal', 'Library'].map(l => (
              <li key={l}><a href="#" className="font-sans text-xs sm:text-sm text-slate-500 hover:text-primary transition-all">{l}</a></li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="font-serif text-primary font-bold text-base sm:text-lg mb-4 sm:mb-6">Contact</h4>
          <ul className="space-y-2 sm:space-y-4">
            <li className="flex items-start space-x-3 text-slate-500">
              <Icon name="location_on" className="text-[16px] sm:text-[18px] mt-0.5" />
              <span className="font-sans text-xs sm:text-sm">12 Scholars Row, Educational District</span>
            </li>
            <li className="flex items-center space-x-3 text-slate-500">
              <Icon name="mail" className="text-[16px] sm:text-[18px]" />
              <span className="font-sans text-xs sm:text-sm">info@hidayat.edu</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full py-6 sm:py-8 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto border-t border-outline gap-4">
        <p className="font-sans text-xs sm:text-sm text-slate-500 text-center sm:text-left">© {new Date().getFullYear()} HIDAYAT Academy. Preserving Sacred Tradition.</p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(l => (
            <a key={l} href="#" className="text-slate-500 hover:text-primary font-sans text-xs sm:text-sm transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Page Assembly ───────────────────────────────────────────
export default function HomePage() {
  const { role } = useRole()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [animationDone, setAnimationDone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollSectionRef = useRef(null)

  // Detect mobile — skip animation on touch devices or small screens
  useEffect(() => {
    const checkMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isNarrow = window.innerWidth < 1024
      setIsMobile(isTouch || isNarrow)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Skip animation if already seen this session or user is logged in
  useEffect(() => {
    if (sessionStorage.getItem('doorAnimationSeen') || role) {
      setAnimationDone(true)
    }
  }, [role])

  useEffect(() => {
    if (isMobile || animationDone) return // Skip on mobile
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (scrollSectionRef.current) {
            const sectionHeight = scrollSectionRef.current.offsetHeight
            const viewportHeight = window.innerHeight
            const scrolled = window.scrollY
            const totalScrollable = sectionHeight - viewportHeight
            const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1)
            setScrollProgress(progress)
            if (progress >= 1) {
              setAnimationDone(true)
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, animationDone])

  // Navbar opacity — hidden during animation, fades in at the end
  const showAnimation = !isMobile && !animationDone
  const navbarOpacity = showAnimation
    ? (scrollProgress >= 0.85 ? Math.min((scrollProgress - 0.85) / 0.15, 1) : 0)
    : 1

  // Once animation is done, scroll to top and show normal page
  useEffect(() => {
    if (animationDone) {
      sessionStorage.setItem('doorAnimationSeen', 'true')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [animationDone])

  return (
    <div className="font-sans scroll-smooth bg-background text-slate-800 selection:bg-secondary selection:text-white">
      {/* Door animation phase — desktop only */}
      {showAnimation && (
        <>
          <div ref={scrollSectionRef} style={{ height: '300vh' }}>
            <div className="sticky top-0">
              <div style={{ opacity: navbarOpacity }}>
                <PublicTopNav />
              </div>
              <div className="pt-[57px] sm:pt-[65px]">
                <Hero />
              </div>
            </div>
          </div>
          <DoorOverlay scrollProgress={scrollProgress} />
        </>
      )}

      {/* Normal page — shown on mobile always, or after animation on desktop */}
      {!showAnimation && (
        <>
          <PublicTopNav />
          <div className="pt-[57px] sm:pt-[65px]">
            <Hero />
          </div>
        </>
      )}

      <Vision />
      <Courses />
      <FatwaSection />
      <Newsletter />
      <Footer />
    </div>
  )
}
