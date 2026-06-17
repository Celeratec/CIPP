# Applied Commits Tracking — CIPP (Frontend)

Generated: 2026-06-17  
Branch: `manage365/upstream-sync-cipp-20260617`  
Backup tag: `backup/pre-upstream-sync-cipp-20260617`  
Branch tip (after mini-batch 3 attempt): `3c0ef6904` (no code changes)

## Summary

| Status | Count |
|--------|-------|
| Applied cleanly | 3 |
| Applied with adaptation | 0 |
| Reverted (formatting-only / no net change) | 1 |
| Already implemented | 3 |
| Partially already implemented | 1 |
| Skipped (conflict) | 2 |
| Conflicts | 2 (`b1902421`, `1cd1ef72`) |

Mini-batch 1: `1e59d2d4`, `98d5d94a` applied; `c8d61c07` reverted after review.  
Mini-batch 2: `7a85827e` applied; `cfbf3508`, `db57e52a` already present; `b1902421` conflict.  
Mini-batch 3: **Stopped on first commit** — `1cd1ef72` conflict; `4b9efd82`, `3734adee` not attempted.

## Commit Log

| Upstream SHA | Applied SHA | Status | Reason | Files | Tests | Notes |
|--------------|-------------|--------|--------|-------|-------|-------|
| `1e59d2d43fab463a709d1dac2477f45cfacdfae6` | `623ac8590` | Applied cleanly | Shape test baseline update only | `Tests/Shapes/ListTests.json` | JSON parse OK | Cherry-pick `-x` succeeded; adds `ExoTransportConfig` to ListTests shape. |
| `98d5d94a0d122d5fbc7380d5abe5cb02fba366fd` | `f3c917c1a` | Applied cleanly | Custom test alert-on-status UI; pairs with API `6aa66c74` | `src/pages/tools/custom-tests/add.jsx` | Static review | `AlertStatuses` multi-select gated on `AlertOnFailure`; submit payload matches backend. |
| `c8d61c0757853359cde98f9a00e6e3ba6fe6e98e` | `aebf6ada5` → reverted `af5c9a905` | Already implemented before sync; reverted noisy formatting-only cherry-pick | JIT admin autocomplete creatable guard | `src/pages/identity/administration/jit-admin/add.jsx` | Static review post-revert | Fork already had `creatable={false}` on all five autocomplete fields. |
| `cfbf3508e1ede8b51ef6daff780356ea0379f083` | — | Already implemented | Duplicate `appliesToTest` merge for `standards.AppManagementPolicy` | `src/data/standards.json` | JSON compare | Skipped cherry-pick. |
| `db57e52a207f3e9d77974832978d88963859bf83` | — | Already implemented | TemplateList optional + non-creatable | `src/data/standards.json` | JSON compare | Skipped cherry-pick. |
| `b19024214e96bd207640c5e63dcefb38d408e161` | — | Skipped (conflict) | Tab layout first-tab margin | `HeaderedTabbedLayout.jsx`, `TabbedLayout.jsx` | Not applied | Layout conflict; needs adapted apply. |
| `7a85827ef1072955a48cb1d48c3ce2aafe3ab88d` | `bb5150d99` | Applied cleanly | Bulk patch wizard contact/UPN fields | `src/pages/identity/administration/users/patch-wizard.jsx` | Static review | Cherry-pick `-x` succeeded. |
| `1cd1ef7223672170bdce1fffe88d8bb4ddb903d9` | — | Skipped (conflict) / partially already implemented | TAP audit log template filter | `src/data/AuditLogTemplates.json` | Conflict inspect | Cherry-pick `-x` conflicted: fork already removed duplicate `ne []` filter; only remaining delta is `like` Input `"*"` vs `"*PassId*"`. Aborted per stop-on-conflict protocol. Optional 1-line manual fix. |
| `4b9efd827d27a3498eca51b444934a99e78c634f` | — | Not attempted | Licenses report `apiDataKey` | `src/pages/tenant/reports/list-licenses/index.js` | — | Blocked by mini-batch 3 stop after `1cd1ef72` conflict. |
| `3734adeeaec92e6d83974590c36a9e91bf024a98` | — | Not attempted | User defaults license label casing | `src/pages/tenant/manage/user-defaults.js` | — | Blocked by mini-batch 3 stop after `1cd1ef72` conflict. |

## Mini-batch 1 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| Protected-area scan (pre-pick) | All three commits limited to tests shape, custom-tests form, or JIT admin form |
| `Tests/Shapes/ListTests.json` | Valid JSON; `ExoTransportConfig: number` present |
| `AlertStatuses` UI (`98d5d94a`) | Multi-select with four status options; conditional on `AlertOnFailure`; matches CIPP-API backend |
| JIT creatable guard (post-revert) | Five autocomplete fields retain `creatable={false}` |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues |

## Mini-batch 2 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| JIT `add.jsx` post-revert | Five `creatable={false}` on autocompletes — no regression |
| `standards.json` (`cfbf3508`, `db57e52a`) | Upstream intent already present |
| Tab layouts (`b1902421`) | Not applied — unchanged |
| Patch wizard (`7a85827e`) | Contact/UPN fields present; submit mapping verified (static) |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues |

## Mini-batch 3 Attempt (2026-06-17)

| Step | Result |
|------|--------|
| Pre-check `1cd1ef72` | 1 file: `AuditLogTemplates.json` — no protected areas |
| Cherry-pick `1cd1ef72` | **Conflict** — fork has single `like` filter with `"*"`; upstream wants `"*PassId*"`; duplicate `ne []` block already absent in fork |
| `4b9efd82`, `3734adee` | **Not attempted** (stop-on-conflict protocol) |
| Working tree | Restored clean via `git cherry-pick --abort` |

## Proposed Next Frontend Mini-batch (4)

Skip `1cd1ef72` blind cherry-pick. Either manual 1-line `"*"` → `"*PassId*"` or mark TAP template intent satisfied.

| Priority | SHA | Title | Notes |
|----------|-----|-------|-------|
| 1 | `4b9efd82` | Licenses report `apiDataKey="Results"` | Single-line page fix — retry from mini-batch 3 |
| 2 | `3734adee` | User defaults `availableUnits` casing | Single-line fix — retry from mini-batch 3 |
| 3 | `2e9b9fd5` | Allow/block list drawer button guard | Fallback if `3734adee` conflicts |

**Alternate JSON batch:** `7054bfc4` + `1e7aef11` (alerts.json pair), then `0c32a84e` (Extensions portal links).

**Exclude:** `16b4503f`, `b1902421` (unless adapted), dependency/build/search/table commits.

## Next Steps

1. Run mini-batch 4 starting with `4b9efd82` and `3734adee` (skip or manually adapt `1cd1ef72`).
2. Optional: one-line manual TAP template fix `"*PassId*"` without full cherry-pick.
3. Open CIPP frontend PR after 2–3 successful code mini-batches align with CIPP-API PR review.
