# Frontend Design Direction Reference

Use this reference when the work needs stronger design judgment: shaping a screen, improving hierarchy, avoiding generic UI, or making a product surface feel intentional without drifting into unrealistic redesign.

## 1. Start With Screen Intent

Before styling details, answer:

1. What is the user's main task on this screen?
2. What should feel primary vs secondary?
3. What must be scannable in a few seconds?
4. What nearby screen or shared primitive already sets the local visual language?

If those answers are unclear, avoid elaborate styling decisions and clarify first.

## 2. Choose a Direction, Not Random Polish

Good application UI usually wants one of these moves:

| Move | When it helps | Typical result |
|---|---|---|
| **Clearer** | The UI is confusing or dense | Stronger hierarchy, better labels, cleaner grouping |
| **Quieter** | The UI is visually loud or unfocused | Fewer accents, calmer surfaces, clearer primary action |
| **Bolder** | The UI hides the important thing | More deliberate emphasis, stronger contrast, clearer focal point |
| **Tighter** | Related information feels disconnected | Reduced spacing inside groups, better pairings, less chrome |
| **More breathable** | Scanning feels cramped | Better section spacing, fewer competing borders and fills |

Pick one dominant move per screen or component. Too many simultaneous design goals create muddled UI.

## 3. Typography

### Good defaults

- Use typography to establish hierarchy before adding decorative UI.
- Make the page or component title earn its prominence through contrast, not just size inflation.
- Keep the number of text styles small on a single screen.
- Reserve heavier weights for true emphasis: titles, totals, selected items, key status.
- Prefer readable body text over compressed, low-contrast "clean" aesthetics.
- Reuse the product's existing type system first; only introduce new type treatment when the current screen genuinely lacks a usable pattern.
- Keep body copy to readable line lengths; long passages need width constraints, not smaller text.
- Use labels, captions, and helper text to reduce ambiguity, not to fill space.

### Watch for

- Too many font sizes or weights in one component
- Tiny secondary text that carries important meaning
- Uppercase labels used so broadly that everything feels equally loud
- Weak hierarchy compensated for by color or icons alone
- Font changes used as a shortcut for redesign instead of solving structure first

### Practical hierarchy pattern

| Layer | Typical job | Common mistake |
|---|---|---|
| Page title | Establish the screen's purpose | Styled too similarly to section titles |
| Section title | Group related content | Made loud enough to compete with the page title |
| Label / metadata | Support scanning | Too small or too faint to read quickly |
| Helper / hint text | Reduce uncertainty | Repeats the label without adding meaning |

## 4. Color and Surfaces

### Good defaults

- Treat color as semantic reinforcement: success, warning, danger, selection, emphasis.
- Let neutral surfaces and spacing do most of the structural work.
- Use stronger contrast on the most important action or piece of information, not everywhere.
- Keep borders, fills, and shadows consistent with the surrounding UI.
- If the project supports modern color functions, prefer maintainable token-based colors over hard-coded one-off values.
- If you introduce new tokens and the stack supports it, prefer perceptually steadier colors (`oklch`, `color-mix`) over ad hoc HSL tweaking.
- Tint neutrals toward the product palette only subtly and only when that matches the established system.

### Watch for

- Multiple accent colors competing in the same view
- Decorative gradients or saturated fills with no product precedent
- Status conveyed only by color, without text/icon/shape support
- Contrast reduction in the name of minimalism
- Introducing a new palette for a single screen when shared tokens already exist
- Gray text on colored surfaces, which usually looks washed out and under-powered

### Hard cautions

- Avoid gradient text. It is usually decorative noise, not meaningful hierarchy.
- Avoid colored side-stripe borders on cards, alerts, or list items as a default accent treatment unless the product already relies on them.
- Avoid pure-black/pure-white extremes when the existing system uses softened surfaces and text.

## 5. Space and Layout

### Good defaults

- Use spacing to communicate grouping, rhythm, and importance.
- Align to the nearest established layout rhythm instead of introducing a new one.
- Increase separation between groups before increasing decoration inside each group.
- Keep related label/value, title/action, and field/error pairs visually tight.
- Use asymmetry or denser/lighter regions only when they improve emphasis or scanning.
- Prefer `gap` and layout primitives over one-off margin piles when structuring related content.
- Let density match the product context: operational tools can be denser; decision-heavy screens often need more breathing room.

### Watch for

- Uniform spacing everywhere, which removes hierarchy
- Cramped cards/forms with no room for scanning
- Large empty gaps caused by one-off spacing overrides
- Misaligned controls, titles, or content baselines
- Cards inside cards when simple sectioning would do

### Common layout moves

| Problem | Better move |
|---|---|
| The screen feels noisy | Remove chrome first; then rebalance spacing |
| Users miss the main action | Increase hierarchy contrast near the action, not everywhere |
| Content feels disconnected | Tighten spacing inside groups, expand spacing between groups |
| Everything looks equally important | Reduce accents, reduce title count, and create one focal path |

## 6. Motion and Interaction Tone

### Good defaults

- Motion should explain state changes, not call attention to itself.
- Keep transitions brief and tied to interaction: hover, expand/collapse, dialog/drawer entry.
- Prefer opacity and transform changes over layout-janking animation.
- Ensure non-essential motion respects `prefers-reduced-motion`.
- Give controls coherent states: default, hover, focus, pressed, disabled, loading.
- Use easing that feels intentional and calm; dramatic bounce or elastic motion rarely fits application UI.
- Keep feedback close to the interaction point: inline validation, button busy state, in-place confirmation.

### Watch for

- Slow transitions that make the UI feel unresponsive
- Animation added where instant feedback would be clearer
- Multiple overlapping effects on the same element
- Motion used to hide weak interaction design
- Every button styled as primary, leaving no hierarchy

### State design checklist

- [ ] Primary actions are visually distinct but not dominant everywhere
- [ ] Hover and focus are related, not two different design systems
- [ ] Disabled controls still communicate intent and reason when needed
- [ ] Loading states preserve layout stability where possible

## 7. Copy and Feedback Tone

- Labels should reflect the real task, not internal implementation language.
- Empty states should explain what happened and what to do next.
- Error messages should be specific enough to unblock action.
- Helper text should reduce uncertainty, not restate the label.
- Success states should reassure without creating noise.

### Prefer

- Action-oriented button labels (`Save changes`, `Invite member`, `Retry sync`)
- Empty states that teach the next step
- Inline confirmation when the action scope is local

### Avoid

- Vague CTA labels (`Continue`, `Submit`) when the action has a clearer name
- Empty states that are emotionally styled but instructionally useless
- Toast spam for routine, low-risk actions

## 8. Anti-Pattern Check

For deeper smell detection and audit language, consult `reference/anti-patterns.md`.

If the UI still feels generic after implementation, ask which of these is missing:

1. clearer task hierarchy
2. stronger use of local precedent
3. less decorative clutter
4. more explicit state handling

## 9. Escalate Instead of Improvising

Recommend broader spec/design clarification when:

- The request changes information architecture, navigation, or multi-screen flow
- Brand direction or visual tone is explicitly in question
- Multiple plausible UI patterns would materially change user behavior
- The current design system is too incomplete to support a confident implementation
