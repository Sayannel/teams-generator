import { Monitor, Moon, Sun } from 'lucide-react'
import { THEME_OPTIONS } from '../../lib/theme'

const OPTIONS = [
  { value: THEME_OPTIONS.SYSTEM, label: 'Système', Icon: Monitor },
  { value: THEME_OPTIONS.LIGHT, label: 'Clair', Icon: Sun },
  { value: THEME_OPTIONS.DARK, label: 'Sombre', Icon: Moon },
]

const ThemeToggle = ({ preference, onChange }) => (
  <div
    className="inline-flex w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    role="group"
    aria-label="Thème"
  >
    {OPTIONS.map(({ value, label, Icon }) => {
      const isActive = preference === value
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={isActive}
          className={`flex h-11 flex-1 items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
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

export default ThemeToggle
