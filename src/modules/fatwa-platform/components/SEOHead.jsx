import { Helmet } from 'react-helmet-async'

/**
 * SEOHead component — manages document head metadata for the Fatwa Knowledge Platform.
 *
 * Renders title, meta description, canonical URL, OpenGraph tags, Twitter Card tags,
 * and JSON-LD structured data scripts using react-helmet-async.
 *
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description (truncated to 160 chars)
 * @param {string} props.canonicalUrl - Canonical URL for the page
 * @param {string} [props.ogType='website'] - OpenGraph type ('article' | 'website')
 * @param {object[]} [props.structuredData=[]] - Array of JSON-LD objects to embed
 */
export default function SEOHead({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  structuredData = []
}) {
  const truncatedDescription = description ? description.slice(0, 160) : ''

  return (
    <Helmet>
      {/* Page title */}
      <title>{title}</title>

      {/* Meta description */}
      <meta name="description" content={truncatedDescription} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Hidayat Darul Ifta" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />

      {/* JSON-LD structured data */}
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  )
}
