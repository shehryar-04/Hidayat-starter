import { Link } from 'react-router-dom'
import { generateBreadcrumbSchema } from '../utils/structuredData'

/**
 * BreadcrumbNav — Semantic breadcrumb navigation with JSON-LD structured data.
 *
 * @param {{ items: Array<{ name: string, url: string }> }} props
 * @returns {JSX.Element}
 */
export default function BreadcrumbNav({ items }) {
  if (!items || items.length === 0) return null

  const breadcrumbSchema = generateBreadcrumbSchema(items)

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-gray-600 mb-4">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <span className="mx-1 text-gray-400" aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span className="text-gray-700 font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.url}
                    className="hover:text-green-600 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:rounded-sm"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}
