# Frontend First-Draft Quality Bar

Use this reference when producing new UI or materially changing an existing surface. The goal is to make the first implementation production-shaped, not a scaffold that requires several polish passes before it is usable.

## 1. Baseline Expectation

A frontend first draft should be usable without embarrassment. It does not need to be pixel-perfect or brand-final, but it should already include the structure, states, hierarchy, and interaction details a real user needs.

Do not stop at:

- rendering the happy path only
- unstyled semantic markup
- a loose pile of cards and buttons
- desktop-only layout
- controls with no hover, focus, disabled, or pending behavior

The minimum bar is: **a user can understand the screen, complete the primary task, recover from common failures, and use it on narrow and wide screens.**

## 2. Always Include

For new screens and meaningful component work, include these unless the local product pattern clearly says otherwise:

- Clear page or region title that explains the task
- One obvious primary action per region
- Secondary actions that look secondary
- Intentional grouping and spacing, not uniform gaps everywhere
- Loading, empty, error, disabled, and success states when applicable
- Visible labels for inputs and icon-only controls
- Hover, focus-visible, active/pressed, selected, disabled, and pending states for interactive controls
- Responsive behavior for narrow and wide layouts
- Copy that tells the user what happened and what to do next
- Layout stability while data loads or mutations run

If one of these is not applicable, it should be obvious from the task. Do not silently omit it because the prompt did not mention it.

## 3. Visual Quality Defaults

When local precedent is weak, prefer these defaults:

- Use typography and spacing before adding decoration.
- Build a clear vertical rhythm: tighter spacing inside groups, more spacing between groups.
- Use neutral surfaces for structure and reserve accent color for action, status, or selection.
- Use borders or shadows only when they clarify containment or layering.
- Keep density appropriate to the task: operational tools can be compact; decision-heavy views need more breathing room.
- Constrain long forms and prose with sensible max widths.
- Avoid nested cards unless each layer has a distinct purpose.
- Avoid decorative gradients, glows, glassmorphism, and large ornamental icons unless the product already uses them.

## 4. Interaction Quality Defaults

Interactive elements should feel complete in the first pass:

- Buttons show loading or disabled state where duplicate submission matters.
- Form validation appears near the field and explains recovery.
- Destructive actions are visually distinct and confirm when risk is meaningful.
- Row, card, and list interactions have clear hover/focus affordances.
- Menus, dialogs, drawers, and popovers have clear open/close behavior and focus handling.
- Success feedback appears near the action when the user needs confidence.
- Routine success should not create notification spam.

## 5. React + Tailwind Preferred Defaults

Use these when the project uses React and Tailwind, unless local conventions differ.

### Component structure

- Keep route/page components responsible for orchestration.
- Extract named presentational sections when it improves readability.
- Keep local UI state local; lift only when shared behavior requires it.
- Use existing UI primitives first, especially shadcn/Radix-style components if present.
- Do not introduce a new primitive or variant for one call site unless the screen is otherwise unreadable.

### Tailwind usage

- Use the project's tokens and configured theme before arbitrary values.
- Prefer `gap-*`, `space-y-*`, `grid`, `flex`, `max-w-*`, and responsive prefixes over one-off margin piles.
- Use mobile-first classes, then layer `sm:`, `md:`, `lg:`, and `xl:` changes intentionally.
- Add state variants deliberately: `hover:`, `focus-visible:`, `active:`, `disabled:`, `aria-*`, `data-*` when supported by local primitives.
- Prefer `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` or the local equivalent for custom controls.
- Prefer `transition-colors`, `transition-opacity`, or short transform transitions for interactive feedback.
- Use `disabled:pointer-events-none disabled:opacity-50` or local disabled conventions for custom controls.
- Avoid long arbitrary class strings when a shared primitive already captures the pattern.

### Loading and empty states

- Use skeletons that preserve the loaded layout's approximate shape.
- Do not use a centered spinner as the only loading UI for complex surfaces.
- Empty states should include a short explanation and a next action when one exists.
- Error states should include what failed and a retry path when recovery is possible.

## 6. When to Ask Instead of Guessing

Ask one focused clarifying question when the answer changes the UI's shape:

- The primary user goal is unclear.
- Multiple interaction models are plausible: page, modal, drawer, inline edit.
- The product tone or design system is unknown and no local code is available.
- The requested change affects navigation, information architecture, or workflow.

If local code is available, inspect it first. Do not ask questions the repository can answer.
