const RADIUS = 15.9155 // makes the circle's circumference ~100, so segment values map directly to percentages

const DonutChart = ({ segments, size = 128, strokeWidth = 5, centerLabel, centerSublabel }) => {
  let cumulative = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" className="size-full">
        <circle
          cx="21"
          cy="21"
          r={RADIUS}
          fill="none"
          className="stroke-slate-100 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment) => {
          if (segment.value <= 0) return null
          const dashoffset = 25 - cumulative
          cumulative += segment.value
          return (
            <circle
              key={segment.label}
              cx="21"
              cy="21"
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.value} ${100 - segment.value}`}
              strokeDashoffset={dashoffset}
            />
          )
        })}
      </svg>
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && (
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {centerLabel}
            </span>
          )}
          {centerSublabel && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {centerSublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default DonutChart
