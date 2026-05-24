# Frontend UI Recipes

Use this reference when building common product UI. These are not rigid templates; they are checklists for making first drafts feel complete instead of skeletal. Reuse local components and conventions first.

## 1. Forms

A production-shaped form includes:

- Clear title and short explanation when the form has risk or complexity
- Visible labels for every field
- Helper text only where it reduces uncertainty
- Inline validation errors associated with the field
- Form-level error for submission failures that are not field-specific
- Required/optional cues that match local convention
- Submit button with pending and disabled states
- Secondary cancel/back action when navigation or dismissal is possible
- Success feedback appropriate to the action's impact
- Width constraints so fields do not stretch across wide screens unnecessarily

React + Tailwind notes:

- Keep validation state near the form container or form library.
- Use `aria-invalid`, `aria-describedby`, and stable error IDs for custom fields.
- Use `max-w-xl` / `max-w-2xl` style constraints unless local layout primitives provide them.
- Prefer `space-y-*` for vertical form rhythm and `grid gap-*` for grouped fields.

Avoid:

- Placeholder text as the only label
- A generic `Submit` label when the action has a name
- Disabling submit without explaining missing requirements when the reason is not obvious

## 2. Data Tables and Dense Lists

A production-shaped table or dense list includes:

- Clear title or surrounding context that explains what the data represents
- Loading rows or skeletons that preserve column/list structure
- Empty state with explanation and next action if one exists
- Error state with retry or recovery path
- Column headers or row labels that support scanning
- Row hover/focus treatment when rows are interactive
- Sort, filter, pagination, or search affordances when the data volume requires them
- Explicit row actions; do not bury primary actions in an ambiguous menu
- Bulk actions only when users genuinely act on multiple rows
- Mobile behavior: card-style list, priority columns, or intentional horizontal scroll

React + Tailwind notes:

- Keep sorting/filtering/pagination state local unless it should be shareable; use URL state when the view should be restorable.
- Use stable keys from data, not indexes.
- Prefer `overflow-x-auto` around wide tables, but check that actions remain reachable.
- Use `whitespace-nowrap`, `truncate`, and max-width utilities intentionally; do not hide critical information by accident.

Avoid:

- Rendering an empty `<tbody>` with no explanation
- Centered spinner replacing an entire table without preserving context
- Tiny icon-only row actions with no labels or accessible names

## 3. Settings Pages

A production-shaped settings page includes:

- Sections grouped by user intent, not database model
- Clear distinction between routine settings and dangerous actions
- Save/cancel behavior or autosave behavior that is explicit
- Inline feedback for saved, saving, and failed states
- Disabled controls with understandable reasons when needed
- Destructive zone visually separated and labeled plainly
- Copy that explains consequences before irreversible actions

React + Tailwind notes:

- Use page sections with consistent spacing rather than a card for every setting.
- Keep each setting row compact: label, explanation, control, and status.
- Use responsive stacking so labels and controls do not crowd on narrow screens.

Avoid:

- Making every setting a large card
- Toasting every minor autosave if local confirmation is enough
- Hiding destructive actions in the same visual treatment as routine actions

## 4. Detail Pages

A production-shaped detail page includes:

- Title area with the object's name, status, and primary actions
- Secondary metadata arranged for quick scanning
- Clear section hierarchy for related information
- Empty states for sections with no related data
- Loading/error handling per region when regions load independently
- Action placement near the information it affects
- Responsive behavior for sidebars, metadata panels, and action groups

React + Tailwind notes:

- Compose route-level pages from named sections.
- Keep data-fetching and mutation wiring near the route/container boundary.
- Use `grid` layouts for desktop metadata/sidebar patterns and stack them on mobile.

Avoid:

- One huge component mixing fetches, layout, copy, and every action
- Putting all actions in a single top-right menu when some belong inline
- Treating missing related data as blank whitespace

## 5. Dashboards and Metric Surfaces

A production-shaped dashboard includes:

- A clear decision or monitoring goal, not just available metrics
- Primary metric hierarchy: what matters first, what supports it
- Time ranges, freshness, or data scope where relevant
- Empty/unavailable states for each metric region
- Explanation for deltas, thresholds, or status colors
- Charts only when they improve decision-making
- Alerts or exceptions placed where users can act on them

React + Tailwind notes:

- Use responsive grids that preserve priority: stack important cards first on mobile.
- Use skeletons that match card/chart dimensions to avoid layout jump.
- Prefer text labels plus color for status; do not encode status by color alone.

Avoid:

- Fake metrics, decorative sparklines, or charts with no user decision behind them
- Every metric card having the same visual weight
- Gradient-heavy dashboard polish with no product precedent

## 6. Empty States

A production-shaped empty state includes:

- Plain statement of what is missing
- Why it matters or why it happened, when useful
- Next action if the user can resolve it
- Secondary link to docs/help only when it genuinely helps
- Visual treatment proportionate to the context

React + Tailwind notes:

- Use centered empty states for whole pages; use smaller inline empty rows for tables/sections.
- Keep icons optional and purposeful. Do not add large decorative icons by reflex.

Avoid:

- Cute copy that does not explain recovery
- Empty states that appear only after the user waits through a spinner
- A primary CTA when there is no meaningful next action

## 7. Error States

A production-shaped error state includes:

- What failed, in user-facing terms
- Whether the user's work is safe
- A retry path when recovery is possible
- Contact/support or diagnostic detail only when appropriate
- Placement near the failed region, not always a global banner

React + Tailwind notes:

- Keep server errors distinct from client validation errors.
- Use alert semantics for important errors, but avoid over-announcing low-risk inline messages.
- Provide retry buttons that preserve current filters/input when possible.

Avoid:

- `Something went wrong` with no recovery path
- Logging the error but rendering blank UI
- Exposing raw stack traces or internal API messages to users

## 8. Modals, Dialogs, and Drawers

A production-shaped dialog/drawer includes:

- Clear title and description where context is not obvious
- Initial focus and focus trap via local primitive/library
- Escape/close behavior that matches local convention
- Primary and secondary action hierarchy
- Pending state for async confirmation
- Destructive confirmation language when risk is meaningful
- Narrow-screen behavior that remains usable on touch devices

React + Tailwind notes:

- Prefer established Radix/shadcn/headless primitives over custom focus management.
- Use `DialogTitle`/`DialogDescription` equivalents for accessible names.
- Keep footer actions visible and stacked appropriately on small screens.

Avoid:

- Building custom modal accessibility from scratch when primitives exist
- Using a modal for a small inline edit that could stay in context
- Icon-only close buttons without accessible labels

## 9. Navigation and Page Shells

A production-shaped page shell includes:

- Main landmark and clear heading structure
- Current location or selected state in navigation
- Responsive behavior for sidebars, tabs, and overflow actions
- Skip links or equivalent patterns when the app shell is complex
- Consistent title/action area across related pages

React + Tailwind notes:

- Use semantic `main`, `nav`, `header`, and `section` elements where appropriate.
- Keep page padding and max-widths aligned with existing layout primitives.
- Use `aria-current` for active navigation links.

Avoid:

- Creating a one-off shell for a single page when an app layout exists
- Desktop navigation collapsed poorly into hidden mobile affordances
- Heading levels chosen for visual size rather than document structure
