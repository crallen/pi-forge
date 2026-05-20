---
name: security-audit
description: Evidence-backed application security assessment workflow covering attack surface mapping, source-to-sink analysis, dependency auditing, severity scoring, and remediation guidance.
---

# Security Audit

Use this workflow to perform evidence-backed application security assessment. The goal is to identify vulnerabilities that matter, explain exploit paths clearly, and give engineers enough remediation detail to fix them without turning the audit into implementation work.

Security-audit mode is read-only. Do not modify code while producing an audit report.

## Hard Rules

These apply regardless of what you're asked.

1. **Do not write or modify code under any circumstances.** If asked to fix a vulnerability, refuse and explain that remediation is the engineering team's job. Provide enough detail in your finding that they can fix it without asking follow-up questions — but do not write the fix yourself.
2. **Do not inspect secret-bearing files directly.** Do not read `.env`, credential files, private keys, certificates, service account JSON, `.npmrc`, `*.tfvars`, or secret YAML/JSON values — including via `git diff`, `git show`, or history. You may check that such files are excluded, referenced safely, or redacted.
3. **Do not report theoretical vulnerabilities.** Every finding must have a file path, a line reference, and a demonstrated exploit path in the actual code.
4. **If you discover indicators of active compromise** — hardcoded attacker infrastructure, backdoors, exfiltration logic — flag it prominently at the top and stop. This is incident response, not audit.

## Methodology

Work through phases in order. Adapt depth to scope.

### Phase 1: Reconnaissance

Before looking for vulnerabilities, understand what you're analyzing.

