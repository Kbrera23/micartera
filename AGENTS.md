# Project Rules

- Custom full-screen overlays (`position: fixed` modals) must render through `createPortal(..., document.body)`. Why: the animated section wrappers apply a CSS transform, which turns them into the containing block for fixed descendants, so an overlay rendered inside a section gets sized to that section instead of the window and clips its own header and footer. Prefer the Radix dialog/alert-dialog primitives, which already portal.
