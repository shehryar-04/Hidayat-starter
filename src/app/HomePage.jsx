import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRole } from './RoleProvider'
import PublicTopNav from './PublicTopNav'
import Logo from './Logo'
import FlashcardSlider from './FlashcardSlider'
import { Button, Input, cn } from '../shared/ui'
import {
  BookOpen,
  GraduationCap,
  Heart,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  History,
  Scale,
  Lightbulb,
  ChevronRight,
  MapPin,
  Mail,
  Verified,
} from 'lucide-react'

// ─── Door Opening Overlay ────
function DoorOverlay({ scrollProgress }) {
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

  const getOverlayOpacity = () => {
    if (scrollProgress <= 0.82) return 1
    if (scrollProgress >= 1) return 0
    return 1 - (scrollProgress - 0.82) / 0.18
  }

  const getScale = () => {
    if (scrollProgress <= 0.78) return 1
    return 1 + (scrollProgress - 0.78) * 1.5
  }

  const getGlowOpacity = () => {
    if (scrollProgress <= 0.25) return 0
    if (scrollProgress <= 0.6) return (scrollProgress - 0.25) * 2
    return 0.7
  }

  if (scrollProgress >= 1) return null

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ opacity: getOverlayOpacity() }}
    >
      <div className="absolute inset-0 bg-[#080808]">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: getGlowOpacity() }}
        >
          <div className="w-[500px] h-[700px] rounded-full bg-gradient-radial from-amber-200/40 via-amber-100/15 to-transparent blur-3xl" />
        </div>
        <img
          src="/assets/closed.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: getClosedOpacity() }}
          draggable={false}
        />
        <img
          src="/assets/semi-open.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: getSemiOpenOpacity() }}
          draggable={false}
        />
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
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/70"
        style={{ opacity: scrollProgress < 0.08 ? 1 - scrollProgress * 12 : 0 }}
      >
        <span className="text-xl font-display tracking-widest">Scroll to Enter</span>
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
      {/* Mobile background */}
      <div className="absolute inset-0 lg:hidden pointer-events-none z-0">
        <img src="/assets/open.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
      </div>

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
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-200/30 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 py-12 lg:py-0">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 sm:px-4 py-1 rounded-full border border-primary-200">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wider">
              ENROLLMENT OPEN 2024
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-neutral-900 leading-tight">
            Cultivating Spiritual Clarity &{" "}
            <span className="text-primary-500 italic">Scholarly Excellence</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto lg:mx-0">
            A modern sanctuary for traditional Islamic sciences. Bridging authentic
            heritage with contemporary intellectual rigor for seekers of truth worldwide.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(role ? "/short-courses" : "/login")}
              className="shadow-lg shadow-primary-500/20"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/darul-ifta")}
            >
              <span>Darul Ifta</span>
            </Button>
          </div>
        </div>

        {/* RIGHT DECORATIVE CARD */}
        <div className="hidden lg:block lg:col-span-6 relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/10 border border-neutral-200 bg-primary-800 aspect-[4/3]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVyIumR3cEwDm2nAkUwl9GiaqyYdFPZXH5ngcwRNI3P6DwEPdNH8dVXFIc1atFf9dKXuEDggXaSAU5fPhDMJcA7Amr4_QoAD6GD5ye3R8Y3_KM9Ec2T_kG-niClN5__EKORM8wMF15m9R_7ZviZPVLMonZOzHeMD1Jls1QqxTE2DKm519SRQxcEX7iJpuGVIpoZkifTUESDQYPTh5UxJThKoMjiQu9yCl5Nowa9kUYqaugENuMeFvgGeuj628lf9kh37ddmuOLIng"
              alt="Islamic scholarship"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 to-primary-900/10" />
            <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display text-white text-lg font-semibold">
                    Traditional Wisdom
                  </p>
                  <p className="text-sm text-white/80">
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
    { icon: GraduationCap, title: 'Academic Rigor', desc: 'Systematic study of Darse Nizami using authentic texts and classical methodologies of interpretation.', color: 'primary' },
    { icon: Lightbulb, title: 'Intellectual Clarity', desc: 'Fostering critical thinking through the lens of divine revelation to navigate modern ethical dilemmas.', color: 'primary' },
    { icon: Heart, title: 'Spiritual Tarbiyah', desc: 'Focusing on Tazkiyah (purification) of the heart and the embodiment of prophetic character.', color: 'primary' },
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0, 0, 0.2, 1],
      },
    },
  }

  return (
    <section className="py-16 sm:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 mb-3 sm:mb-4">A Vision Rooted in Tradition</h2>
            <p className="text-sm sm:text-lg text-neutral-500">HIDAYAT is committed to producing scholars who are deeply grounded in the Qur'an and Sunnah while equipped to address the complexities of the 21st century.</p>
          </div>
          <div className="h-px flex-grow bg-neutral-200 mx-8 hidden md:block" />
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {cards.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-4 sm:mb-6 bg-primary-50 group-hover:bg-primary-500 transition-colors duration-200">
                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500 group-hover:text-white transition-colors duration-200" />
              </div>
              <h3 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 mb-2 sm:mb-4">{title}</h3>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Upcoming Course Video Section ───────────────────────────
function UpcomingCourseVideo() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left — Video */}
          <div className="rounded-xl overflow-hidden shadow-lg border border-neutral-200 aspect-video">
            <iframe
              src="https://www.youtube.com/embed/7isIOkZx36E"
              title="Upcoming Course — Hidayat"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Right — Text */}
          <div className="space-y-5 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary-50 text-primary-600 rounded-full border border-primary-200">
              <PlayCircle className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase">Coming Soon</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 leading-tight">
              Our Upcoming Course
            </h2>
            <p className="text-sm sm:text-lg text-neutral-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              A new journey into the depths of Islamic knowledge. Stay tuned for our latest course designed to nurture both the mind and the soul with authentic scholarship.
            </p>
            <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-neutral-600">Expert scholars with decades of teaching experience</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-neutral-600">Structured curriculum rooted in classical texts</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base text-neutral-600">Certificate upon completion</span>
              </li>
            </ul>
          </div>
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
          <span className="text-[10px] sm:text-xs text-primary-500 tracking-[0.3em] uppercase font-bold">Academic Paths</span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 mt-2">Discover Our Curriculum</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main featured card */}
          <div className="sm:col-span-2 lg:col-span-7 group relative rounded-xl overflow-hidden bg-primary-800 border border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-[280px] sm:h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800/80 to-transparent" />
            <div className="relative h-full p-6 sm:p-10 flex flex-col justify-end max-w-lg">
              <span className="bg-primary-500 text-white px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold w-fit mb-3 sm:mb-4">8 YEAR PROGRAM</span>
              <h3 className="font-display font-bold text-xl sm:text-3xl text-white mb-2 sm:mb-4">Darse Nizami (Alim Course)</h3>
              <p className="text-white/80 text-sm sm:text-base mb-4 sm:mb-8 line-clamp-2 sm:line-clamp-none">Comprehensive study of Arabic linguistics, Fiqh, Usul, Hadith, and Tafsir.</p>
              <button className="text-white font-medium flex items-center space-x-2 group-hover:translate-x-2 transition-transform">
                <span>Learn More</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hifz card */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 sm:p-8 border border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col h-auto sm:h-[400px]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" />
            </div>
            <h3 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 mb-2 sm:mb-3">Hifz-ul-Qur'an</h3>
            <p className="text-sm sm:text-base text-neutral-500 mb-4 sm:mb-auto leading-relaxed">Dedicated environment for the memorization of the Holy Qur'an with focus on Tajweed.</p>
            <div className="pt-4 sm:pt-6 border-t border-neutral-200 mt-4 sm:mt-6 flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-900">Limited Seats</span>
              <a href="#" className="text-primary-500 font-medium text-sm underline underline-offset-4">Enroll Now</a>
            </div>
          </div>

          {/* Smaller course cards */}
          {[
            { icon: History, title: 'Arabic Language', desc: 'Master classical Arabic grammar and morphology.', badge: '3 Months' },
            { icon: Scale, title: 'Islamic Finance', desc: "Modern financial transactions according to Shari'ah.", badge: 'Weekend' },
            { icon: Lightbulb, title: 'Foundations of Belief', desc: 'Strengthening the Aqeedah of Ahlus-Sunnah.', badge: 'Open Now' },
          ].map(({ icon: Icon, title, desc, badge }) => (
            <div key={title} className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary-500" />
                <span className="text-[10px] sm:text-xs px-2 py-1 bg-neutral-50 rounded text-neutral-700 font-bold">{badge}</span>
              </div>
              <h3 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 mb-2 sm:mb-3">{title}</h3>
              <p className="text-sm sm:text-base text-neutral-500">{desc}</p>
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
    { cat: 'Modern Ethics', date: 'Oct 20, 2024', title: "Artificial Intelligence and Copyright: A Shari'ah Perspective", desc: 'Navigating the complexities of intellectual property in the age of generative AI...' },
    { cat: 'Family Law', date: 'Oct 15, 2024', title: 'The Status of Electronic Signatures in Nikah Contracts', desc: 'An analysis of modern digital authentication methods and their validity...' },
  ]
  return (
    <section className="py-16 sm:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4 sm:space-y-6 text-center lg:text-left">
              <span className="text-xs text-primary-500 tracking-widest uppercase font-bold">Darul Ifta Guidance</span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900">Recent Legal Rulings & Queries</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-md mx-auto lg:mx-0">
                Our Darul Ifta provides scholarly answers to your personal and communal questions.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/darul-ifta')}
              >
                Submit a Question
              </Button>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {fatwas.map(({ cat, date, title, desc }) => (
              <div
                key={title}
                onClick={() => navigate('/darul-ifta')}
                className="bg-white p-5 sm:p-8 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow duration-200 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                  <span className="text-[10px] sm:text-xs text-primary-700 bg-primary-50 px-3 py-1 rounded font-bold">{cat}</span>
                  <span className="text-[10px] sm:text-xs text-neutral-400">{date}</span>
                </div>
                <h4 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 mb-2 sm:mb-3 group-hover:text-primary-500 transition-colors">{title}</h4>
                <p className="text-sm sm:text-base text-neutral-500 line-clamp-2">{desc}</p>
                <div className="mt-3 sm:mt-4 flex items-center text-primary-600 font-medium text-xs sm:text-sm">
                  <Verified className="w-4 h-4 mr-2" />
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
    <section className="py-16 sm:py-24 bg-gradient-to-r from-primary-600 to-primary-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4 sm:mb-6">Join Our Global Scholarly Community</h2>
          <p className="text-sm sm:text-lg text-white/80 mb-8 sm:mb-10">Subscribe to receive monthly insights, newly published Fatwas, and updates on our upcoming short courses.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              className="flex-grow bg-white/10 border-white/20 rounded-lg px-4 sm:px-6 py-3 sm:py-4 h-auto text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/20"
              placeholder="Your email address"
              type="email"
            />
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-primary-700 hover:bg-white/90 hover:text-primary-800 shadow-lg"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}


// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 bg-neutral-50">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-6 px-4 sm:px-8 py-10 sm:py-16 max-w-7xl mx-auto">
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <Logo size="md" className="mb-4" />
          <p className="font-sans text-sm leading-relaxed text-neutral-500">Dedicated to the preservation and dissemination of classical Islamic sciences.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold text-neutral-900 text-base mb-4 sm:mb-6">Programs</h4>
          <ul className="space-y-3 sm:space-y-4">
            {['Darse Nizami', 'Hifz & Nazrah', 'Short Courses', 'Darul Ifta'].map(l => (
              <li key={l}><a href="#" className="font-sans text-sm text-neutral-500 hover:text-primary-500 transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-neutral-900 text-base mb-4 sm:mb-6">Resources</h4>
          <ul className="space-y-3 sm:space-y-4">
            {['Research Journal', 'Fatwa Archive', 'Student Portal', 'Library'].map(l => (
              <li key={l}><a href="#" className="font-sans text-sm text-neutral-500 hover:text-primary-500 transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <h4 className="font-display font-semibold text-neutral-900 text-base mb-4 sm:mb-6">Contact</h4>
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex items-start space-x-3 text-neutral-500">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-sans text-sm">12 Scholars Row, Educational District</span>
            </li>
            <li className="flex items-center space-x-3 text-neutral-500">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="font-sans text-sm">info@hidayat.edu</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full py-6 sm:py-8 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto border-t border-neutral-200 gap-4">
        <p className="font-sans text-sm text-neutral-500 text-center sm:text-left">© {new Date().getFullYear()} HIDAYAT Academy. Preserving Sacred Tradition.</p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(l => (
            <a key={l} href="#" className="text-neutral-500 hover:text-primary-500 font-sans text-sm transition-colors">{l}</a>
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
    if (isMobile || animationDone) return
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

  const showAnimation = !isMobile && !animationDone
  const navbarOpacity = showAnimation
    ? (scrollProgress >= 0.85 ? Math.min((scrollProgress - 0.85) / 0.15, 1) : 0)
    : 1

  useEffect(() => {
    if (animationDone) {
      sessionStorage.setItem('doorAnimationSeen', 'true')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [animationDone])

  return (
    <div className="font-sans scroll-smooth bg-neutral-50 text-neutral-800 selection:bg-primary-100 selection:text-primary-900">
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
      <FlashcardSlider />
      <UpcomingCourseVideo />
      <Courses />
      <FatwaSection />
      <Newsletter />
      <Footer />
    </div>
  )
}
