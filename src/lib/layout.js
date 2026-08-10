// Edge alignment for elements fixed to the viewport that should stay flush
// with the app's centered max-w-2xl column instead of the raw viewport edge
// on wide screens. The column is centered, so the same offset formula works
// mirrored on both sides.
export const FLOATING_RIGHT_CLASS = 'right-[max(1rem,calc(50vw-20rem))]'

// Rendered height of App.jsx's sticky header (title row + progress bar).
// Anything else that sticks to the top of the viewport (e.g. a table header)
// must offset by this amount instead of top-0, or the two would overlap.
export const APP_HEADER_HEIGHT = '4.25rem'
