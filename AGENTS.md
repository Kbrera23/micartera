# Project Rules

- Custom full-screen overlays (`position: fixed` modals) must render through `createPortal(..., document.body)`. Why: the animated section wrappers apply a CSS transform, which turns them into the containing block for fixed descendants, so an overlay rendered inside a section gets sized to that section instead of the window and clips its own header and footer. Prefer the Radix dialog/alert-dialog primitives, which already portal.
- Expense-list expansion and multi-selection remain local presentation state; bulk deletion delegates each selected ID to the existing `onRemove` callback after Radix confirmation. Why: data persistence and financial calculations must remain owned by the existing hook.
