// The app's sticky header (title row + progress bar) has a height that
// varies by breakpoint and content, so App.jsx measures it live with a
// ResizeObserver and exposes it as this CSS custom property. Anything else
// that sticks to the top of the viewport (e.g. a table header) should offset
// by `var(${APP_HEADER_HEIGHT_VAR})` instead of a hardcoded top, or the two
// would overlap.
export const APP_HEADER_HEIGHT_VAR = '--app-header-height'
export const APP_HEADER_HEIGHT_CSS = `var(${APP_HEADER_HEIGHT_VAR}, 4.5rem)`
