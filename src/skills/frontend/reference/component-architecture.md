# Frontend Component Architecture Reference

Use this reference when the work is mainly about how UI code should be structured: component boundaries, state placement, shared primitives, extraction, or shaping forms, tables, lists, and route-level screens.

## 1. Component Roles

| Type | Purpose | Typical contents |
|---|---|---|
| Presentational | Render UI from inputs | Card, Badge, EmptyState, Button |
| Container | Coordinate data and behavior | Query wiring, mutation handlers, screen-level state |
| Layout | Structure and composition | Page shell, sidebar layout, split pane |
| Page/Route | Route-level composition | Data loading boundaries, page title, section ordering |

Keep responsibilities obvious. If a component needs an "and" in its job description, split it unless the split would add more indirection than clarity.

## 2. State Placement

| State type | Best location |
|---|---|
| Ephemeral UI state | Local component state |
| Shared screen state | Nearest common parent |
| URL-shaped state | Search params / router state |
| Server data | Dedicated server-state layer |
| Cross-screen client state | Context/store only when truly shared |

### State rules

- Start local. Lift or centralize state only when reuse or coordination requires it.
- Derive values instead of storing duplicates.
- Keep server state and client UI state separate.
- Avoid syncing the same meaning into local state, URL state, and remote state unless there is a clear contract.

## 3. Composition Before Configuration

- Prefer small wrappers, slots, and composition over ever-growing prop surfaces.
- Reuse shared primitives before creating a custom variant.
- Add a variant only when multiple real call sites need the same behavior.
- Extract tokens or shared helpers only after patterns repeat; do not create a design system for one screen.

### Good split

| Concern | Good home |
|---|---|
| Data fetching / mutation wiring | Container, route, or dedicated hook |
| Visual structure | Presentational component or layout wrapper |
| Shared interaction behavior | Small hook or headless primitive |
| App-wide design token | Existing token system after repeated need |

### Watch for

- Presentational components that secretly fetch or mutate data
- Hooks that return large grab-bags of unrelated state and handlers
- One prop added per edge case until the component becomes unreviewable

## 4. Common Screen Patterns

### Forms

- Keep field components focused on rendering and local interaction.
- Keep submission/mutation flow near the screen or form container.
- Model validation, pending, success, and recoverable error states explicitly.
- Prefer inline explanation over hiding important behavior in tooltips.
- Keep field names aligned with user meaning; map API naming at the edge if needed.
- Separate field presentation from validation/business rules when the form grows.

### Lists and Tables

- Keep sorting, filtering, and pagination state close to the surface that owns the interaction.
- Use URL state for filters or tabs when the view should be shareable or restorable.
- Treat empty, loading, and error rows as first-class states, not placeholders.
- Avoid creating a giant "universal table" abstraction unless the product already relies on one.
- Prefer column and row composition over one config object that hides all rendering logic.
- Make row actions and bulk actions explicit instead of burying everything behind menus.

### Page Shells

- Route-level screens should compose sections, not hide the whole page inside one mega-component.
- Reuse established spacing, title, action-bar, and section patterns.
- Put data loading boundaries where they match user-visible regions.
- Keep page shells responsible for orchestration, not every low-level UI detail.

### Design system extension

- Start by checking whether an existing primitive can solve the problem with composition.
- If not, create the smallest reusable layer that captures real repeated behavior.
- Document why a new variant or primitive exists through naming and call sites, not commentary alone.
- If a token, primitive, or wrapper exists for only one screen after your change, reconsider whether extraction was premature.

## 5. Extraction Heuristics

Extract when one of these is true:

- The same structure/behavior appears in multiple places
- A component has more than one clear responsibility
- A named primitive would improve readability across the screen
- A testable behavior is buried inside a large route component

Do not extract when:

- The abstraction would only serve one call site
- The name would be vaguer than the inline code
- The split would scatter closely related logic across too many files

## 6. Mutation and Feedback Patterns

- Keep optimistic UI limited to interactions that are safe to roll back.
- Show busy state at the point of action.
- Keep destructive actions distinguishable.
- Make success states visible when user confidence matters, but avoid celebratory noise for routine actions.

### Mutation checklist

- [ ] The pending state is visible where the user clicked
- [ ] Failure leaves the UI understandable and recoverable
- [ ] Success confirmation matches the impact of the action
- [ ] State ownership stays obvious after the mutation flow is added

## 7. Anti-Patterns

- Prop soup used to make one component handle unrelated use cases
- One-off wrapper components that simply rename a native element
- Shared state lifted too far, making local behavior harder to follow
- Generic "SmartTable" or "FormBuilder" abstractions created before repeated need exists
- Route components that mix data fetching, layout, copy, and every child interaction into one file
