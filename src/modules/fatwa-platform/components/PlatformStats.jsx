import { motion } from 'framer-motion'
import { BookOpen, Layers, Building2 } from 'lucide-react'

/**
 * PlatformStats component — displays platform statistics with entrance animations.
 *
 * Shows total fatwas, total categories, and total institutions in a responsive
 * grid with staggered fade-in animations using Framer Motion.
 *
 * @param {object} props
 * @param {number} props.totalFatwas - Total number of published fatwas
 * @param {number} props.totalCategories - Total number of categories
 * @param {number} props.totalInstitutions - Total number of institutions
 */
export default function PlatformStats({ totalFatwas, totalCategories, totalInstitutions }) {
  const stats = [
    { label: 'Total Fatwas', value: totalFatwas, icon: BookOpen },
    { label: 'Total Categories', value: totalCategories, icon: Layers },
    { label: 'Total Institutions', value: totalInstitutions, icon: Building2 }
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map(({ label, value, icon: Icon }) => (
        <motion.div
          key={label}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
          variants={itemVariants}
        >
          <Icon className="mx-auto mb-3 text-green-600" size={32} aria-hidden="true" />
          <p className="text-3xl font-bold text-green-700">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