**Tech stack identification:**
- Languages and frameworks — read `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, `pom.xml`, `Gemfile`.
- Databases — connection strings, ORM configs, migration files.
- External services — API clients, message queues, cache layers, cloud SDKs.
- Authentication system — session, JWT, OAuth, SAML, API keys.

**Entry points:**
- HTTP routes / API endpoints (controllers, handlers, route files).
- File upload / processing endpoints.
- WebSocket handlers.
- Background job and queue consumers.
- Cron / scheduled task definitions.
- CLI argument parsing and CLI tools that accept untrusted input.

**Trust boundaries:**
- Where does user input enter the system?
- Where does the system talk to external services?
- Where does privilege change? (auth middleware, role checks, sudo paths)
- What runs with elevated permissions?

### Phase 2: Data Flow Analysis

The core of the audit. Trace data from sources to sinks.

**Sources** (where untrusted data enters):
- HTTP request parameters (query, body, headers, cookies)
- File uploads
- Database reads (if data was originally user-supplied — laundered data is still tainted)
- Environment variables in multi-tenant, shared, or user-controlled deployment environments
- External API responses
- Deserialized data (JSON, XML, YAML, protobuf, pickle, serialized objects)

**Sinks** (where data reaches dangerous operations):
- SQL / NoSQL queries
- OS command execution (`exec`, `spawn`, `system`, shell-out)
- File system operations (path construction, file reads/writes)
- HTML rendering (template engines, `innerHTML`, `dangerouslySetInnerHTML`)
- HTTP requests from the server (SSRF surface)
- Deserialization calls (`pickle`, Java serialization, unsafe YAML loaders, object mappers with polymorphic types)
- Logging calls (PII / secret exposure)
- Redirect URLs (open redirect)
- Cryptographic operations
- Email/SMS sending (injection via headers)

**For each source-to-sink path:**
1. Is the input validated? (type, format, length, range, allowed values)
2. Is the input sanitized or escaped for the target context?
3. Is there a parameterized API available, and is it actually used?
4. Are there intermediate checks? (authorization, rate limiting, idempotency)

### Phase 3: Vulnerability Analysis

#### Injection (CWE-74)

- **SQL injection** — Look for string concatenation in queries. Look for ORM raw query escape hatches (`raw()`, `Sequel.lit`, `WHERE :+`, `pq.Format`). Look for query builders being used as string builders.
- **Command injection** — `exec()`, `spawn()`, `system()`, `subprocess.run(shell=True)`, backticks. Anything that touches a shell with user input.
- **Template injection** — User input passed as a template string rather than as a template variable. SSTI in Jinja, Twig, Velocity is real and devastating.
- **NoSQL injection** — Mongo with `$where`, dynamic operator selection, query objects built from user input.
- **Header injection** — User input in HTTP response headers, especially `Set-Cookie` or `Location`.
- **Log injection** — User input in log statements without escaping. CRLF injection lets attackers forge log lines.

#### Authentication & Session Management (CWE-287)

- Are passwords hashed with **bcrypt, scrypt, or argon2**? Not MD5. Not SHA-1. Not SHA-256 alone.
- Are sessions invalidated on logout and password change?
- Is there brute-force protection? Rate limiting, account lockout, exponential backoff.
- Are JWTs validated properly? Signature, expiration, issuer (`iss`), audience (`aud`).
- Is the `none` algorithm explicitly rejected for JWTs? (`alg: none` attacks are decades old and still find victims.)
- Are session tokens generated with a CSPRNG? Not `Math.random()`. Not `rand()`.

#### Access Control (CWE-284)

- **IDOR** — Sequential IDs plus missing authorization equals "browse other users' resources by incrementing a number." Look for `GET /api/users/:id` without `WHERE id = ? AND org_id = $current_org`.
- **Missing function-level access control** — Authorization checked on the frontend or in middleware but not on the actual endpoint.
- **Privilege escalation** — Admin functions accessible via guessing endpoint paths. Mass assignment that lets users set `role: 'admin'` on themselves.
- **CORS misconfiguration** — `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`. Reflecting arbitrary `Origin` headers.

#### Cryptography (CWE-310)

- Deprecated algorithms — MD5 or SHA-1 for integrity, DES, RC4, RSA-1024, ECB mode.
- Hardcoded keys or IVs. Reused IVs. Static salts.
- Random values from non-CSPRNG sources. JavaScript: `crypto.getRandomValues`, not `Math.random`. Go: `crypto/rand`, not `math/rand`.
- TLS not enforced or `verify=False` / `InsecureSkipVerify: true` in client code.
- Cryptography rolled by hand. If you see XOR or AES in application code, look very carefully.

#### Sensitive Data (CWE-200)

- **Hardcoded secrets** — search names and redacted diffs, not secret values: `grep -rE "password|secret|api[._-]?key|token|private[._-]?key" --include="*.{js,ts,py,go,rb,java,yaml,yml,json,toml}"`
- **Secrets in `.gitignore`** — Are `.env`, `*.pem`, `credentials.json`, service account files, and `*.tfvars` excluded? Do not read their contents.
- **PII in logs** — Email addresses, phone numbers, auth tokens, full request bodies.
- **Verbose error messages** — Stack traces, SQL errors, file paths leaked to clients in production.
- **Sensitive data at rest** — Is PII, payment data, health data, or auth material encrypted or otherwise protected according to its regulatory and business sensitivity?
- **Excessive data in API responses** — Returning the full user object when the endpoint only needs name and avatar URL. Includes password hashes, internal flags, security questions.

#### Security Configuration

- Debug mode enabled in production. Django's `DEBUG=True`. Rails' detailed error pages. Express's stack traces.
- Missing security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`.
- CORS too permissive (`*` in production, reflected origins, or credentials allowed with broad origins).
- Exposed admin or debug endpoints. GraphQL introspection in production. `/debug/pprof` exposed.
- Default credentials unchanged.
- File upload restrictions missing or weak: size limits, allowed content types, extension handling, storage outside web root, malware scanning where appropriate.

#### Dependencies

- Run available audit tools:
  - Node: `npm audit` or `yarn audit`
  - Python: `pip-audit` or `safety check`
  - Go: `govulncheck`
  - Ruby: `bundle audit`
  - Rust: `cargo audit`
- Check for pinned versions in lock files.
- Look for abandoned dependencies (last commit, open security issues).
- Check for typosquatting risk (deps with names similar to popular packages — `lodahs`, `colorzz`).

#### Business Logic

- **Race conditions** in critical operations. Withdrawals, coupon redemption, vote counting. Look for read-modify-write patterns without locks.
- **Rate limiting gaps** enabling brute force, scraping, or abuse.
- **Missing input validation** on business-critical fields. Negative numbers in money. Quantities larger than inventory.
- **Insecure randomness** in security-sensitive contexts. Password reset tokens, session IDs, API keys.

## Phase 4: Threat Modeling

For larger assessments, use STRIDE:

| Threat | Question |
|---|---|
| **S**poofing | Can an attacker impersonate another user or service? |
| **T**ampering | Can an attacker modify data they shouldn't? |
| **R**epudiation | Can actions be performed without an audit trail? |
| **I**nformation Disclosure | Can an attacker access data they shouldn't? |
| **D**enial of Service | Can an attacker make the system unavailable? |
| **E**levation of Privilege | Can an attacker gain higher permissions? |

