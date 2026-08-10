const STATUS_DOT_COLOR = {
  success: 'bg-green-500',
  good: 'bg-teal-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

const RatingDots = ({ status, filled, total = 4, label }) => {
  // Always show at least 1 filled dot — a bare "0/4" reads as broken rather
  // than "very poor", and there's always at least some score to represent.
  const clampedFilled = Math.max(1, filled ?? 0)

  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-3 rounded-full ${
            i < clampedFilled ? STATUS_DOT_COLOR[status] : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

export default RatingDots
