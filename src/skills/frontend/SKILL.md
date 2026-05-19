---
name: frontend
description: Frontend implementation covering UI components, styling, accessibility, responsive design, state management, and avoiding generic AI-polished UI.
---

# Frontend

Load this skill for frontend work. Gather the right context, choose the work mode, then implement with precision.

## Non-Negotiables

- Reuse the existing visual system before inventing a new one.
- Avoid generic AI-polished UI that ignores the product's actual workflow and tone.
- Cover the states that matter: loading, empty, error, disabled, focus, and success when relevant.
- Verify explicitly. Do not stop at "the JSX/CSS looks right."
- Escalate when the request is really about workflow, information architecture, or product direction.

## 1. Gather Context First

Before changing UI, read enough to avoid shipping a generic answer.

**Read these sources:**
- The target route, page, or component entry point
- Shared UI primitives, layout wrappers, tokens, and styling config
- Nearby screens that solve a similar product problem
- Existing copy, empty states, and loading/error handling
- Tests, stories, or snapshots if they exist

**Clarify when these are missing:**
- Primary user goal or success condition
- Important states (loading, empty, error, disabled, success)
- Interaction model (inline edit, modal, drawer, navigation change)
- Constraints from existing design system, brand, or accessibility expectations

## 2. Choose the Work Mode

| Situation | Default move |
|---|---|
| Clear UI bug or scoped feature | Implement directly, following local patterns |
| Visually vague but nearby precedent exists | Infer from adjacent screens and shared primitives |
| Product intent is unclear and multiple designs are plausible | Ask concise clarifying questions before encoding assumptions |
| Request implies broader workflow or IA changes | Recommend clarification before large implementation |

## 3. Component Architecture

- Study the project's existing component patterns before writing anything new.
- Match established conventions for props, state management, composition, and file structure.
- Prefer composition over inheritance; build small, focused components.
- Keep components pure where possible; isolate side effects at boundaries.

**State management:**
- Follow the project's existing patterns (Redux, Zustand, Context, signals, etc.)
- Keep component state local unless it genuinely needs to be shared.
- Derive state rather than duplicating it.
- Handle loading, error, and empty states explicitly in every data-driven component.

## 4. Styling & Layout

- Use the project's established styling approach (CSS modules, Tailwind, styled-components, etc.)
- Never introduce a conflicting styling methodology without explicit approval.
- Implement responsive designs mobile-first unless the project convention differs.
- Use semantic spacing, sizing, and color tokens from the existing design system.
- Avoid magic numbers; reference existing variables, tokens, or breakpoints.

## 5. Accessibility (a11y)

- Write semantic HTML as the foundation; div soup is a defect.
- Include ARIA attributes only when native semantics are insufficient.
- Ensure keyboard navigation works for all interactive elements.
- Manage focus correctly on route changes, modal opens/closes, and dynamic content.
- Verify color contrast meets WCAG AA standards at minimum.
- Add alt text for images, aria-label for icon buttons, and proper form labeling.

## 6. Verification Checklist

Before delivering:
- [ ] Implementation matches the exact task scope — no scope creep
- [ ] Components follow the project's established patterns
- [ ] All interactive elements are keyboard-accessible
- [ ] Loading, empty, and error states are handled
- [ ] Responsive behavior works at standard breakpoints
- [ ] No hardcoded strings that should use i18n (if the project uses i18n)

## Anti-Patterns

- Generic "dashboard polish" that ignores the product's real tone and structure
- Inventing a new design system component when an existing primitive fits
- Omitting loading and error states
- div soup where semantic HTML elements exist
- Hardcoded pixel values where tokens should be used
