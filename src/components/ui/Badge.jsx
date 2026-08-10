const STATUS_CLASSES = {
  success: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const Badge = ({ status = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]} ${className}`}
  >
    {children}
  </span>
)

export default Badge
