import { X } from 'lucide-react'

const Drawer = ({ open, title, onClose, children }) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-slide-up max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl md:max-w-md md:animate-none md:rounded-2xl dark:bg-slate-900"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 md:hidden dark:bg-slate-700" />
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Drawer
