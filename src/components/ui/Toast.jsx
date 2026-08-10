const VARIANT_CLASSES = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-slate-900',
}

export const Toast = ({ toast, onDismiss }) => {
  if (!toast) return null

  return (
    <div
      role="status"
      onClick={onDismiss}
      className={`fixed inset-x-4 bottom-24 z-20 rounded-lg px-4 py-3 text-center text-sm font-medium text-white shadow-lg md:inset-x-auto md:right-4 md:bottom-4 md:w-80 ${VARIANT_CLASSES[toast.variant ?? 'info']}`}
    >
      {toast.message}
    </div>
  )
}
