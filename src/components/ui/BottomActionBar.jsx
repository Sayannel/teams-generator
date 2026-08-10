const BottomActionBar = ({ children, className = '' }) => (
  <div
    className={`fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none dark:border-slate-700 dark:bg-slate-900 md:dark:bg-transparent ${className}`}
  >
    {children}
  </div>
)

export default BottomActionBar
