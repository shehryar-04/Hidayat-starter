import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Lightbulb, ChevronRight } from 'lucide-react'
import { flashcards, cardColors } from './flashcardsData'

function Flashcard({ card, index }) {
  const [flipped, setFlipped] = useState(false)
  const color = cardColors[index % cardColors.length]

  return (
    <div
      className="flex-shrink-0 w-full h-[220px] sm:h-[240px] cursor-pointer"
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
              <span className="text-[10px] font-bold uppercase tracking-widest">Question {index + 1}</span>
            </div>
            <p className="font-display text-sm sm:text-base text-gray-800 leading-relaxed line-clamp-5 flex-1 font-medium">
              {card.q}
            </p>
            <p className={`text-[10px] mt-2 text-center font-semibold ${color.hint}`}>Tap to reveal answer</p>
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
            <p className="text-[10px] text-white/50 mt-2 text-center font-medium">Tap to see question</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FlashcardSlider() {
  const teaserCards = flashcards.slice(0, 4)

  return (
    <section className="py-16 sm:py-24 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] sm:text-xs text-primary-500 tracking-[0.3em] uppercase font-bold">
            Test Your Knowledge
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 leading-tight">
            Do you know the answers to these questions?
          </h2>
          <p className="text-sm text-neutral-500">
            Click any card to reveal the answer. Explore the basic quiz below or take the full test.
          </p>
        </div>

        {/* 4-card teaser grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teaserCards.map((card, i) => (
            <div key={i} className="relative">
              <Flashcard card={card} index={i} />
            </div>
          ))}
        </div>

        {/* CTA to Dedicated page */}
        <div className="text-center mt-12">
          <Link
            to="/knowledge-test"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-primary-600/10 hover:shadow-xl hover:shadow-primary-600/20 transition-all duration-150"
          >
            <span>Take the Full Knowledge Test (40+ Questions)</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
