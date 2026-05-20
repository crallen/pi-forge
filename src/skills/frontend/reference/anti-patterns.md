# Frontend Anti-Patterns Reference

Use this reference when auditing or refining UI quality. It catalogs common frontend mistakes, including high-frequency "AI slop" patterns, and gives better default directions for application UI.

## How to Use This Reference

- Treat it as a diagnostic tool, not a style manifesto.
- Call out anti-patterns only when they materially hurt clarity, usability, credibility, or maintainability.
- Prefer the smallest fix that improves the screen; do not use a smell as an excuse for unrelated redesign.

## 1. Generic Visual Monoculture

| Smell | Why it fails | Better move |
|---|---|---|
| Purple-blue gradients everywhere | Looks template-generated and usually ignores product context | Use existing brand or product tokens; let hierarchy do more than decoration |
| Glassmorphism/glows added by reflex | Adds visual noise and weakens readability | Use calmer surfaces, contrast, and spacing |
| Every section is a rounded card with shadow | Flattens hierarchy and creates chrome fatigue | Use section spacing and only add containers where containment helps |
| Large decorative icons above every heading | Consumes attention without improving scanning | Keep icon use purposeful and tied to action or meaning |
| Fancy empty state illustration with generic copy | Looks polished but does not help the user recover | Explain what happened and what to do next |

## 2. Weak Hierarchy Disguised as Styling

| Smell | Why it fails | Better move |
|---|---|---|
| Everything looks equally important | Users cannot find the main action or next step | Create one focal path with stronger grouping and contrast |
| Section titles compete with the page title | Screen purpose becomes muddy | Reduce section loudness and protect page-level hierarchy |
| Tiny metadata carries critical meaning | Important signals get lost | Increase contrast or placement priority |
| Color used instead of structure | Fails for accessibility and scanning | Fix layout, labels, and grouping first |
| Repeated badges/chips for every bit of information | Turns support info into clutter | Use plain text unless categorical emphasis truly helps |

## 3. Layout and Density Problems

| Smell | Why it fails | Better move |
|---|---|---|
| Cards inside cards | Creates heavy chrome and unclear grouping | Flatten the structure; use sectioning and spacing |
| Uniform spacing everywhere | Removes rhythm and importance cues | Tighten within groups, loosen between groups |
| Dense desktop layout simply shrunk to mobile | Mobile becomes stressful and error-prone | Recompose flow for narrow screens |
| Over-wide forms or prose | Slows scanning and increases fatigue | Constrain width and group related fields/content |
| One-off margin hacks everywhere | Layout becomes brittle and hard to reason about | Use shared layout primitives and `gap` |

## 4. Interaction Smells

| Smell | Why it fails | Better move |
|---|---|---|
| Every button is primary | No action hierarchy remains | Keep one primary action per region |
| Hover-only affordances | Hidden for keyboard/touch users | Make important affordances visible by default |
| Modals used for simple inline tasks | Breaks flow and adds focus complexity | Prefer inline reveal or side-panel patterns |
| Dropdowns clipped by overflow | Core actions become inaccessible | Use portals/top-layer/native popover strategies |
| Slow decorative animation on routine actions | Makes the product feel sluggish | Keep motion brief and tied to state change |

## 5. State and Feedback Smells

| Smell | Why it fails | Better move |
|---|---|---|
| Only happy path is designed | Real usage quickly feels broken | Cover loading, empty, error, disabled, and success states |
| Disabled actions with no explanation | Users do not know how to proceed | Explain missing requirements when the reason matters |
| Toast for every routine success | Creates notification fatigue | Use local/in-place confirmation when enough |
| Vague error copy | Users cannot recover | State what failed and what they can do next |
| Skeletons/spinners change layout dramatically | Feels unstable and hard to track | Preserve structure between loading and loaded states |

## 6. Copy Smells

| Smell | Why it fails | Better move |
|---|---|---|
| CTA labels like `Submit` or `Continue` everywhere | Hides actual action meaning | Name the action clearly |
| Helper text repeats the label | Adds noise instead of clarity | Use helper text only for real uncertainty |
| Placeholder as label | Disappears during input and hurts accessibility | Keep a visible label |
| Over-friendly or overly apologetic system copy | Reduces clarity in product workflows | Be direct, calm, and specific |
| Emotional marketing tone in operational UI | Feels off-brand or unserious | Match the product context and task |

## 7. High-Signal CSS/UI Cautions

These are not universal bans, but they are strong warning signs in app UI:

- Gradient text used as emphasis
- Colored side-stripe borders on cards, alerts, or list rows by default
- Excessive blur, glow, and layered shadow stacks
- Overuse of translucent surfaces that hurt contrast and readability
- Decorative sparklines or fake metrics with no decision-making value
- Icon-only actions without labels/tooltips where meaning is ambiguous

If you keep one of these patterns, there should be a clear product reason, not just visual habit.

## 8. Maintainability Smells

| Smell | Why it fails | Better move |
|---|---|---|
| One-off token or variant for a single surface | Increases system entropy | Reuse existing primitives or keep it local |
| Mega-component mixing data, layout, copy, and every interaction | Hard to change safely | Split by responsibility |
| Prop surface grows for every edge case | Component becomes unreviewable | Prefer composition or smaller focused wrappers |
| Rebuilding a design system during a feature task | Bloats scope and diff | Make the narrowest viable improvement |

## 9. Audit Prompts

When reviewing a surface, ask:

1. What is the user trying to do first?
2. What would confuse them in the first 5 seconds?
3. Which state is missing or under-designed?
4. Which visual treatment is compensating for weak structure?
5. What is the smallest change that would make this screen feel more intentional?

## 10. Reporting Guidance

When calling out anti-patterns:

- Name the concrete surface (`settings form`, `billing table`, `mobile drawer`)
- Explain why it hurts the task, not just that it looks bad
- Offer a better direction, ideally one that reuses local precedent
- Separate must-fix issues from optional polish suggestions
