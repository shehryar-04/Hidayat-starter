/**
 * Analytics Utility — Google Analytics GA4 + Microsoft Clarity
 *
 * Provides:
 * - Script initialization (called once in App root)
 * - Page view tracking (called on route changes)
 * - Custom event tracking (reusable for future events)
 *
 * Environment variables:
 *   VITE_GA_ID      — GA4 Measurement ID (e.g., G-XXXXXXXXXX)
 *   VITE_CLARITY_ID — Microsoft Clarity Project ID
 */

const GA_ID = import.meta.env.VITE_GA_ID
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID

/**
 * Initialize Google Analytics GA4.
 * Injects the gtag.js script and configures the measurement ID.
 * Should be called once on app mount.
 */
export function initGA() {
  if (!GA_ID || typeof window === 'undefined') return

  // Avoid double-initialization
  if (document.getElementById('ga-script')) return

  // Load gtag.js
  const script = document.createElement('script')
  script.id = 'ga-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    send_page_view: false, // We'll send page views manually on route change
  })
}

/**
 * Initialize Microsoft Clarity.
 * Injects the Clarity tracking script.
 * Should be called once on app mount.
 */
export function initClarity() {
  if (!CLARITY_ID || typeof window === 'undefined') return

  // Avoid double-initialization
  if (window.clarity) return

  ;(function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        ;(c[a].q = c[a].q || []).push(arguments)
      }
    t = l.createElement(r)
    t.async = 1
    t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]
    y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_ID)
}

/**
 * Initialize all analytics providers.
 * Call this once in your App component's useEffect.
 */
export function initAnalytics() {
  initGA()
  initClarity()
}

/**
 * Track a page view in GA4.
 * Call this on every route change (React Router navigation).
 *
 * @param {string} path - The current page path (e.g., '/darul-ifta/category/fiqh')
 * @param {string} [title] - Optional page title
 */
export function trackPageView(path, title) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  })
}

/**
 * Track a custom event in GA4.
 * Use this for user interactions like button clicks, form submissions, etc.
 *
 * @param {string} eventName - The event name (e.g., 'fatwa_view', 'question_submit')
 * @param {object} [params] - Optional event parameters
 *
 * @example
 * // Track when a user views a fatwa
 * trackEvent('fatwa_view', { fatwa_id: '123', category: 'عبادات' })
 *
 * // Track when a user submits a question
 * trackEvent('question_submit', { source: 'darul_ifta' })
 *
 * // Track course enrollment
 * trackEvent('course_enroll', { course_id: 'abc', course_name: 'Arabic 101' })
 */
export function trackEvent(eventName, params = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', eventName, params)
}

/**
 * Set user properties in GA4 (e.g., after login).
 *
 * @param {object} properties - User properties to set
 *
 * @example
 * setUserProperties({ role: 'student', institution: 'Hidayat' })
 */
export function setUserProperties(properties = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return

  window.gtag('set', 'user_properties', properties)
}
