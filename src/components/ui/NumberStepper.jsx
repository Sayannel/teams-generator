import { Minus, Plus } from 'lucide-react'

const NumberStepper = ({ value, onChange, min = 1, max = Infinity, step = 1, label }) => {
  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))

  const handleInputChange = (e) => {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex size-11 items-center justify-center text-brand-600 disabled:opacity-30"
        aria-label="Diminuer"
      >
        <Minus className="size-5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="w-14 border-x border-slate-300 bg-transparent py-2 text-center text-lg font-semibold text-slate-900 outline-none [appearance:textfield] dark:border-slate-600 dark:text-slate-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        onChange={handleInputChange}
        aria-label={label}
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="flex size-11 items-center justify-center text-brand-600 disabled:opacity-30"
        aria-label="Augmenter"
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}

export default NumberStepper
