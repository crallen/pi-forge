# Frontend Verification Reference

Use this reference when you need explicit proof for frontend work: before handoff, after a risky UI change, or whenever the user asked for tests, validation, or confidence in what changed.

## 1. Verification Ladder

Use the strongest practical proof available.

1. **Static review** - Check structure, semantics, local consistency, and state coverage.
2. **Targeted behavior proof** - Run or update focused tests when behavior is important or fragile.
3. **Visual/state review** - Inspect default, hover, focus, disabled, loading, empty, error, and success states as applicable.
4. **Responsive review** - Check narrow and wide layouts, wrapping, overflow, and alignment.
5. **Accessibility review** - Confirm keyboard access, focus visibility, labeling, and non-color-only cues.
6. **Build/lint proof** - Run the relevant build, lint, typecheck, or test command when available.

Report both what you verified and what you could not verify directly.

### Preferred proof order

| Stronger proof | Weaker proof |
|---|---|
| Browser/manual interaction + targeted tests | Code inspection alone |
| Changed-state review with explicit notes | Generic "looks good" |
| Narrow + wide viewport confirmation | Desktop-only reasoning |

## 2. State Coverage Checklist

- [ ] Default state renders correctly
- [ ] Loading/skeleton/busy state is present when work is asynchronous
- [ ] Empty state explains the situation and next action when relevant
- [ ] Error state is visible, specific, and recoverable when possible
- [ ] Disabled state is intentional and understandable
- [ ] Success/confirmation state appears where user confidence matters

## 3. Interaction and Layout Checklist

- [ ] Primary action is obvious
- [ ] Hover, focus, pressed, selected, and disabled states are coherent
- [ ] Keyboard-only interaction works for all changed controls
- [ ] Content wraps or truncates intentionally
- [ ] No important action or data is pushed off-screen
- [ ] Spacing and alignment remain consistent across likely breakpoints
- [ ] Menus/popovers/dialogs render and position correctly in realistic layouts

## 4. Accessibility Checklist

- [ ] Semantic elements are used where possible
- [ ] Form fields have labels and associated errors
- [ ] Contrast is sufficient for text and key UI elements
- [ ] Status is not conveyed by color alone
- [ ] Non-essential animation respects `prefers-reduced-motion`

## 5. Proof Note Template

Use a concise handoff note like this:

```markdown
Verified:
- [what you checked directly]
- [tests/commands run]

Not verified directly:
- [browser/manual/device checks still needed]
```

### Example

> Verified the updated filter panel in default, open, keyboard-focus, loading, and empty-result states. Ran `pnpm test -- filter-panel` and `pnpm lint`. I could not run a browser in this environment, so final responsive spacing and mobile overflow behavior should be confirmed in-browser.

### Good handoff habits

- Name the states you checked instead of saying "verified UI"
- Name the commands you ran instead of saying "tests passed"
- Name the missing proof instead of implying certainty you do not have

## 6. Anti-Patterns

- Claiming a UI is "done" without discussing changed states
- Reporting only tests while ignoring visible interaction/accessibility regressions
- Assuming responsive behavior from desktop code inspection alone
- Hiding uncertainty instead of naming what still needs browser or human validation
