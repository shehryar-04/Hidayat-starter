import { useState } from 'react'

/**
 * LazyImage — A utility component that wraps <img> with native lazy loading
 * and an optional placeholder/skeleton while the image loads.
 *
 * Uses the browser's native `loading="lazy"` attribute to defer loading
 * of images below the fold until they are near the viewport.
 *
 * @param {object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility (use "" for decorative images)
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.width] - Image width
 * @param {number} [props.height] - Image height
 * @param {string} [props.placeholderClass] - CSS class for the skeleton placeholder
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholderClass = '',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      {/* Skeleton placeholder shown while image loads */}
      {!loaded && !error && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse rounded ${placeholderClass}`}
          aria-hidden="true"
        />
      )}

      {/* Error fallback */}
      {error && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded"
          aria-hidden="true"
        >
          <span className="text-gray-400 text-sm">Image unavailable</span>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...rest}
      />
    </div>
  )
}
