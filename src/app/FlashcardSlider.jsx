import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, HelpCircle, Lightbulb } from 'lucide-react'

const flashcards = [
  { q: "According to the teachings of Islam, what is the consequence of injustice (Zulm) in the Hereafter?", a: "It becomes a source of ruin and severe distress." },
  { q: "What is the recommended conduct regarding initiating 'Salam' (Islamic greeting)?", a: "One should strive to be the first to offer it to others." },
  { q: "How is the nature of the 'Dunya' (this world) described in the context of a believer's life?", a: "It is characterized as a place of testing and trial (Imtihan-gah)." },
  { q: "Which physical tool is highlighted for its spiritual importance and excellence in personal hygiene?", a: "The Miswak." },
  { q: "According to the Hadith regarding charity, why is the 'upper hand' (the giver) considered superior?", a: "Because giving is better than receiving." },
  { q: "How is backbiting (Gheebat) categorized in terms of its spiritual weight as a sin?", a: "It is described as a grievous or 'heavy' sin." },
  { q: "What is the relationship between physical/spiritual purity (Taharat) and Faith (Iman)?", a: "Purity is considered a fundamental part or 'half' of Faith." },
  { q: "In the hierarchy of Islamic sources, what is the status and importance of the Holy Quran?", a: "It holds the highest station of guidance and divine authority." },
  { q: "What specific object is metaphorically referred to as the 'flute of Satan'?", a: "The bell (used in non-Islamic rituals or for vanity)." },
  { q: "What are the two essential spiritual responses a believer must have toward life's circumstances?", a: "Patience (Sabr) and Gratitude (Shukr)." },
  { q: "What is the primary 'secret' to maintaining a sustainable and balanced livelihood (Ma'ishat)?", a: "Moderation (I'tidal)." },
  { q: "What is the proper Islamic motivation for forming bonds of love and friendship with others?", a: "To love them solely for the sake of Allah." },
  { q: "In the pursuit of knowledge, what proportion of learning is attributed to asking a 'good question'?", a: "One half of knowledge." },
  { q: "What are the spiritual 'effects' or fruits of sincere Repentance (Tawbah)?", a: "The cleansing of sins and the restoration of a close relationship with Allah." },
  { q: "According to Islamic ethical definitions, who is a truly 'intelligent' person?", a: "The one who subordinates their desires to Allah's will and prepares for the Afterlife." },
  { q: "A true believer is described as being a symbol of 'Alfat', which translates to _____.", a: "Affection or familiarity." },
  { q: "What is the relationship between persistent sinning and the state of Hypocrisy (Nifaq)?", a: "Persistent, unrepentant sinning can eventually lead a heart toward hypocrisy." },
  { q: "What is an identified sign of the 'Last Days' regarding the presence of righteous people in society?", a: "Good and pious people will pass away or be removed one by one." },
  { q: "What social shift in leadership is predicted for the 'Last Days' regarding 'mean' or unworthy people?", a: "Unworthy and base individuals will rise to positions of honor and authority." },
  { q: "Metaphor: Practicing religion during times of severe societal trial is like holding a _____.", a: "Burning coal." },
  { q: "What is identified as a primary cause for the dominance of non-believers over Muslims in later times?", a: "The loss of religious commitment and the internal decline of Muslim character." },
  { q: "What warning is given to those who misuse their 'tongues' for the purpose of earning a living?", a: "It leads to the consumption of forbidden (Haram) or questionable wealth." },
  { q: "Who is the sole and ultimate owner of all profit and loss in human affairs?", a: "Allah." },
  { q: "What is the requirement for a believer regarding the treatment of animals?", a: "To observe and fulfill their rights with kindness and justice." },
  { q: "What is the status of 'Knowledge' (Ilm) in Hadith?", a: "It is held in the highest regard as a path to excellence and divine pleasure." },
  { q: "When dealing with servants or slaves, what are the two recommended paths for a master?", a: "Justice (Adl) and Forgiveness (Afw)." },
  { q: "What is the 'golden rule' or general principle for dealing with all matters within the Religion?", a: "Moderation (I'tidal)." },
  { q: "Why is there a strong emphasis on avoiding 'Bid'ah' (innovations) in faith?", a: "Because innovations distort the original, pure teachings of Islam." },
  { q: "Under what condition is the expression of a reality or truth considered unnecessary or unhelpful?", a: "When it causes undue harm, fitna (discord), or serves no constructive purpose." },
  { q: "The Arabic term 'Niyyat' refers to the internal _____ that precedes an action.", a: "Intention" },
  { q: "What does the term 'Ikhlas' mean in the context of performing religious deeds?", a: "Sincerity; performing actions solely for the pleasure of Allah without ostentation." },
  { q: "What is the spiritual danger of Satan's 'Jaal' (Net/Web)?", a: "It entangles the believer in worldly desires and forgetfulness of the Hereafter." },
  { q: "How does 'Patience' (Sabr) act as a shield for a believer?", a: "It prevents the believer from acting out of anger or despair during hardships." },
  { q: "Why is 'Gratitude' (Shukr) considered a catalyst for increase?", a: "Because Allah has promised to increase blessings for those who are grateful." },
  { q: "What determines the value of a person's actions according to the foundational theme of Unit 1?", a: "Their Intention (Niyyat)." },
  { q: "A believer's 'Affection' (Alfat) should make them _____ to interact with in a community.", a: "Easy and approachable." },
  { q: "What does the rise of 'mean' people to honor suggest about the societal values of that time?", a: "A reversal of true merit where worldly power is prioritized over spiritual character." },
  { q: "Why is the Miswak specifically mentioned as having 'excellence' beyond mere cleaning?", a: "Because it is a Sunnah that carries high spiritual reward and pleases Allah." },
  { q: "Statement: 'A good question is _____ of knowledge.'", a: "half" },
  { q: "In the context of the decline of Muslims, what does 'low status' (pasti) refer to?", a: "A loss of dignity, influence, and spiritual strength on the global stage." },
]

