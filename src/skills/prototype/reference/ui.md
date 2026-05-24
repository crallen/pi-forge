# UI Prototypes

Use a UI prototype when the hard question is how the user should experience something: layout, flow, hierarchy, interaction model, or visual direction.

## Shape

Build multiple variations in one place so they can be compared quickly.

Minimum bar:

- Create at least 3 meaningfully different variations.
- Put them behind one route, story, preview, or local entry point.
- Add a visible switcher or use a URL/search param such as `?variant=compact`.
- Use the project's actual UI stack and design conventions.
- Use realistic content and data density.

Variations must differ in structure or interaction, not just color, spacing, or font weight.

## Variation Ideas

Explore different answers to the product question:

- Dashboard vs. task-focused workflow.
- Table-first vs. card-first information architecture.
- Inline editing vs. modal editing vs. dedicated edit screen.
- Progressive disclosure vs. always-visible controls.
- Wizard flow vs. single-page form.
- Empty-state-led onboarding vs. documentation-led onboarding.

## Quality Bar

Throwaway does not mean broken. Even prototypes should have:

- Clear visual hierarchy.
- Loading, empty, and error-ish states when relevant.
- Keyboard-reachable controls.
- Responsive behavior for the main target sizes.
- Realistic copy, not lorem ipsum.

If this repo has `src/skills/frontend-patterns/reference/quality-bar.md`, use it as the minimum UI bar.

## Implementation Guidance

- Locate the prototype near the UI area it explores.
- Name files/routes with `prototype`, `throwaway`, or equivalent.
- Keep data local unless remote behavior is the question.
- Avoid wiring analytics, persistence, auth changes, or production navigation unless needed to answer the question.
- Prefer obvious code over reusable abstractions.

## Finish

When done, state:

- Which variants were built.
- What question each variant answers.
- Which variant you recommend and why.
- What should happen to the prototype: delete, keep temporarily, or convert.
