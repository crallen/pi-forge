# Frontend Accessibility and Responsive UI Reference

Use this reference when the task involves interaction quality across keyboard, screen reader, pointer, or viewport contexts: forms, menus, dialogs, drawers, tables, overflow issues, or mobile layout behavior.

## 1. Accessibility Baseline

- Use semantic elements first (`button`, `nav`, `main`, `label`, `table`, `dialog`) before building custom roles.
- Preserve logical heading order and landmark structure.
- Ensure keyboard access, visible focus, and expected interaction patterns.
- Do not rely on color alone for status, validation, or selection.
- Associate labels, helper text, and errors with the correct controls.
- Respect `prefers-reduced-motion` for non-essential animation.

## 2. Keyboard and Focus

- Use `:focus-visible` so keyboard users get a clear focus ring without noisy mouse focus.
- Keep focus order aligned with visual order.
- Ensure dialogs, menus, drawers, and popovers support escape and sane focus return.
- Do not hide interactive affordances behind hover only.
- For grouped controls, use expected keyboard patterns rather than ad hoc handlers.

### Focus ring baseline

- Prefer a visible outline or ring with real contrast against adjacent surfaces.
- Offset focus from the element edge when possible so it does not disappear into borders.
- Keep focus treatment consistent across buttons, links, inputs, menus, and custom widgets.

## 3. Forms and Validation

- Place visible labels on fields; placeholders are not labels.
- Keep required state, helper text, and errors close to the field.
- Validate at the right moment for the interaction, not on every keystroke by default.
- Explain why an action is disabled when the reason matters.
- Make loading, success, and recoverable error states explicit around submission.

## 4. Overlays and Disclosure Patterns

Prefer the simplest pattern that preserves context:

| Need | Better default |
|---|---|
| Reveal supporting detail | Inline expand/collapse |
| Secondary tools/actions | Popover or menu |
| Temporary side workflow | Drawer or side panel |
| Blocking confirmation or focused task | Dialog |

### Overlay rules

- Use the native dialog/popover path when it fits the framework and browser support expectations.
- Ensure overlays are not clipped by overflow containers.
- Keep escape, outside-click, and focus-return behavior predictable.
- Avoid modals when inline reveal or page-level composition would be simpler.
- Use portal/top-layer strategies when local overflow or stacking contexts would break menus and popovers.
- Treat dropdown positioning bugs as UX bugs, not cosmetic issues.

## 5. Responsive Baseline

- Start from the constrained/mobile layout and scale up deliberately.
- Let complex multi-column layouts collapse cleanly.
- Avoid horizontal scrolling for core content at narrow widths.
- Keep tap targets, spacing, and text sizes usable on small screens.
- Adapt content density, not just width.

### Common responsive moves

| Desktop pattern | Narrow-screen adaptation |
|---|---|
| Multi-column form | Single-column flow with preserved field grouping |
| Dense action bar | Primary action visible, secondary actions collapsed intentionally |
| Wide data table | Horizontal scroll as last resort; prefer column priority or alternate row view |
| Sidebar detail panel | Stack below content or move to drawer when context permits |

## 6. Layout and Overflow Checks

- Check wrapping, truncation, and overflow intentionally.
- Confirm sticky headers, tables, dropdowns, and side panels behave in narrow and wide layouts.
- Use container-local adaptation where the component can appear in multiple width contexts.
- Prefer resilient layout primitives over breakpoint-heavy one-off hacks.

### Touch and target size

- Important interactive targets should remain easy to hit on touch devices.
- Do not rely on tiny icon-only controls when the action matters.
- Preserve enough spacing between adjacent actions to reduce accidental taps.

## 7. Common Failure Modes

- Clickable things that are not focusable
- Dialogs that trap focus incorrectly or fail to restore it
- Dropdowns clipped by overflow containers
- Validation text disconnected from the relevant field
- Important actions pushed below the fold or off-screen on narrow viewports
- Dense desktop layouts simply squeezed onto mobile without rethinking grouping

## 8. Review Checklist

- [ ] Keyboard-only interaction works in the changed area
- [ ] Focus is visible and sensible
- [ ] Labels, helper text, and errors are correctly associated
- [ ] Status is not color-only
- [ ] Narrow viewport layout remains usable
- [ ] Important controls remain reachable and clear on touch-sized screens
- [ ] Menus, drawers, dialogs, and popovers escape overflow and behave predictably