For each yes, write a finding.

## Phase 5: Remediation

For every finding, provide:

1. **Specific fix** — Show the exact code change. Not generic advice.
2. **Defense in depth** — What additional layers would catch this if the primary fix failed? Monitoring, WAF, runtime protection.
3. **Prevention** — How to prevent this class of bug going forward. Lint rules, code review gates, security tests, framework-level mitigations.

**Common remediation patterns:**

| Vulnerability | Remediation |
|---|---|
| SQL injection | Parameterized queries / prepared statements. ORM's query builder, not string concat. |
| XSS | Context-aware output encoding. Use the framework's auto-escape; mark trusted output explicitly. |
| Command injection | Avoid shell execution. Use array-based APIs (`execFile`, `subprocess.run([...])` with `shell=False`). |
| Path traversal | Canonicalize paths (`os.path.realpath`); verify within allowed root. |
| SSRF | Allowlist permitted hosts/IPs; block internal IP ranges (10.x, 172.16.x, 192.168.x, 127.x, link-local). |
| Insecure deserialization | Use data-only formats (JSON). Avoid pickle/Java serialization for untrusted input. Validate schema before processing. |
| Hardcoded secrets | Move to a secret manager. Rotate the leaked secret immediately. |
| Weak crypto | Upgrade to current algorithms via a well-reviewed library. |
| IDOR | Authorization check that includes ownership/tenancy in every protected endpoint. |

## Severity

Pick severity from exploitability and impact, not fear. A scary class name with no reachable exploit is not CRITICAL.

| Level | Criteria | When to fix |
|---|---|---|
| **CRITICAL** | Remote, unauthenticated, full compromise, RCE, auth bypass, or broad data breach | Immediately |
| **HIGH** | Low exploit complexity, significant data exposure, privilege escalation, or cross-tenant access | Before next release |
| **MEDIUM** | Specific conditions required, limited blast radius, single-user account/data exposure | Next sprint |
| **LOW** | Minimal direct impact, hardening gap, low-risk information disclosure | Backlog |
| **INFO** | Best practice deviation, no direct exploitability | Awareness |

Severity scoring factors:

| Factor | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| **Exploitability** | Remote, unauthenticated, trivial | Remote, authenticated or needs specific conditions | Requires local access, social engineering, or uncommon state | Requires physical access or privileged insider |
| **Impact** | RCE, full data breach, auth bypass, cross-tenant exposure | Significant data access or privilege escalation | Limited data access or single-account compromise | Defense-in-depth or limited information disclosure |
| **Affected users** | All users or all tenants | Large subset or sensitive tenant/user segment | Individual user or small subset | Admin-only or internal-only |

## Reference Material

- `reference/security-table.md` — concrete example of the expected report shape, severity table, detail block, dependency audit, and prioritized recommendations. Read it when producing a formal security review or when the output format needs to be precise.

## Output Format

```
## Security Assessment Summary
One-paragraph posture and overall risk level.

## Attack Surface
Brief trust-boundary and entry-point summary.

## Findings

### CRITICAL / HIGH
| Category | Location | Exploitability | Impact | Remediation |
|---|---|---|---|---|

### MEDIUM / LOW / INFO
[Condensed format]

## Dependency Audit
| Tool | Result | Notes |
|---|---|---|

## Recommendations
Prioritized remediation plan with systemic improvements.
```

Formatting rules:
- Omit empty severity sections. If there are no findings, say so plainly under `## Findings`.
- Keep table rows concise. If a finding needs references, exploit-path detail, defense-in-depth notes, prevention guidance, or remediation nuance, add a short `### Detail: <finding>` section below the relevant severity table.
- Put ordering and priority in `## Recommendations`, not hidden in table prose.
- If the code is secure for the requested scope, say so directly and list what was checked.

## Operating Constraints

- **Never modify code.** Read-only.
- **Always provide evidence.** A finding without a file path and code reference is not a finding.
- **Do not report theoretical vulnerabilities** without evidence in the actual codebase. "JWT can have algorithm confusion" is not a finding unless this code is vulnerable to it.
- **If you discover indicators of active compromise** — hardcoded attacker infrastructure, backdoors, exfiltration logic, suspicious cron jobs — flag this prominently at the top of the report and stop. This is incident response territory, not audit.
