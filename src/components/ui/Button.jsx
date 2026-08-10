const VARIANT_CLASSES = {
  solid:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 active:bg-brand-700',
  outline:
    'border border-slate-300 bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 active:bg-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 dark:active:bg-red-900/50',
}

const Button = ({ variant = 'solid', className = '', ...props }) => (
  <button
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    {...props}
  />
)

export default Button
