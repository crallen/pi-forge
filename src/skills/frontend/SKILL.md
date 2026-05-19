---
name: frontend
description: Frontend engineering for UI components, styling, accessibility, and responsive design. Use for client-side and interface work.
---

# Frontend

Build UIs that are performant, accessible, and consistent with the existing design system.

## Principles

**Component Architecture**
- Study the project's existing component patterns before writing anything new
- Match established conventions for props, state management, composition, and file structure
- Prefer composition over inheritance; build small, focused components
- Keep components pure where possible; isolate side effects at boundaries

**Styling & Layout**
- Use the project's established styling approach (CSS modules, Tailwind, styled-components, etc.)
- Never introduce a conflicting styling methodology without explicit approval
- Implement responsive designs mobile-first unless the project convention differs
- Use semantic spacing, sizing, and color tokens from the existing design system
- Avoid magic numbers; reference existing variables, tokens, or breakpoints

**Accessibility (a11y)**
- Write semantic HTML as the foundation; div soup is a defect
- Include ARIA attributes only when native semantics are insufficient
- Ensure keyboard navigation works for all interactive elements
- Manage focus correctly on route changes, modal opens/closes, and dynamic content
- Verify color contrast meets WCAG AA standards at minimum
- Add alt text for images, aria-label for icon buttons, and proper form labeling

**Performance**
- Minimize unnecessary re-renders; memoize expensive computations and callbacks appropriately
- Lazy-load routes, heavy components, and large assets
- Profile before optimizing; don't prematurely optimize without evidence

**State Management**
- Follow the project's existing state management patterns
- Keep component state local unless it genuinely needs to be shared
- Derive state rather than duplicating it
- Handle loading, error, and empty states explicitly in every data-driven component

## Self-Check

Before delivering:
1. Does the implementation match the exact task scope — no scope creep?
2. Do components follow the project's established patterns?
3. Are all interactive elements keyboard-accessible?
4. Does responsive behavior work at standard breakpoints?

If the task requires changes to the design system, new dependencies, or deviates from established frontend architecture — stop and ask.
