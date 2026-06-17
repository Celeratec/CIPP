# CIPP Frontend Sync Checkpoint — 2026-06-17

## Branch

| Field | Value |
|-------|-------|
| Branch | `manage365/upstream-sync-cipp-20260617` |
| Base | `main` @ `f2d87612ec80b9be24c303137c9604590992b144` |
| Tip | `a848a90e0` — `docs: track second CIPP frontend upstream mini-batch` |
| Backup tag | `backup/pre-upstream-sync-cipp-20260617` (local, not pushed) |
| Working tree | Clean |
| Production branches | Not touched |
| Remote push | Nothing pushed |

## Mini-batches Completed

### Mini-batch 1

| Upstream | Title | Outcome |
|----------|-------|---------|
| `1e59d2d4` | Update ListTests.json | Applied → `623ac8590` |
| `98d5d94a` | Custom Test — Alert on X statuses | Applied → `f3c917c1a` |
| `c8d61c07` | JIT admin — remove creatable | Already implemented; noisy cherry-pick reverted → `af5c9a905` |

### Mini-batch 2

| Upstream | Title | Outcome |
|----------|-------|---------|
| `cfbf3508` | Remove duplicate appliesToTest | Already implemented — skipped |
| `db57e52a` | TemplateList optional/non-creatable | Already implemented — skipped |
| `b1902421` | Tab layout first-tab margin | Skipped/deferred — layout conflict |
| `7a85827e` | Bulk patch wizard contact/UPN | Applied → `bb5150d99` |

## Applied Commits (code)

| Upstream | Applied SHA | Files |
|----------|-------------|-------|
| `1e59d2d4` | `623ac8590` | `Tests/Shapes/ListTests.json` |
| `98d5d94a` | `f3c917c1a` | `src/pages/tools/custom-tests/add.jsx` |
| `7a85827e` | `bb5150d99` | `src/pages/identity/administration/users/patch-wizard.jsx` |

## Reverted Commits

| Upstream | Cherry-pick | Revert | Reason |
|----------|-------------|--------|--------|
| `c8d61c07` | `aebf6ada5` | `af5c9a905` | Formatting-only (~182+/183−); fork already had `creatable={false}` on all five JIT autocompletes |

## Already Implemented (no cherry-pick)

| Upstream | Title | Evidence |
|----------|-------|----------|
| `c8d61c07` | JIT creatable guard | Five `creatable={false}` on JIT admin autocompletes before upstream pick |
| `cfbf3508` | Duplicate appliesToTest | `standards.AppManagementPolicy` has single merged `appliesToTest` incl. ZTNA tests |
| `db57e52a` | TemplateList optional/non-creatable | CA `TemplateList` already has `required: false`, `creatable: false` |

## Deferred Commits

| Upstream | Title | Reason |
|----------|-------|--------|
| `b1902421` | Tab layout first-tab margin | Cherry-pick conflict in `HeaderedTabbedLayout.jsx` and `TabbedLayout.jsx` (fork responsive `smDown` styling); needs adapted manual apply |

## Known Build/Lint Blockers

- Full frontend build/lint not validated on sync branch — known pre-existing dependency/tooling issues unrelated to applied cherry-picks.
- Do not treat unrelated build failures as caused by mini-batch changes unless errors point to changed files.

## Known Concerns

1. **`b1902421`** — Tab margin fix needs adapted review; port `ml: 2` / first-tab margin into fork responsive `sx` blocks without blind cherry-pick.
2. **`7a85827e`** — UPN domain suffix patch wizard adds high-impact identity changes; smoke test in a test tenant (single-tenant bulk, UPN suffix rebuild, logout warning).

## Recommendation

**Park frontend branch** at this checkpoint and **return to CIPP-API Batch 8** (`961462f3` remaining role-assignment test adaptations). Resume frontend at mini-batch 3 when API Batch 8 is complete.

## Tracking Docs

- `docs/upstream-sync/APPLIED_COMMITS_CIPP_20260617.md`
- `docs/upstream-sync/UPSTREAM_SYNC_CIPP_20260617.md`
