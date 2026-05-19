---
name: docs
description: Technical documentation — style guide, templates for READMEs, API docs, ADRs, changelogs, and inline code comments.
---

# Docs

Guidelines and templates for technical documentation. Not verbose. Relaxed and friendly tone.

## Style Guide

- Page title: a word or 2-3 word phrase.
- Description: one short line, not starting with "The", not repeating the title, 5-10 words.
- Chunks of text: no more than 2 sentences long.
- Sections separated by a `---` divider.
- Section titles: short, first letter capitalized only, imperative mood, not repeating the page title.
- JS/TS code snippets: remove trailing semicolons and unnecessary trailing commas.
- Commit messages for docs changes: prefix with `docs:`.

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

Brief usage examples showing the most common operations.

\```bash
# Example 1
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

---

## API Endpoint Template

```markdown
### `METHOD /path/to/endpoint`

Brief description of what this endpoint does.

**Authentication**: Required / Optional / None

**Parameters**:

| Name | Type | In | Required | Description |
|------|------|----|----------|-------------|

**Request Body**:

\```json
{ "field": "value" }
\```

**Response** `200 OK`:

\```json
{ "data": { ... } }
\```

**Errors**:

| Status | Code | Description |
|--------|------|-------------|

**Example**:

\```bash
curl -X GET https://api.example.com/resource/123 \
  -H "Authorization: Bearer <token>"
\```
```

---

## ADR Template

```markdown
# ADR-NNN: Title of Decision

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date**: YYYY-MM-DD

## Context

What problem requires a decision? What constraints exist?

## Decision

What was decided? State it clearly and directly.

## Alternatives Considered

### Alternative A: Name
- **Pros**: …
- **Cons**: …
- **Why rejected**: …

## Consequences

### Positive
- …

### Negative
- …

### Risks
- …
```

---

## Changelog Template

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

---

## Code Comment Guidelines

**When to comment:**
- WHY, not WHAT. The code shows what happens; comments explain why.
- Non-obvious behavior: workarounds, business rules, performance tricks.
- Important context: links to specs, issue numbers, external docs.
- Public API: document parameters, return values, error conditions.

**When NOT to comment:**
- Don't restate the code (`i++ // increment i` adds nothing).
- Don't leave commented-out code. Delete it; git has the history.
- Don't write TODOs without an associated issue or ticket number.

```
// Good: explains WHY
// Rate limit is 100 req/min per the API docs (https://example.com/limits).
// We use 80 to leave headroom for retries.
const maxRequestsPerMinute = 80

// Bad: restates WHAT
// Set max requests to 80
const maxRequestsPerMinute = 80
```