const cardColors = [
  { front: 'bg-pink-50 border-pink-200', back: 'bg-pink-500', label: 'text-pink-600', hint: 'text-pink-400' },
  { front: 'bg-emerald-50 border-emerald-200', back: 'bg-emerald-500', label: 'text-emerald-600', hint: 'text-emerald-400' },
  { front: 'bg-amber-50 border-amber-200', back: 'bg-amber-500', label: 'text-amber-600', hint: 'text-amber-400' },
  { front: 'bg-blue-50 border-blue-200', back: 'bg-blue-500', label: 'text-blue-600', hint: 'text-blue-400' },
  { front: 'bg-purple-50 border-purple-200', back: 'bg-purple-500', label: 'text-purple-600', hint: 'text-purple-400' },
  { front: 'bg-rose-50 border-rose-200', back: 'bg-rose-500', label: 'text-rose-600', hint: 'text-rose-400' },
  { front: 'bg-teal-50 border-teal-200', back: 'bg-teal-500', label: 'text-teal-600', hint: 'text-teal-400' },
  { front: 'bg-orange-50 border-orange-200', back: 'bg-orange-500', label: 'text-orange-600', hint: 'text-orange-400' },
  { front: 'bg-indigo-50 border-indigo-200', back: 'bg-indigo-500', label: 'text-indigo-600', hint: 'text-indigo-400' },
  { front: 'bg-cyan-50 border-cyan-200', back: 'bg-cyan-500', label: 'text-cyan-600', hint: 'text-cyan-400' },
]


function Flashcard({ card, index }) {
  const [flipped, setFlipped] = useState(false)
  const color = cardColors[index % cardColors.length]

  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[320px] h-[220px] sm:h-[240px] cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(f => !f)}
    >
      <AnimatePresence initial={false} mode="wait">
        {!flipped ? (
          <motion.div
            key="front"
            className={`absolute inset-0 rounded-xl border shadow-sm p-6 flex flex-col justify-between ${color.front}`}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className={`flex items-center gap-2 mb-3 ${color.label}`}>
              <HelpCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Question</span>
            </div>
            <p className="font-display text-sm sm:text-base text-gray-800 leading-relaxed line-clamp-5 flex-1">
              {card.q}
            </p>
            <p className={`text-[10px] mt-2 text-center ${color.hint}`}>Tap to reveal answer</p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className={`absolute inset-0 rounded-xl text-white shadow-sm p-6 flex flex-col justify-between ${color.back}`}
            initial={{ rotateY: -180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <Lightbulb className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Answer</span>
            </div>
            <p className="font-display text-sm sm:text-base leading-relaxed line-clamp-5 flex-1">
              {card.a}
            </p>
            <p className="text-[10px] text-white/50 mt-2 text-center">Tap to see question</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FlashcardSlider() {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = 340
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
    }
  }

  return (
    <section className="py-16 sm:py-24 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-[10px] sm:text-xs text-primary-500 tracking-[0.3em] uppercase font-bold">Test Your Knowledge</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 mt-2">Islamic Knowledge Flashcards</h2>
            <p className="text-sm text-neutral-500 mt-2">Click any card to reveal the answer. Swipe or use arrows to browse all 40 cards.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all duration-150"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all duration-150"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {flashcards.map((card, i) => (
            <div key={i} className="snap-start relative">
              <Flashcard card={card} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
