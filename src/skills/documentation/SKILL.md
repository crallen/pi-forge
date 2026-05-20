---
name: documentation
description: Technical documentation workflow and templates for READMEs, API docs, ADRs, changelogs, and inline code comments.
---

# Documentation

Use this capability to write useful technical documentation: short, friendly, specific, and easy to scan. The goal is documentation people can use without wading through encyclopedic filler.

## Style Guide

- **Not verbose.** Cut every sentence that doesn't earn its place.
- **Relaxed and friendly tone.** You're explaining something to a colleague, not writing a legal contract.
- **Page title: a word or 2-3 word phrase.** "Authentication," "Quick Start," "Migrations." Not "How to Set Up Authentication for Your Application."
- **Description: one short line.** Doesn't start with "The." Doesn't repeat the title. 5-10 words.
- **Chunks of text: no more than 2 sentences.** Long paragraphs are where readers bounce.
- **Sections separated by a `---` divider.** Visual breaks make scanning easier.
- **Section titles: short, first letter capitalized only, imperative mood.** "Add a model," not "How to Add New Models" or "Adding New Models."
- **Don't repeat the page title in section titles.** If the page is "Models," don't have a section "Add new models." Just "Add."
- **JS/TS code snippets: remove trailing semicolons** and unnecessary trailing commas. Match what readers will actually write.
- **Commit messages for docs changes: prefix with `docs:`.**

## What to Document

| Type | When to write |
|---|---|
| README | Every repo. Quick start, usage, structure, dev commands. |
| API docs | Every public API endpoint or library function. Parameters, return values, errors, example. |
| ADR | Architectural decisions with non-obvious trade-offs. Captures the why. |
| Changelog | Every release. What users see, not what engineers shipped. |
| Inline comments | Non-obvious code only. The why, not the what. |

## What NOT to Document

- **The obvious.** `// increment counter` next to `counter++`. Adds noise.
- **The trivial.** Helper functions whose names already explain themselves.
- **Code that should be self-documenting.** If the code needs a comment to be understood, consider whether better names or structure would replace the comment.
- **Things that change frequently.** Specific versions, exact UI screenshots, transient configuration. Document the shape, not the specifics.

---

## README Template

```markdown
# Project Name

One-sentence description of what this project does and who it's for.

## Quick Start

Prerequisites:
- Dependency 1 (version)
- Dependency 2 (version)

\```bash
git clone <repo-url>
cd <project>
<install-command>
<run-command>
\```

## Usage

Brief usage examples for the most common operations.

\```bash
<command>
\```

## Project Structure

\```
project/
├── src/           # Source code
├── test/          # Tests
└── docs/          # Documentation
\```

## Development

\```bash
<test-command>
<lint-command>
<build-command>
\```

## License

<License>. See [LICENSE](LICENSE) for details.
```

A good README answers four questions in the first 30 seconds: what is this, who is it for, how do I run it, where do I go next.

---

## API Endpoint Template

```markdown
### `METHOD /path/to/endpoint`

Brief description of what this endpoint does.

**Authentication:** Required / Optional / None

**Parameters:**

| Name | Type | In | Required | Description |
|------|------|----|----------|-------------|
| `id` | string | path | yes | Resource identifier |
| `limit` | integer | query | no | Max results (default: 20, max: 100) |

**Request Body:**

\```json
{ "field": "value" }
\```

**Response** `200 OK`:

\```json
{ "data": { ... } }
\```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Request body validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |

**Example:**

\```bash
curl -X GET https://api.example.com/resource/123 \
  -H "Authorization: Bearer <token>"
\```
```

Include a real `curl` example. People will copy-paste it. Make sure it works.

---

## ADR Template

```markdown
# ADR-NNN: Title of Decision

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD

## Context

What problem requires a decision? What constraints exist? What forces are at play?

## Decision

What was decided? State it clearly and directly.

## Alternatives Considered

### Alternative A: Name
- **Pros:** …
- **Cons:** …
- **Why rejected:** …

## Consequences

### Positive
- What becomes easier or better?

### Negative
- What becomes harder or worse?

### Risks
- What could go wrong? How can the risk be mitigated?
```

ADRs are for future maintainers. The most valuable section is "why rejected" — it answers the question that comes up six months later: "why didn't we just do X?"

---

## Changelog Template

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [Unreleased]

### Added
- New feature description (#issue)

### Changed
- Modified behavior (#issue)

### Fixed
- Bug fix (#issue)

### Removed
- Removed feature (#issue)

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release features
```

Changelogs are for users. Write what changes mean to them, not what files were touched.

---

## Code Comments

### When to Comment

- **WHY, not WHAT.** The code shows what happens. Comments explain why.
- **Non-obvious behavior.** Workarounds, business rules, performance tricks, race condition fixes.
- **Important context.** Links to specs, issue numbers, external docs, RFCs.
- **Public API.** Document parameters, return values, error conditions, usage examples.

### When NOT to Comment

- Don't restate the code. `// increment i` next to `i++` adds noise.
- Don't leave commented-out code. Delete it. Git has the history.
- Don't use comments as section dividers when functions would be better.
- Don't write TODOs without an associated issue or ticket number.

### Format

```
// Good: explains WHY
// Rate limit is 100 req/min per the API docs (https://example.com/limits).
// We use 80 to leave headroom for retries.
const maxRequestsPerMinute = 80

// Bad: restates WHAT
// Set max requests to 80
const maxRequestsPerMinute = 80
```

---

## Anti-Patterns

- **Encyclopedic docs** that try to be comprehensive. Readers want the answer, not the full reference.
- **Wall-of-text intros.** Get to the useful part fast.
- **"This is easy."** Don't tell readers their confusion is unreasonable. It's condescending.
- **Outdated screenshots.** They age badly. Use text where possible.
- **Documentation as marketing.** "Our blazingly-fast, robust, enterprise-grade framework..." Just describe what it does.
- **Docs without examples.** Every non-trivial doc needs at least one runnable example.
- **Stale changelogs.** A changelog that hasn't been updated in three releases is worse than no changelog.
