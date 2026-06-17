# Applied Commits Tracking — CIPP (Frontend)

Generated: 2026-06-17  
Branch: `manage365/upstream-sync-cipp-20260617`  
Backup tag: `backup/pre-upstream-sync-cipp-20260617`  
Branch tip (after mini-batch 3 retry): `7a6c71950`

## Summary

| Status | Count |
|--------|-------|
| Applied cleanly | 5 |
| Applied with adaptation | 1 |
| Reverted (formatting-only / no net change) | 1 |
| Already implemented | 3 |
| Skipped (conflict) | 1 |
| Conflicts | 1 (`b1902421`) |

Mini-batch 1: `1e59d2d4`, `98d5d94a` applied; `c8d61c07` reverted after review.  
Mini-batch 2: `7a85827e` applied; `cfbf3508`, `db57e52a` already present; `b1902421` conflict.  
Mini-batch 3: `1cd1ef72` adapted manually; `4b9efd82`, `3734adee` cherry-picked on retry.

## Commit Log

| Upstream SHA | Applied SHA | Status | Reason | Files | Tests | Notes |
|--------------|-------------|--------|--------|-------|-------|-------|
| `1e59d2d43fab463a709d1dac2477f45cfacdfae6` | `623ac8590` | Applied cleanly | Shape test baseline update only | `Tests/Shapes/ListTests.json` | JSON parse OK | Adds `ExoTransportConfig` to ListTests shape. |
| `98d5d94a0d122d5fbc7380d5abe5cb02fba366fd` | `f3c917c1a` | Applied cleanly | Custom test alert-on-status UI; pairs with API `6aa66c74` | `src/pages/tools/custom-tests/add.jsx` | Static review | `AlertStatuses` multi-select gated on `AlertOnFailure`. |
| `c8d61c0757853359cde98f9a00e6e3ba6fe6e98e` | `aebf6ada5` → reverted `af5c9a905` | Already implemented before sync; reverted noisy formatting-only cherry-pick | JIT admin autocomplete creatable guard | `src/pages/identity/administration/jit-admin/add.jsx` | Static review post-revert | Fork already had `creatable={false}` on all five autocomplete fields. |
| `cfbf3508e1ede8b51ef6daff780356ea0379f083` | — | Already implemented | Duplicate `appliesToTest` merge | `src/data/standards.json` | JSON compare | Skipped cherry-pick. |
| `db57e52a207f3e9d77974832978d88963859bf83` | — | Already implemented | TemplateList optional + non-creatable | `src/data/standards.json` | JSON compare | Skipped cherry-pick. |
| `b19024214e96bd207640c5e63dcefb38d408e161` | — | Skipped (conflict) | Tab layout first-tab margin | `HeaderedTabbedLayout.jsx`, `TabbedLayout.jsx` | Not applied | Layout conflict; needs adapted apply. |
| `7a85827ef1072955a48cb1d48c3ce2aafe3ab88d` | `bb5150d99` | Applied cleanly | Bulk patch wizard contact/UPN fields | `src/pages/identity/administration/users/patch-wizard.jsx` | Static review | Cherry-pick `-x` succeeded. |
| `1cd1ef7223672170bdce1fffe88d8bb4ddb903d9` | `dc44bd9d1` | Applied with adaptation | TAP audit log template filter | `src/data/AuditLogTemplates.json` | JSON parse OK | Cherry-pick `-x` conflicted. Upstream duplicate `ne []` SecuredAccessPassData filter removal not applied (fork retains block). Manual 1-line: `like` Input `"*"` → `"*PassId*"`. |
| `4b9efd827d27a3498eca51b444934a99e78c634f` | `dce16f09c` | Applied cleanly | Licenses report `apiDataKey="Results"` | `src/pages/tenant/reports/list-licenses/index.js` | Static review | Cherry-pick `-x` succeeded on mini-batch 3 retry. |
| `3734adeeaec92e6d83974590c36a9e91bf024a98` | `7a6c71950` | Applied cleanly | User defaults license label casing | `src/pages/tenant/manage/user-defaults.js` | Static review | Cherry-pick `-x` succeeded; `AvailableUnits` → `availableUnits`. |

## Mini-batch 3 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| Pre-check protected areas | All three commits limited to `AuditLogTemplates.json`, licenses report, or user-defaults — no protected overlap |
| `AuditLogTemplates.json` (`1cd1ef72` adapted) | Valid JSON; TAP `like` filter Input is `"*PassId*"` |
| Licenses report (`4b9efd82`) | `CippTablePage` uses `apiDataKey="Results"` |
| User defaults (`3734adee`) | License picker label uses `option.availableUnits` |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues |

## Proposed Next Frontend Mini-batch (4)

| Priority | SHA | Title | Notes |
|----------|-----|-------|-------|
| 1 | `7054bfc4` | Add UserReportedPhishing alert | JSON-only `alerts.json` |
| 2 | `1e7aef11` | Update alerts.json intervals | JSON-only quota interval tweaks |
| 3 | `0c32a84e` | Extensions portal links | JSON-only `Extensions.json` |

**Optional:** `2e9b9fd5` (drawer button guard), `d7e8b0b5` + `1cb6a11c` (standards alignment page pair).

**Exclude:** `16b4503f`, `b1902421` (unless adapted), dependency/build/search/table commits.

## Next Steps

1. Run mini-batch 4 (alerts + extensions JSON).
2. Consider optional removal of duplicate TAP `ne []` filter to fully match upstream `1cd1ef72` (out of scope for adaptation).
3. Open CIPP frontend PR when ready to pair with CIPP-API PR #1 review.
