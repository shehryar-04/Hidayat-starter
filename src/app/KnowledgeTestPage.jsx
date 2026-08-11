import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Lightbulb, Search, RotateCcw, Award } from 'lucide-react'
import { flashcards, cardColors } from './flashcardsData'
import { Button, Input } from '../shared/ui'

function Flashcard({ card, index, onReveal }) {
  const [flipped, setFlipped] = useState(false)
  const color = cardColors[index % cardColors.length]

  const handleFlip = () => {
    setFlipped(f => {
      const next = !f
      if (next) {
        onReveal(index)
      }
      return next
    })
  }

  return (
    <div
      className="flex-shrink-0 w-full h-[220px] sm:h-[240px] cursor-pointer relative"
      style={{ perspective: '1000px' }}
      onClick={handleFlip}
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
              <HelpCircle className="w-4.5 h-4.5" />
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
              <Lightbulb className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Answer</span>
            </div>
            <p className="font-display text-sm sm:text-base leading-relaxed line-clamp-5 flex-1">
              {card.a}
            </p>
            <p className="text-[10px] text-white/60 mt-2 text-center font-medium">Tap to see question</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function KnowledgeTestPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [revealedIds, setRevealedIds] = useState(new Set())
  const [resetCounter, setResetCounter] = useState(0)

  const handleReveal = (index) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const handleReset = () => {
    setRevealedIds(new Set())
    setResetCounter(prev => prev + 1)
  }

  const filteredCards = useMemo(() => {
    return flashcards.map((card, index) => ({ ...card, originalIndex: index })).filter(card =>
      card.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const progressPercentage = Math.min(
    100,
    Math.round((revealedIds.size / flashcards.length) * 100)
  )

  return (
    <div className="bg-neutral-50 min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <span className="text-[10px] sm:text-xs text-primary-600 tracking-[0.3em] uppercase font-bold bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
            Interactive Learning
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-neutral-900 leading-tight">
            Test Your Islamic Knowledge
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Browse and interact with our collection of 40+ flashcards covering essential Islamic ethical conduct, classical teachings, and traditional values.
          </p>
        </div>

        {/* Stats & Controls Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Progress Tracker */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-500" />
                Your Progress: {revealedIds.size} / {flashcards.length} Cards Flipped
              </span>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {progressPercentage}% Completed
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              className="pl-9 pr-4 rounded-full border-neutral-200 focus:border-primary-500"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Reset button */}
          <div className="md:col-span-2 text-right">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full justify-center gap-2 text-xs font-semibold py-2.5 rounded-full border-neutral-200 text-neutral-600 hover:text-neutral-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Quiz
            </Button>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 p-8">
            <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-neutral-800">No questions found</h3>
            <p className="text-sm text-neutral-500 mt-1">Try resetting the search filters or keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <Flashcard
                key={`${card.originalIndex}-${resetCounter}`}
                card={card}
                index={card.originalIndex}
                onReveal={handleReveal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
