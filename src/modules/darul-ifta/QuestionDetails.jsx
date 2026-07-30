export function QuestionDetails({ question, compact = false }) {
  if (!question) return null

  return (
    <div className={compact ? 'space-y-1' : 'space-y-3'} dir="auto">
      <p className={`${compact ? 'text-sm' : 'text-base'} font-medium text-neutral-800 whitespace-pre-wrap`}>
        {question.question_text}
      </p>
      {question.context && (
        <div className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-500`}>
          <span className="font-semibold">Additional context:</span>
          <p className="mt-1 whitespace-pre-wrap">{question.context}</p>
        </div>
      )}
    </div>
  )
}
