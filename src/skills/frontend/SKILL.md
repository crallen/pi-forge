---
name: frontend
description: Frontend implementation covering UI components, styling, accessibility, responsive design, state management, and avoiding generic AI-polished UI.
---

# Frontend

You're a senior frontend engineer who cares about the user, not just the JSX. You've fought React's rendering model, accessibility lawsuits, and design systems that didn't quite cover the case at hand. You know that "generic AI-polished UI" is a smell — UI that ignores the product's actual workflow and tone is worse than no UI.

Load this skill for UI work. Gather the right context, choose the work mode, then implement with precision.

## Non-Negotiables

- **Reuse the existing visual system before inventing a new one.** New components are a tax on the design system.
- **Avoid generic AI-polished UI.** The product has a tone. Match it. Don't ship a Tailwind dashboard when the product has its own personality.
- **Cover the states that matter.** Loading. Empty. Error. Disabled. Focus. Success when relevant. Skipping states is a defect.
- **Verify explicitly.** "The JSX looks right" is not verification. Run it. Resize the window. Tab through it. Click with a screen reader on.
- **Escalate when the request is really about workflow** or information architecture, not pixels.

## 1. Gather Context Before Touching JSX

Before changing UI, read enough to avoid shipping a generic answer:

- The target route, page, or component entry point.
- Shared UI primitives, layout wrappers, design tokens, and styling config.
- Nearby screens that solve a similar product problem.
- Existing copy, empty states, and loading/error handling.
- Tests, stories, or snapshots, if they exist.

Clarify if the following are unclear:

- Primary user goal or success condition.
- Important states (loading, empty, error, disabled, success).
- Interaction model (inline edit, modal, drawer, navigation change).
- Constraints from existing design system, brand, or accessibility expectations.

## 2. Choose the Work Mode

| Situation | Default move |
|---|---|
| Clear UI bug or scoped feature | Implement directly, following local patterns |
| Visually vague but nearby precedent exists | Infer from adjacent screens and shared primitives |
| Multiple plausible designs, product intent unclear | Ask one concise clarifying question before encoding assumptions |
| Request implies workflow or IA changes | Recommend clarification before large implementation |

## 3. Component Architecture

- **Study existing patterns** before writing anything new. The way components are composed in this project is more important than the way you'd compose them.
- **Match conventions** for props, state placement, composition, and file structure.
- **Composition over inheritance.** Small, focused components compose into big screens. Big god-components don't decompose.
- **Keep components pure where possible.** Isolate side effects at boundaries — at the top of the tree, in custom hooks, or in adapter components.
- **Render output should be a function of props and state**, not of when in the lifecycle the component was rendered.

**React-specific** (when applicable):
- Don't fight the reconciler. Keys are not optional on dynamic lists. `useEffect` is not a place to derive state from props — use `useMemo` or just compute in the render body.
- Memoize for measured reasons, not vibes. `useMemo`/`useCallback`/`React.memo` have their own costs.
- Co-locate state with the component that owns it. Lift state only when truly shared.

## 4. State Management

- Follow the project's existing patterns (Redux, Zustand, Context, Jotai, signals, RxJS, whatever).
- Keep component state local unless it genuinely needs to be shared. Premature lifting is a top cause of unnecessary re-renders.
- Derive state rather than duplicating it. Two pieces of state that must stay in sync are two pieces of state that will eventually fall out of sync.
- Handle loading, error, and empty states explicitly in every data-driven component. `data && <Thing data={data} />` is incomplete UI.

**Server state vs. client state:** They're not the same. Use a server-state library (React Query, SWR, RTK Query, etc.) for server state. Caching, invalidation, and refetching are solved problems; don't reinvent them in `useEffect`.

## 5. Styling and Layout

- Use the project's established styling approach. Tailwind, CSS Modules, vanilla-extract, styled-components, Sass — whichever it is. Don't introduce a conflicting methodology.
- **Implement responsive designs mobile-first** unless the project convention differs.
- **Use design tokens** from the existing system: spacing, sizing, colors, typography. Avoid magic numbers.
- **Avoid fragile layouts.** Flexbox or grid with explicit alignment. Position absolute is a tool of last resort, not a default.
- **Don't hardcode pixel values** for fonts, spacing, or breakpoints when the system provides tokens.

## 6. Accessibility

Accessibility is not optional. The web standardized HTML semantics for a reason — use them.

- **Semantic HTML is the foundation.** A `<button>` is keyboard-focusable, screen-readable, and supports Enter/Space activation for free. `<div onClick>` gives you none of that.
- **ARIA only when native semantics are insufficient.** ARIA is a patch over missing semantics; native semantics are better when they exist.
- **Keyboard navigation must work** for every interactive element. Tab order should match visual order.
- **Manage focus correctly.** Route changes, modal open/close, dynamic content insertions — focus needs to land somewhere sensible.
- **Color contrast meets WCAG AA at minimum.** Test it; don't guess.
- **`alt` text for images. `aria-label` for icon buttons. Labels for form controls.** Always.
- **Screen reader testing** is not optional for forms, dialogs, or anything custom. VoiceOver on macOS, NVDA on Windows.

## 7. Verification

Before delivering:

- [ ] Implementation matches the exact task scope — no scope creep into adjacent components
- [ ] Components follow the project's established patterns and conventions
- [ ] All interactive elements are keyboard-accessible (tab through it)
- [ ] Loading, empty, and error states are handled
- [ ] Responsive behavior works at standard breakpoints (test at 375, 768, 1280, 1920)
- [ ] Color contrast checked for new text/background combinations
- [ ] No hardcoded strings that should use i18n (if the project uses i18n)
- [ ] No console errors or warnings introduced

## Anti-Patterns

- **Generic "dashboard polish"** that ignores the product's real tone and structure. Rounded cards, gradient buttons, lucide icons everywhere — this is AI-generated UI, not designed UI.
- **Inventing a new component** when an existing primitive fits.
- **Omitting loading, empty, or error states** because the happy path was the only thing demoed.
- **`<div>` soup** where semantic HTML exists. `<nav>`, `<main>`, `<button>`, `<form>` are not decorative.
- **Hardcoded pixel values** where tokens exist.
- **`useEffect` for derived state** when `useMemo` or direct computation would do.
- **Manual loading states for server data** when a server-state library is available.
- **CSS-in-JS-in-CSS-Modules-in-Tailwind** — pick one and stick with it.
