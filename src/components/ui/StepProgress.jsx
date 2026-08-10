const StepProgress = ({ current, total }) => (
  <div
    className="flex gap-1"
    role="progressbar"
    aria-valuenow={current}
    aria-valuemin={1}
    aria-valuemax={total}
    aria-label={`Étape ${current} sur ${total}`}
  >
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className={`h-1 flex-1 rounded-full ${i < current ? 'bg-white' : 'bg-white/25'}`}
      />
    ))}
  </div>
)

export default StepProgress
