# Applied Commits Tracking — CIPP (Frontend)

Generated: 2026-06-17  
Branch: `manage365/upstream-sync-cipp-20260617`  
Backup tag: `backup/pre-upstream-sync-cipp-20260617`  
Branch tip (after mini-batch 1): `aebf6ada5`

## Summary

| Status | Count |
|--------|-------|
| Applied cleanly | 3 |
| Applied with adaptation | 0 |
| Skipped | 0 |
| Already implemented (functional) | 0 |
| Conflicts | 0 |

Mini-batch 1 complete (3/3 upstream commits). Pairs with CIPP-API `6aa66c74` (`AlertStatuses` backend) on the API sync branch.

## Commit Log

| Upstream SHA | Applied SHA | Status | Reason | Files | Tests | Notes |
|--------------|-------------|--------|--------|-------|-------|-------|
| `1e59d2d43fab463a709d1dac2477f45cfacdfae6` | `623ac8590` | Applied cleanly | Shape test baseline update only | `Tests/Shapes/ListTests.json` | JSON parse OK | Cherry-pick `-x` succeeded; adds `ExoTransportConfig` to ListTests shape. No protected-area overlap. |
| `98d5d94a0d122d5fbc7380d5abe5cb02fba366fd` | `f3c917c1a` | Applied cleanly | Custom test alert-on-status UI; pairs with API `6aa66c74` | `src/pages/tools/custom-tests/add.jsx` | Static review | Cherry-pick `-x` succeeded. Adds `AlertStatuses` multi-select (Failed/Passed/Info/Investigate) gated on `AlertOnFailure`; form defaults, edit load, and submit payload map to backend `AlertStatuses` array. |
| `c8d61c0757853359cde98f9a00e6e3ba6fe6e98e` | `aebf6ada5` | Applied cleanly | JIT admin autocomplete creatable guard | `src/pages/identity/administration/jit-admin/add.jsx` | Static review | Cherry-pick `-x` succeeded with no conflicts. **Concern:** diff is mostly quote-style reformat (~182+/183−); fork already had `creatable={false}` on all five autocomplete fields before pick — no net functional creatable change, but upstream formatting aligned. Does not touch tenant selector, auth, or navigation. |

## Mini-batch 1 Validation (2026-06-17)

| Check | Result |
|-------|--------|
| Protected-area scan (pre-pick) | All three commits limited to tests shape, custom-tests form, or JIT admin form — no branding, quarantine, email troubleshooter, tenant switching, auth, navigation, or package/build files |
| `Tests/Shapes/ListTests.json` | Valid JSON; `ExoTransportConfig: number` present |
| `AlertStatuses` UI (`98d5d94a`) | `alertStatusesField` with `multiple: true`, four status options, conditional on `AlertOnFailure`; submit sends `AlertStatuses` string array when alerts enabled; edit path parses stored JSON — matches CIPP-API `Invoke-AddCustomScript.ps1` / `Invoke-CippTestCustomScripts.ps1` |
| JIT creatable guard (`c8d61c07`) | Five `type="autoComplete"` fields all set `creatable={false}` (template, roles, groups, country, state) — invalid free-text creation blocked |
| Full frontend build/lint | Not run — known pre-existing dependency/tooling issues on sync branch |

## Proposed Next Frontend Mini-batch (2)

Low-risk **Cherry-pick** inventory entries not yet applied. Pre-check each with `git show --stat` before apply; skip `db57e52a` / `cfbf3508` if standards.json fork diverges.

| Priority | SHA | Title | Files | Risk | Notes |
|----------|-----|-------|-------|------|-------|
| 1 | `cfbf3508` | Removed duplicate appliesToTest key | 1 | Low | `src/data/standards.json` only — compare fork diff before pick |
| 2 | `db57e52a` | Mark TemplateList optional and non-creatable | 1 | Low | `standards.json` — verify fork does not already set `required`/`creatable` |
| 3 | `b1902421` | Bit more margin for tabbed layout | 2 | Low | `HeaderedTabbedLayout.jsx`, `TabbedLayout.jsx` — spacing only |
| 4 | `7a85827e` | Bulk update contact and UPN fields | 1 | Low | `patch-wizard.jsx` — confirm no tenant-context changes |

**Exclude:** `16b4503f` (login/out testing) — touches `account-popover.js` / auth-adjacent layout. **Skip:** empty merge commits (`bde8ad3c`, `a04ed1a6`, `0de0910aa`).

## Next Steps

1. Resume CIPP-API Batch 8 (`961462f3` remaining CIS/ZTNA test files) once frontend checkpoint is acceptable.
2. Run mini-batch 2 with same protected-area pre-check protocol.
3. Optional: revert quote-only noise from `c8d61c07` if Manage365 prefers minimal diffs over upstream formatting alignment.
