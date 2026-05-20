# Example Review Table

## Summary
The change is close, but there is one correctness issue and one maintainability issue that should be addressed before merge.

## Findings

### CRITICAL

| Location | Issue | Impact | Suggestion |
|---|---|---|---|
| `src/session/store.ts:84` | Session cleanup deletes active sessions when `expiresAt` is undefined. | Active users can be logged out unexpectedly and state can be lost. | Normalize or reject missing `expiresAt` before cleanup runs. |

### WARNING

| Location | Issue | Impact | Suggestion |
|---|---|---|---|
| `src/session/store.ts:112` | Retry/backoff policy is embedded inline in the cleanup loop. | Makes the hot path harder to read and harder to test. | Extract the retry policy into a small helper local to this module. |

## Recommendations
1. Fix the session deletion bug before merge.
2. Simplify the retry policy if you touch this path again.
