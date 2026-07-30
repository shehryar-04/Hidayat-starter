import { useMemo } from 'react'
import { prepareFatwaAnswer } from '../utils/answerContent'

/**
 * Renders a sanitized, typography-aware fatwa answer without changing source data.
 */
export default function FatwaAnswerContent({
  answer,
  prepared,
  expanded = true,
  id,
  className = '',
}) {
  const content = useMemo(
    () => prepared || prepareFatwaAnswer(answer),
    [answer, prepared]
  )

  if (!content.html) return null

  return (
    <div
      id={id}
      className={`fatwa-answer-content text-gray-700 ${className}`.trim()}
      dangerouslySetInnerHTML={{
        __html: expanded ? content.html : content.truncatedHtml,
      }}
    />
  )
}
