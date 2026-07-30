import DOMPurify from 'dompurify'

const ARABIC_SCRIPT_RE = /\p{Script=Arabic}/gu
const LETTER_RE = /\p{L}/gu
const URDU_DISTINCTIVE_RE = /[پچژگکڑںھہیےٹڈ]/u
const QURAN_MARKER_RE = /[﴿﴾۝۞]|(?:سورة|الآية|آية\s*[٠-٩0-9])/u
const HADITH_MARKER_RE = /(?:قال\s+رسول\s+الله|رسول\s+الله\s*[ﷺؐ]|رواه|أخرجه|حدثنا|أخبرنا)/u
const BLOCK_SELECTOR = 'p,div,blockquote,li,h2,h3,h4,h5,h6,pre,td,th'
const INLINE_TAGS = new Set(['A', 'B', 'STRONG', 'EM', 'I', 'U', 'SPAN', 'SUP', 'SUB', 'CODE'])
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
  'blockquote', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'sup',
  'sub', 'hr', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
]
const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel', 'class', 'dir', 'lang', 'colspan', 'rowspan',
]

function normalizedText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function getLeafBlocks(root) {
  return [...root.querySelectorAll(BLOCK_SELECTOR)]
    .filter((block) => !block.querySelector(BLOCK_SELECTOR))
}

/**
 * Mirrors rendered text semantics by separating block-level content while
 * preserving intentional adjacency between inline nodes.
 */
function getVisibleText(root) {
  const leafBlocks = new Set(getLeafBlocks(root))
  const parts = []

  const visit = (node) => {
    if (node.nodeType === 3) {
      parts.push(node.textContent || '')
      return
    }
    if (node.nodeType !== 1) return

    const isBlockBoundary = leafBlocks.has(node)
    if (isBlockBoundary) parts.push(' ')
    node.childNodes.forEach(visit)
    if (isBlockBoundary) parts.push(' ')
  }

  root.childNodes.forEach(visit)
  return normalizedText(parts.join(''))
}

export function getArabicScriptRatio(text) {
  const value = normalizedText(text)
  const letters = value.match(LETTER_RE) || []
  if (letters.length === 0) return 0
  return (value.match(ARABIC_SCRIPT_RE) || []).length / letters.length
}

export function classifyAnswerText(text) {
  const value = normalizedText(text)
  const arabicCount = (value.match(ARABIC_SCRIPT_RE) || []).length
  const ratio = getArabicScriptRatio(value)
  const hasUrduLetters = URDU_DISTINCTIVE_RE.test(value)

  if (arabicCount >= 8 && ratio >= 0.75 && !hasUrduLetters && QURAN_MARKER_RE.test(value)) {
    return 'quran'
  }
  if (arabicCount >= 12 && ratio >= 0.85 && !hasUrduLetters && HADITH_MARKER_RE.test(value)) {
    return 'hadith'
  }
  if (arabicCount >= 12 && ratio >= 0.92 && !hasUrduLetters) {
    return 'arabic'
  }
  return 'normal'
}
function groupInlineContent(root) {
  if (root.querySelector(BLOCK_SELECTOR)) return

  const document = root.ownerDocument
  const sourceNodes = [...root.childNodes]
  let paragraph = document.createElement('p')

  const flush = () => {
    if (normalizedText(paragraph.textContent) || paragraph.children.length > 0) {
      root.appendChild(paragraph)
    }
    paragraph = document.createElement('p')
  }

  root.replaceChildren()
  for (const node of sourceNodes) {
    if (node.nodeType === 3) {
      const parts = node.textContent.split(/\r?\n/)
      parts.forEach((part, index) => {
        if (part) paragraph.appendChild(document.createTextNode(part))
        if (index < parts.length - 1) flush()
      })
    } else if (node.nodeName === 'BR') {
      flush()
    } else if (node.nodeType === 1 && INLINE_TAGS.has(node.nodeName)) {
      paragraph.appendChild(node)
    }
  }
  flush()
}

function decorateBlock(block) {
  const text = normalizedText(block.textContent)
  if (!text) return

  const type = classifyAnswerText(text)
  if (type === 'quran') {
    block.classList.add('fatwa-answer-quran')
  } else if (type === 'hadith') {
    block.classList.add('fatwa-answer-hadith')
  } else if (type === 'arabic') {
    block.classList.add('fatwa-answer-arabic')
  } else if (getArabicScriptRatio(text) >= 0.45) {
    block.classList.add('fatwa-answer-urdu', 'font-urdu')
    block.setAttribute('lang', 'ur')
    block.setAttribute('dir', 'rtl')
    return
  } else {
    block.classList.add('fatwa-answer-default')
    return
  }

  block.setAttribute('lang', 'ar')
  block.setAttribute('dir', 'rtl')
}

function removeContentAfter(node, root) {
  let current = node
  while (current && current !== root) {
    while (current.nextSibling) current.nextSibling.remove()
    current = current.parentNode
  }
}

function truncateRoot(root, maxWords) {
  const clone = root.cloneNode(true)
  const walker = clone.ownerDocument.createTreeWalker(clone, 4)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  let consumed = 0
  for (const node of textNodes) {
    const words = [...node.textContent.matchAll(/\S+/g)]
    if (consumed + words.length <= maxWords) {
      consumed += words.length
      continue
    }

    const remaining = Math.max(0, maxWords - consumed)
    const end = remaining > 0
      ? words[remaining - 1].index + words[remaining - 1][0].length
      : 0
    node.textContent = `${node.textContent.slice(0, end).trimEnd()}…`
    removeContentAfter(node, clone)
    break
  }
  return clone.innerHTML
}
export function prepareFatwaAnswer(rawAnswer, maxWords = 500) {
  const source = typeof rawAnswer === 'string' ? rawAnswer : ''
  if (!source) return { html: '', truncatedHtml: '', text: '', wordCount: 0 }

  const sanitized = DOMPurify.sanitize(source, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['style'],
  })

  if (typeof DOMParser === 'undefined') {
    const text = normalizedText(sanitized.replace(/<[^>]*>/g, ' '))
    const wordCount = text ? text.split(/\s+/).length : 0
    return { html: sanitized, truncatedHtml: sanitized, text, wordCount }
  }

  const document = new DOMParser().parseFromString(sanitized, 'text/html')
  const root = document.createElement('div')
  while (document.body.firstChild) root.appendChild(document.body.firstChild)
  groupInlineContent(root)

  root.querySelectorAll('a').forEach((link) => {
    if (link.getAttribute('target') === '_blank') {
      link.setAttribute('rel', 'noopener noreferrer')
    }
  })

  const blocks = getLeafBlocks(root)
  blocks.forEach(decorateBlock)

  const text = getVisibleText(root)
  const wordCount = text ? text.split(/\s+/).length : 0
  return {
    html: root.innerHTML,
    truncatedHtml: wordCount > maxWords ? truncateRoot(root, maxWords) : root.innerHTML,
    text,
    wordCount,
  }
}
