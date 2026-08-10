import { FLOATING_RIGHT_CLASS } from '../../lib/layout'

// `right` uses the same centered max-w-2xl column as the page content, so on
// wide viewports the button stays anchored to that column's edge instead of
// drifting off to the far right of the browser window.
const Fab = ({ className = '', ...props }) => (
  <button
    type="button"
    className={`fixed bottom-24 ${FLOATING_RIGHT_CLASS} z-20 flex size-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40 transition-transform hover:bg-brand-700 active:scale-95 md:bottom-6 ${className}`}
    {...props}
  />
)

export default Fab
