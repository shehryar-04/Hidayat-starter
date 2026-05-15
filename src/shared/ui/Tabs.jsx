import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from './utils'

/**
 * Animated tabs with Framer Motion underline indicator and keyboard navigation.
 * @param {object} props
 * @param {Array<{label: string, content: React.ReactNode}>} props.items - Tab items
 * @param {number} [props.defaultIndex=0] - Initially active tab index
 * @param {boolean} [props.fullWidth] - Stretch tabs to fill container
 * @param {string} [props.className] - Additional CSS classes
 * @example
 * <Tabs items={[{ label: 'Tab 1', content: <div>Content 1</div> }]} />
 */
export function Tabs({ items, defaultIndex = 0, fullWidth, className }) {
  const [active, setActive] = useState(defaultIndex)
  const tabsRef = useRef([])

  if (!items || items.length < 2) return items?.[0]?.content || null

  const handleKeyDown = (e, index) => {
    let newIndex = index
    if (e.key === 'ArrowRight') newIndex = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') newIndex = (index - 1 + items.length) % items.length
    else return
    e.preventDefault()
    setActive(newIndex)
    tabsRef.current[newIndex]?.focus()
  }

  return (
    <div className={className}>
      <div className="flex border-b border-neutral-200 overflow-x-auto" role="tablist">
        {items.map((item, i) => (
          <button
            key={item.label}
            ref={(el) => (tabsRef.current[i] = el)}
            role="tab"
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap outline-none',
              fullWidth && 'flex-1',
              i === active ? 'text-primary-500 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            {item.label}
            {i === active && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4" role="tabpanel">{items[active]?.content}</div>
    </div>
  )
}
