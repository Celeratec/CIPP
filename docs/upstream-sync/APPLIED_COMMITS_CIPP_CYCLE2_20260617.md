# CIPP Frontend — Upstream Sync Cycle 2 Mini-Batch (2026-06-17)

**Branch:** `manage365/upstream-sync-cipp-cycle2-20260617`  
**Base:** `main` @ `c88e7c9edc3dc8d14cf208884a8f69b9d0775bd2`  
**Backup tag:** `backup/pre-upstream-sync-cipp-cycle2-20260617` (created)  
**Pushed:** No

## Summary

| SHA | Subject | Status | Notes |
|-----|---------|--------|-------|
| `c15d1d0d` | fix: sherweb integration conditional fields | **Skipped (conflict)** | `Extensions.json` merge conflict — local fork has no Sherweb integration block; upstream patch targets Sherweb conditional `.value` field paths |
| `f768330c` | fix(standards): move CIS 5.1.4.1 and SMB1001 (2.8) tags to join standard | **Skipped (conflict / already implemented)** | Cherry-pick conflict on `standards.json`. Local `standards.intuneRestrictUserDeviceJoin` already carries `CIS_5_1_4_1` / `SMB1001_2_8` tags; registration standard tags already empty (CIS version string differs: local `CIS M365 7.0.0` vs upstream `6.0.1`) |
| `5709f856` | fix: update terminology from "Temporary Access Password" to "Temporary Access Pass" | **Skipped (conflict)** | Pre-check files: `CippUserActions.jsx`, `standards.json` (batch note referenced `AuditLogTemplates.json` — **not** in this commit). Conflict in `CippUserActions.jsx`; partial TAP wording already present in `standards.json` from other changes |

**Applied commits:** none  
**Branch tip after cycle:** `c88e7c9edc3dc8d14cf208884a8f69b9d0775bd2` (unchanged from base; no cherry-picks landed)

## Pre-checks (protected areas)

All three commits touched only `src/data/Extensions.json`, `src/data/standards.json`, and/or `src/components/CippComponents/CippUserActions.jsx`. None modified Quarantine, Email Troubleshooter, branding/manage365-version, tenant switching, auth, navigation, `package.json`, ApiCall helpers, or dashboard v2.

## Per-commit detail

### `c15d1d0d` — Sherweb Extensions conditional fields

- **Files:** `src/data/Extensions.json`
- **Protected-area check:** Pass
- **Action:** `git cherry-pick -x c15d1d0d` → **CONFLICT** in `src/data/Extensions.json`
- **Resolution:** Stopped per policy; `git cherry-pick --abort`

### `f768330c` — standards.json tag fix (CIS / SMB1001 join vs registration)

- **Files:** `src/data/standards.json`
- **Protected-area check:** Pass
- **Action:** `git cherry-pick -x f768330c` → **CONFLICT** in `src/data/standards.json`
- **Resolution:** Stopped per policy; `git cherry-pick --abort`
- **Equivalence:** Tag move appears already reflected on `main` with updated CIS catalog version.

### `5709f856` — TAP terminology

- **Files:** `src/components/CippComponents/CippUserActions.jsx`, `src/data/standards.json`
- **Protected-area check:** Pass (component not in protected list)
- **Action:** `git cherry-pick -x 5709f856` → **CONFLICT** in `CippUserActions.jsx` (standards auto-merged)
- **Resolution:** Stopped per policy; `git cherry-pick --abort`
- **Follow-up:** Manual port of TAP label/confirm strings in `CippUserActions.jsx` may still be needed (`Temporary Access Password` remains locally).

## JSON validation (post-cycle, working tree)

Validated with `python3 -m json.tool` equivalent (`json.load`):

| File | Result |
|------|--------|
| `src/data/Extensions.json` | OK |
| `src/data/standards.json` | OK |
| `src/data/AuditLogTemplates.json` | OK |

## Issues / next steps

1. **Sherweb (`c15d1d0d`):** Requires upstream Sherweb `Extensions.json` block (or equivalent Manage365 integration) before conditional-field fix can apply cleanly.
2. **Standards tags (`f768330c`):** Treat as satisfied on fork; document CIS version divergence if BPA mapping depends on exact tag strings.
3. **TAP (`5709f856`):** Resolve `CippUserActions.jsx` conflict manually or apply targeted string updates; verify `AuditLogTemplates.json` separately if TAP strings exist there (not part of upstream commit `5709f856`).
