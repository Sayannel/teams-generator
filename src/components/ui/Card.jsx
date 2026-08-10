export const Card = ({ className = '', children, ...rest }) => (
  <div
    className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    {...rest}
  >
    {children}
  </div>
)

export const CardHeader = ({ className = '', children, ...rest }) => (
  <div
    className={`border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 ${className}`}
    {...rest}
  >
    {children}
  </div>
)
