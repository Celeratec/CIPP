# Applied Commits Tracking — CIPP (Frontend)

Generated: 2026-06-17  
Branch: `manage365/upstream-sync-cipp-20260617`  
Backup tag: `backup/pre-upstream-sync-cipp-20260617`  
Branch tip (after mini-batch 2): `bb5150d99`

## Summary

| Status | Count |
|--------|-------|
| Applied cleanly | 3 |
| Applied with adaptation | 0 |
| Reverted (formatting-only / no net change) | 1 |
| Already implemented | 3 |
| Skipped (conflict) | 1 |
| Conflicts | 1 (`b1902421`) |

Mini-batch 1: `1e59d2d4`, `98d5d94a` applied; `c8d61c07` reverted after review.  
Mini-batch 2: `7a85827e` applied; `cfbf3508`, `db57e52a` already present; `b1902421` conflict.

## Commit Log

| Upstream SHA | Applied SHA | Status | Reason | Files | Tests | Notes |
|--------------|-------------|--------|--------|-------|-------|-------|
| `1e59d2d43fab463a709d1dac2477f45cfacdfae6` | `623ac8590` | Applied cleanly | Shape test baseline update only | `Tests/Shapes/ListTests.json` | JSON parse OK | Cherry-pick `-x` succeeded; adds `ExoTransportConfig` to ListTests shape. |
| `98d5d94a0d122d5fbc7380d5abe5cb02fba366fd` | `f3c917c1a` | Applied cleanly | Custom test alert-on-status UI; pairs with API `6aa66c74` | `src/pages/tools/custom-tests/add.jsx` | Static review | `AlertStatuses` multi-select gated on `AlertOnFailure`; submit payload matches backend. |
| `c8d61c0757853359cde98f9a00e6e3ba6fe6e98e` | `aebf6ada5` → reverted `af5c9a905` | Already implemented before sync; reverted noisy formatting-only cherry-pick | JIT admin autocomplete creatable guard | `src/pages/identity/administration/jit-admin/add.jsx` | Static review post-revert | Cherry-pick `-x` applied but was ~182+/183− quote reformat with no net `creatable` change — fork already had `creatable={false}` on all five autocomplete fields. Reverted via `git revert aebf6ada5`. |
| `cfbf3508e1ede8b51ef6daff780356ea0379f083` | — | Already implemented | Duplicate `appliesToTest` merge for `standards.AppManagementPolicy` | `src/data/standards.json` | JSON compare | Fork already has single merged `appliesToTest` including `ZTNA21773`, `ZTNA21896`, `ZTNA21992`; no trailing duplicate key. Skipped cherry-pick. |
| `db57e52a207f3e9d77974832978d88963859bf83` | — | Already implemented | TemplateList optional + non-creatable | `src/data/standards.json` | JSON compare | Fork CA `TemplateList` (`Select Conditional Access Template`) already has `required: false` and `creatable: false`. Skipped cherry-pick. |
| `b19024214e96bd207640c5e63dcefb38d408e161` | — | Skipped (conflict) | Tab layout first-tab margin | `HeaderedTabbedLayout.jsx`, `TabbedLayout.jsx` | Not applied | Cherry-pick `-x` conflicted in both layout files (fork has responsive `smDown` tab styling). Aborted; needs adapted partial apply if desired. |
| `7a85827ef1072955a48cb1d48c3ce2aafe3ab88d` | `bb5150d99` | Applied cleanly | Bulk patch wizard contact/UPN fields | `src/pages/identity/administration/users/patch-wizard.jsx` | Static review | Cherry-pick `-x` succeeded. Adds business phone, fax, mobile, UPN domain suffix picker; extends existing tenant-scoped selector pattern within patch wizard only. |

## Mini-batch 1 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| Protected-area scan (pre-pick) | All three commits limited to tests shape, custom-tests form, or JIT admin form |
| `Tests/Shapes/ListTests.json` | Valid JSON; `ExoTransportConfig: number` present |
| `AlertStatuses` UI (`98d5d94a`) | Multi-select with four status options; conditional on `AlertOnFailure`; matches CIPP-API backend |
| JIT creatable guard (post-revert) | Five autocomplete fields retain `creatable={false}` — free-text creation blocked |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues |

## Mini-batch 2 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| JIT `add.jsx` post-revert | Five `creatable={false}` on template, roles, groups, country, state autocompletes — no regression |
| `standards.json` (`cfbf3508`, `db57e52a`) | Upstream intent already present; no JSON change applied |
| Tab layouts (`b1902421`) | Not applied — unchanged; existing tab structure intact |
| Patch wizard (`7a85827e`) | `businessPhones`, `faxNumber`, `mobilePhone` in `PATCHABLE_PROPERTIES`; `userPrincipalName` domain picker with warning alert; submit maps phone to array and UPN suffix rebuild; UPN hidden for multi-tenant bulk selection |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues |

## Proposed Next Frontend Mini-batch (3)

| Priority | SHA | Title | Notes |
|----------|-----|-------|-------|
| 1 | `b1902421` | Tab layout first-tab margin | **Adapted apply** — port `ml: 2` / `first-of-type` margin into fork's responsive `sx` blocks without blind cherry-pick |
| 2 | `1cd1ef72` | Update AuditLogTemplates.json | Tests-only shape data — pre-check with `git show` |
| 3 | `6dab9339` | Tab icons in tabbed layouts | Medium risk — 4 files including icon registry; review after margin fix |

**Exclude:** `16b4503f` (auth-adjacent `account-popover.js`). **Skip:** empty merge commits.

## Next Steps

1. Optionally adapt `b1902421` margin into fork tab layout components manually.
2. Resume CIPP-API Batch 8 (`961462f3` remaining CIS/ZTNA test files) on API sync branch.
3. Continue low-risk shape/test JSON commits with same protected-area pre-check protocol.
