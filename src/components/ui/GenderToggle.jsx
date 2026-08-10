import { Mars, Venus } from 'lucide-react'

const OPTIONS = [
  { value: 'male', label: 'Masculin', Icon: Mars },
  { value: 'female', label: 'Féminin', Icon: Venus },
]

const GenderToggle = ({ gender, onChange }) => (
  <div
    className="inline-flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    role="group"
    aria-label="Genre"
  >
    {OPTIONS.map(({ value, label, Icon }) => {
      const isActive = gender === value
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={isActive}
          className={`flex h-11 items-center gap-1.5 px-3 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      )
    })}
  </div>
)

export default GenderToggle
