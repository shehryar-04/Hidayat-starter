import { useState } from 'react'
import { Copy, Check, MessageCircle, Share2 } from 'lucide-react'

/**
 * ShareButtons component — provides share actions for fatwa pages.
 *
 * Renders Copy Link, WhatsApp, and Twitter/X share buttons with
 * minimum 44x44px touch targets for mobile accessibility.
 *
 * @param {object} props
 * @param {string} props.url - The URL to share
 * @param {string} props.title - The title for share text
 */
export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title} ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(title)
    const tweetUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className="flex gap-2">
      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        aria-label={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>

      {/* WhatsApp Share */}
      <button
        onClick={handleWhatsAppShare}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Twitter/X Share */}
      <button
        onClick={handleTwitterShare}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        aria-label="Share on Twitter"
      >
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  )
}
