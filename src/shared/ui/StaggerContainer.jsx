import { motion } from 'framer-motion'
import { cn } from './utils'

/**
 * Stagger delay between each child item (in seconds).
 * Range: 30–50ms → using 40ms (0.04s) as default.
 */
const STAGGER_DELAY = 0.04

/**
 * Maximum number of items that receive staggered animation.
 * Items beyond this index animate immediately without additional delay.
 */
const MAX_STAGGER_ITEMS = 20

/**
 * Container variants for orchestrating staggered children animations.
 */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0,
    },
  },
}

/**
 * Item variants for individual list items within a StaggerContainer.
 * Animates from slightly below with zero opacity to full visibility.
 */
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
}

/**
 * A reusable motion container that staggers the entrance of its children.
 * Wrap list items with `<StaggerItem>` inside this container.
 *
 * @example
 * ```jsx
 * <StaggerContainer className="space-y-2">
 *   {items.slice(0, 20).map(item => (
 *     <StaggerItem key={item.id}>
 *       <Card>{item.name}</Card>
 *     </StaggerItem>
 *   ))}
 * </StaggerContainer>
 * ```
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - StaggerItem children
 */
export function StaggerContainer({ className, children, ...props }) {
  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * A motion wrapper for individual items inside a StaggerContainer.
 * Each item animates in sequence with a staggered delay (30–50ms).
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Item content
 */
export function StaggerItem({ className, children, ...props }) {
  return (
    <motion.div className={cn(className)} variants={itemVariants} {...props}>
      {children}
    </motion.div>
  )
}

export { MAX_STAGGER_ITEMS, STAGGER_DELAY }
