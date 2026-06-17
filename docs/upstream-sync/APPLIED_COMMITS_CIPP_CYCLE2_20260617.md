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
| `5709f856` | fix: update terminology from "Temporary Access Password" to "Temporary Access Pass" | **Applied (adapted)** | Manual UI-text port in `CippUserActions.jsx` only (label + confirmText). `standards.json` TAP strings already correct — **Already implemented**, no file change |

**Applied commits:** `5709f856` (adapted, partial scope)  
**Branch tip after cycle:** see `git log -1` on branch (code + docs)

## Pre-checks (protected areas)

All three commits touched only `src/data/Extensions.json`, `src/data/standards.json`, and/or `src/components/CippComponents/CippUserActions.jsx`. None modified Quarantine, Email Troubleshooter, branding/manage365-version, tenant switching, auth, navigation, `package.json`, ApiCall helpers, or dashboard v2.

## Per-commit detail

### `c15d1d0d` — Sherweb Extensions conditional fields

- **Files:** `src/data/Extensions.json`
- **Protected-area check:** Pass
- **Action:** `git cherry-pick -x c15d1d0d` → **CONFLICT** in `src/data/Extensions.json`
- **Resolution:** Stopped per policy; `git cherry-pick --abort`
- **Do not retry** in cycle 2 without Sherweb block present.

### `f768330c` — standards.json tag fix (CIS / SMB1001 join vs registration)

- **Files:** `src/data/standards.json`
- **Protected-area check:** Pass
- **Action:** `git cherry-pick -x f768330c` → **CONFLICT** in `standards.json`
- **Resolution:** Stopped per policy; `git cherry-pick --abort`
- **Equivalence:** Tag move appears already reflected on `main` with updated CIS catalog version.
- **Do not retry** in cycle 2.

### `5709f856` — TAP terminology

- **Files (upstream):** `src/components/CippComponents/CippUserActions.jsx`, `src/data/standards.json`
- **Protected-area check:** Pass (component not in protected list)
- **Action:** Cherry-pick failed (conflict); **manual adapted apply** on 2026-06-17
- **Changes:**
  - `CippUserActions.jsx`: `Create Temporary Access Password` → `Create Temporary Access Pass`; confirm dialog wording updated to match
  - `standards.json`: no edit — TAP labels/help already use "Temporary Access Pass"
- **Validation:** Diff limited to two user-visible strings; no logic, API URL, permissions, or field changes

## JSON validation (post-cycle, working tree)

Validated with `python3 -m json.tool` equivalent (`json.load`):

| File | Result |
|------|--------|
| `src/data/Extensions.json` | OK |
| `src/data/standards.json` | OK |
| `src/data/AuditLogTemplates.json` | OK |

## Issues / next steps

1. **Sherweb (`c15d1d0d`):** Deferred — requires upstream Sherweb `Extensions.json` block (or equivalent Manage365 integration) before conditional-field fix can apply cleanly.
2. **Standards tags (`f768330c`):** Deferred / satisfied on fork; document CIS version divergence if BPA mapping depends on exact tag strings.
3. **Cycle 2 continuation:** Pick next upstream frontend-only commits from delta inventory; avoid re-attempting Sherweb, `f768330c`, or full cherry-pick of `5709f856`.
4. **Optional:** Audit other UI surfaces for legacy "Temporary Access Password" strings outside this commit scope (e.g. templates) if inventory lists them.

