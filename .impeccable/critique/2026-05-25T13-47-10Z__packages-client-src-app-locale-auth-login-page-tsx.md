---
target: login page
total_score: 26
p0_count: 1
p1_count: 2
timestamp: 2026-05-25T13-47-10Z
slug: packages-client-src-app-locale-auth-login-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loader2 during submit good; no real-time validation feedback |
| 2 | Match System / Real World | 3 | Natural labels; "New business?" slightly odd for non-B2B contexts |
| 3 | User Control and Freedom | 3 | Language toggle works; forgot-password is a visible dead end |
| 4 | Consistency and Standards | 2 | "Forgot password?" renders as a button but does nothing |
| 5 | Error Prevention | 2 | Zod validates on submit only; email typos not caught until server round-trip |
| 6 | Recognition Rather Than Recall | 4 | All fields labeled, placeholders supplement, password toggle clear |
| 7 | Flexibility and Efficiency | 3 | autoFocus, autoComplete, Enter-to-submit correct; no "remember me" |
| 8 | Aesthetic and Minimalist Design | 2 | Heading restates the wordmark; subtitle is dead copy |
| 9 | Error Recovery | 3 | Server errors categorized and human-readable; banner above form not near failing field |
| 10 | Help and Documentation | 1 | No contextual help; forgot-password dead; no email hint |

**Total: 26/40 — Acceptable**

## Anti-Patterns Verdict

The form structure is competent: no gradient text, no glassmorphism, no hero-metric template. The orange submit button is the only CTA (One Orange Rule held).

Two AI-slop tells: (1) "Sign in to Panisewa" restates the wordmark directly above it. (2) "Water delivery management platform" subtitle is developer placeholder copy never revisited.

Deterministic scan: unavailable (bundled detect.mjs binary missing from install).

## Overall Impression

Structurally sound, technically careful. Fails the "deliberate choice" test on copy and the P0 forgot-password noop.

## What's Working

1. Token compliance is tight — dispatch blue for links/focus, action orange exclusively on submit, correct shadows and borders per DESIGN.md.
2. Keyboard and focus handling is thorough: autoFocus, autoComplete, focus-visible rings on every interactive element including language toggle and eye button.
3. Server error categorization with four discrete codes mapping to human-readable messages and role="alert" for SR announcement.

## Priority Issues

**[P0] "Forgot password?" does nothing.**
Why it matters: Every user who forgets credentials hits this button, gets no feedback, and is blocked. No recovery path exists for a commercial SaaS handling real accounts.
Fix: Implement /[locale]/forgot-password route or replace the button with a disabled tooltip state until the route exists.

**[P1] "Sign in to Panisewa" redundantly restates the wordmark directly above it.**
Why it matters: Users read "Panisewa... Sign in to Panisewa" in two consecutive beats. Violates DESIGN.md "every word earns its place" and the shared Copy law against restated headings.
Fix: Change h1 i18n string value from "Sign in to Panisewa" to "Sign in" in en.ts and ne.ts.

**[P1] Subtitle "Water delivery management platform" is dead copy on the auth screen.**
Why it matters: Every person on /login already knows the app. The slot adds visual weight without communicating.
Fix: Remove the subtitle entirely, or replace with a context-specific line.

**[P2] Validate-on-submit only — no real-time email feedback.**
Why it matters: Users wait for a full network round-trip to learn their email format is wrong. The Zod schema already knows at blur time.
Fix: Add mode: 'onBlur' to useForm config.

**[P2] Error banner sits above form — eye tracking lands mid-card after submit.**
Why it matters: After submitting, visual attention is on the button. The error banner appears above, outside the attention zone for sighted users.
Fix: Move banner to between the password field and the submit button.

## Persona Red Flags

**Jordan (First-Timer)**: Clicks "Forgot password?" on day one — nothing happens. Files support ticket. Also confused by "New business? Create account" after already registering.

**Sam (Keyboard-Only)**: Tab order places show/hide toggle between password field and submit — extra Tab press on every login. Forgot-password comes after submit in tab order, mismatched with visual placement above submit.

**Priya (Nepal business owner, mobile)**: Submit button at ~36px height slightly below 44px touch target. Forgot-password is her Saturday support emergency with no resolution path.

## Minor Observations

- tracking-tight on h1 is correct.
- Water drop SVG has aria-hidden="true" — correct.
- text-slate-600 on muted text passes WCAG AA.
- role cast `as any` on user.role (line 58-59) could use the UserRole union from @panisewa/shared.

## Questions to Consider

- Forgot-password noop: target date for that route, or hide until it exists?
- Is the register flow complete enough to promote from the login screen?
- Does the login page need to earn trust for users who arrive via a shared colleague link?
