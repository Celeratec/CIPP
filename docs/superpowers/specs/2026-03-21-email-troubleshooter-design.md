# Email Troubleshooter - Unified Email Troubleshooting Hub

## Overview

Redesign CIPP's email troubleshooting tools (message trace, quarantine management, allow/block actions) into a unified hub under Email & Exchange > Troubleshooting. The goal is to eliminate context-switching for MSP technicians who diagnose email delivery issues daily.

The current state has message trace buried under Tools > Email Tools and quarantine under Email & Exchange > Administration -- two separate pages in different menus with no cross-linking beyond a basic "View Message Trace" action on quarantine rows.

## Navigation Restructure

### Before

```
Email & Exchange
├── Administration
│   ├── Quarantine
│   ├── Tenant Allow/Block Lists
│   └── ...
├── Transport ...
├── Spam Filter ...

Tools
└── Email Tools
    ├── Message Trace
    ├── Mailbox Restores
    └── Message Viewer
```

### After

```
Email & Exchange
├── Troubleshooting                    ← NEW, first submenu
│   ├── Email Troubleshooter           ← unified hub (new page)
│   ├── Quarantine                     ← existing page (menu label: "Quarantine"; page title: "Quarantine Management")
│   ├── Message Viewer                 ← relocated from Tools
│   └── Mailbox Restores              ← relocated from Tools
├── Administration
│   ├── Mailboxes ...
│   ├── Contacts ...
│   ├── Restricted Users
│   ├── Tenant Allow/Block Lists
│   └── Retention Policies
├── Transport ...
├── Spam Filter ...
```

Note: Mail Test (`/email/tools/mail-test`) stays under the Tools section since it's a general-purpose tool, not a troubleshooting workflow. The "Email Tools" group under Tools is updated to contain only Mail Test.

Key decisions:
- Troubleshooting is first because it's the most-used area for MSP technicians
- The standalone Message Trace page is removed; its functionality is fully absorbed into the Email Troubleshooter
- Quarantine stays as a separate page for bulk/all-tenant monitoring
- Message Viewer and Mailbox Restores (+ Restore Wizard) relocate from Tools to Troubleshooting
- Mail Test stays under Tools

### Files changed

Frontend (`CIPP/src/`):
- `layouts/config.js` -- restructure navigation items, remove "Email Tools" from Tools section
- Remove `pages/email/tools/message-trace/index.js` (functionality absorbed into troubleshooter)
- Relocate `pages/email/tools/message-viewer/index.js` to `pages/email/troubleshooting/message-viewer/index.js`
- Relocate entire `pages/email/tools/mailbox-restores/` directory (includes `index.js` and `add.jsx`) to `pages/email/troubleshooting/mailbox-restores/`
- Relocate `pages/email/tools/mailbox-restore-wizard/index.js` to `pages/email/troubleshooting/mailbox-restore-wizard/index.js`
- `pages/email/tools/mail-test/index.js` -- stays under Tools (it's a general mail test, not troubleshooting)
- Create `pages/email/troubleshooting/email-troubleshooter/index.js` (new unified page)
- Update `generate-placeholders.js` for any moved routes

The "Email Tools" nav section under Tools is updated to only contain Mail Test (if it stays) or removed entirely if empty. Config item paths must match the new file-system-based routes.

## Email Troubleshooter Page

### Search Panel

A collapsible accordion (CippButtonCard component) at the top with two modes:

**Default fields (always visible):**
- Sender (email, autocomplete/free-type, multiple)
- Recipient (email, autocomplete/free-type, multiple)
- Date Range (relative dropdown: Last 24h, Last 2 days, Last 7 days, Last 10 days, Custom)
- Search button + Clear button

**Advanced section (expandable):**
- Message ID (when set, disables other filters)
- Subject (text field, for quarantine matching)
- Status (multi-select: None, Delivered, Failed, Quarantined, FilteredAsSpam, etc.)
- From IP / To IP (validated IP fields)
- Quarantine Type (Spam, Phish, Malware, HighConfPhish -- filters quarantine results only)

**Quick-filter presets** (MUI Chip row above the search form):
- "Quarantined (24h)" -- date=24h, status=Quarantined, auto-execute
- "Failed Delivery (48h)" -- date=48h, status=Failed, auto-execute
- "All Recent (7d)" -- date=7 days, no status filter, auto-execute

Search behavior:
- Single click fires one API call to the new `Invoke-ExecEmailTroubleshoot` endpoint
- Backend runs both `Get-MessageTraceV2` and `Get-QuarantineMessage` in parallel
- Accordion auto-collapses after results load to maximize result space

### Results Area

Tabbed layout below the search panel with badges showing result counts.

#### Message Trace Tab

Table columns: Received, Status, Sender, Recipient, Subject

Status column uses color-coded MUI Chips:
- Delivered = green
- Quarantined = amber (clickable -- switches to Quarantine tab, highlights match)
- Failed = red
- FilteredAsSpam = orange

Row actions:
- View Delivery Details -- opens enhanced detail panel (see below)
- View in Security Explorer -- external link using the existing `CippDataTable` action link pattern with `[MessageTraceId]` placeholder: `https://security.microsoft.com/realtimereportsv3?tid=${tenantFilter}&dltarget=Explorer&dlstorage=Url&viewid=allemail&query-NetworkMessageId=[MessageTraceId]` (preserves the exact pattern from the current message trace page)
- Allow Sender -- dialog to add sender to Tenant Allow/Block List (Allow)
- Block Sender -- dialog to add sender to Tenant Allow/Block List (Block)
- Copy Message ID -- clipboard copy
- Release from Quarantine -- appears only when status is "Quarantined", calls quarantine API using MessageId lookup

#### Quarantine Tab

Table columns: Received, Release Status, Subject, Sender, Recipient, Type, Policy

Release Status uses existing color-coded chips (Released=green, Denied=red, Not Released=amber, Requested=warning).

Row actions:
- View Message -- existing EML viewer dialog (CippMessageViewer)
- View Delivery Timeline -- opens trace detail inline
- Release -- existing release action
- Deny -- existing deny action
- Release & Allow Sender -- existing composite action
- Block Sender -- new: adds sender to block list
- Release & Add Allow Entry -- new: releases + adds Tenant Allow/Block List entry for sender

Bulk actions (when rows selected via checkbox):
- Release Selected -- bulk release
- Deny Selected -- bulk deny
- Release & Allow All Senders -- bulk release + add each unique sender to allow list

Bulk guardrails:
- 10+ messages: explicit confirmation dialog
- 50+ messages: additional impact warning

#### Cross-Tab Linking

When a "Quarantined" status chip is clicked in the Trace tab:
1. Switch to Quarantine tab
2. Filter/highlight the matching quarantine entry (match by MessageId)
3. If no exact match found, show a "Search quarantine for this message" button

### Enhanced Detail Panel

Full-width MUI Dialog opened from "View Delivery Details" or "View Delivery Timeline".

#### Quick Actions Bar (top of dialog)
- Release (if quarantined)
- Allow Sender / Block Sender
- Copy Message ID
- View Raw EML (if quarantined, via Export-QuarantineMessage)
- Open in Security Explorer

#### Authentication Results Summary

Dedicated section showing parsed auth results:
- SPF: Pass/Fail/SoftFail + checked record
- DKIM: Pass/Fail + signing domain
- DMARC: Pass/Fail + applied policy
- Composite Authentication: overall verdict

Data source: `Get-MessageTraceDetailV2` Detail field, parsed server-side by `ConvertTo-AuthenticationSummary`.

#### Delivery Timeline

Vertical timeline visualization (MUI Timeline or custom) replacing the current plain table:

Each step is a card with:
- Timestamp (left side)
- Event name (bold header)
- Detail text (body)
- Color coding: green=success, red=failure, amber=quarantine

Example timeline steps: RECEIVE, AGENTINFO (with SPF/DKIM/DMARC), TRANSFER, DELIVER/QUARANTINE/FAIL.

If the message was quarantined, the final timeline step includes inline Release/Deny/Allow actions.

## Backend Changes

### New: `Invoke-ExecEmailTroubleshoot`

Location: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1`

Role: `Exchange.TransportRule.Read`

Note on permissions: Message trace requires `Exchange.TransportRule.Read` while quarantine listing requires `Exchange.SpamFilter.Read`. This endpoint uses `Exchange.TransportRule.Read` as its CIPP access role (the lower permission bar -- if a user can trace messages, they should see the troubleshooter). The quarantine portion runs independently and returns an error key in the response if the EXO quarantine cmdlet fails due to insufficient Exchange permissions, allowing partial results. The frontend renders whichever tab has data and shows a permission guidance banner on the other.

Functionality:
1. Parse search parameters from the request body
2. Run `Get-MessageTraceV2` via `New-ExoRequest` in a try/catch block
3. Run `Get-QuarantineMessage` via `New-ExoRequest` in a separate try/catch block
4. Return both result sets (or error info for whichever failed) with summary counts

Request format (relative date range):
```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "sender": ["user@external.com"],
  "recipient": ["employee@contoso.com"],
  "days": 2,
  "status": { "value": "Quarantined" },
  "subject": "Invoice",
  "quarantineType": "Spam",
  "messageId": null,
  "fromIP": null,
  "toIP": null
}
```

Request format (custom date range):
```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "sender": ["user@external.com"],
  "recipient": ["employee@contoso.com"],
  "startDate": 1742515200,
  "endDate": 1742601600,
  "status": { "value": "Quarantined" },
  "subject": null,
  "quarantineType": null,
  "messageId": null,
  "fromIP": null,
  "toIP": null
}
```

When `days` is provided, `startDate`/`endDate` are ignored (same priority as current `Invoke-ListMessageTrace`). When `messageId` is provided, all other filters are ignored.

`sender` and `recipient` are arrays (matching the frontend autocomplete `multiple` mode). The backend uses the first value for `Get-MessageTraceV2` (which accepts a single `SenderAddress`/`RecipientAddress`). For `Get-QuarantineMessage`, `SenderAddress` also accepts a single value. If multiple addresses are provided, the backend runs separate queries per address and merges results.

`status` uses the `{ value: "..." }` shape from `CippFormComponent` autocomplete, consistent with the existing `Invoke-ListMessageTrace.ps1` pattern. Although the UI supports multi-select, the backend passes only the first selected status to `Get-MessageTraceV2` (which accepts a single Status parameter). Client-side filtering handles additional status values after results load. The quarantine query does not filter by trace status.

Response format:
```json
{
  "Results": {
    "MessageTrace": [...],
    "Quarantine": [...],
    "TraceError": null,
    "QuarantineError": null,
    "Summary": {
      "traceCount": 15,
      "quarantineCount": 3,
      "quarantineUnreleased": 2
    }
  }
}
```

`TraceError` and `QuarantineError` are null on success; on failure, they contain the error message string for the frontend to render in the error-guidance pattern.

### Reuse Existing: `Invoke-AddTenantAllowBlockList`

The existing endpoint at `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Spamfilter/Invoke-AddTenantAllowBlockList.ps1` (role: `Exchange.SpamFilter.ReadWrite`) already supports creating allow/block entries via `New-TenantAllowBlockListItems`.

The "Allow Sender" and "Block Sender" actions in the troubleshooter frontend call `/api/AddTenantAllowBlockList` directly with pre-filled defaults:
```json
{
  "tenantID": "contoso.onmicrosoft.com",
  "entries": "sender@example.com",
  "listType": "Sender",
  "listMethod": "Allow",
  "notes": "Allowed via Email Troubleshooter",
  "NoExpiration": false,
  "RemoveAfter": true
}
```

No new endpoint needed -- this avoids duplicating the existing API surface.

### New: `ConvertTo-AuthenticationSummary`

Location: `CIPP-API/Modules/CIPPCore/Private/ConvertTo-AuthenticationSummary.ps1` (private helper, not exported)

Parses the Detail text from `Get-MessageTraceDetailV2` to extract SPF, DKIM, DMARC results into structured JSON.

The Detail field from `Get-MessageTraceDetailV2` contains authentication results as semi-structured text like:
```
S:SPF=Pass;S:DKIM=Pass;S:DMARC=Pass;S:CompAuth=Pass
```

The function uses regex patterns to extract each auth result. If parsing fails (format changes, missing data), it returns a fallback object with all fields set to `"Unknown"` -- the frontend renders these gracefully as gray "Unknown" badges rather than crashing.

Return shape:
```json
{
  "SPF": { "result": "Pass", "detail": "..." },
  "DKIM": { "result": "Pass", "detail": "..." },
  "DMARC": { "result": "Pass", "detail": "..." },
  "CompAuth": { "result": "Pass" }
}
```

### Enhanced: `Invoke-ExecQuarantineManagement`

The existing endpoint accepts `Identity` as either a string (single) or an array (bulk). Internally, a string is passed as `-Identity` and an array as `-Identities` to `Release-QuarantineMessage`. There is no separate `Identities` JSON field -- the same `Identity` key serves both purposes.

Enhancements:

- **`AddAllowEntry` flag (new)**: Distinct from the existing `AllowSender` flag. `AllowSender` is passed through to `Release-QuarantineMessage` (Exchange's built-in "allow sender" on release). `AddAllowEntry` is a new CIPP-level flag that, after successful release, also calls `New-TenantAllowBlockListItems` to create a Tenant Allow/Block List entry for the sender address. This provides a more permanent and visible allow entry than Exchange's built-in mechanism. Both flags can coexist (they do different things) but typical usage is one or the other.

- **Error classification**: Wrap the release and allow-list operations in separate try/catch blocks. Return structured results per identity:
  ```json
  {
    "Results": [
      { "Identity": "abc123", "ReleaseResult": "Success", "AllowEntryResult": "Success" },
      { "Identity": "def456", "ReleaseResult": "Failed: Already released", "AllowEntryResult": "Skipped" }
    ]
  }
  ```

- **Sender extraction for allow entries**: For bulk release with `AddAllowEntry`, the endpoint calls `Get-QuarantineMessage -Identity $id` first to get the `SenderAddress`, then creates the allow entry. This adds latency for bulk operations but is necessary since the frontend may not pass sender addresses for every selected row.

Example request bodies:

Single release:
```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "Identity": "abc123-def456",
  "Type": "Release"
}
```

Bulk release & add allow entries:
```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "Identity": ["abc123", "def456", "ghi789"],
  "Type": "Release",
  "AllowSender": false,
  "AddAllowEntry": true
}
```

Deny:
```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "Identity": "abc123-def456",
  "Type": "Deny"
}
```

### Route Registration

No explicit route file is needed. CIPP-API uses convention-based routing: the HTTP trigger extracts `CIPPEndpoint` from the request path and dispatches to `Invoke-{CIPPEndpoint}` via `New-CippCoreRequest.ps1`. New functions just need to:
1. Be exported from the CIPPCore module (placed under `Public/Entrypoints/HTTP Functions/`)
2. Include `.FUNCTIONALITY Entrypoint` and `.ROLE` in the help block
3. Run `Tools/Build-FunctionPermissions.ps1` to regenerate `function-permissions.json`

API paths follow the pattern `/api/{CIPPEndpoint}` (e.g. `/api/ExecEmailTroubleshoot`).

## Error Handling

### Permission Errors
- SAM permission missing: error guidance shows CPV refresh instructions
- Partial failure (one source fails, other succeeds): show partial results + alert banner explaining which data source failed and remediation steps

### Empty Results
- Both sources empty: "No messages found. Try expanding the date range or checking addresses."
- Trace has results, quarantine empty: normal flow, no special handling

### Rate Limits
- Exchange 429 throttling: "Search is being throttled by Microsoft. Results may be incomplete. Try narrowing your date range."

### Guest User UPN Encoding
- Backend auto-encodes `#` as `%23` in UPNs containing `#EXT#` per existing codebase conventions

## Component Architecture

```
EmailTroubleshooter (page)
├── SearchPanel (CippButtonCard accordion)
│   ├── QuickFilterPresets (Chip row)
│   ├── DefaultSearchFields (Sender, Recipient, DateRange)
│   └── AdvancedSearchFields (collapsible: MessageID, Subject, Status, IPs, QuarantineType)
├── ResultsTabBar (MUI Tabs with badges)
├── MessageTraceTab
│   └── CippDataTable (with contextual row actions)
├── QuarantineTab
│   └── CippDataTable (with bulk actions, contextual row actions)
└── DetailDialog (MUI Dialog)
    ├── QuickActionsBar
    ├── AuthenticationSummary
    └── DeliveryTimeline (vertical timeline cards)
```

## Permissions

### Frontend (menu visibility)

The Troubleshooting nav group uses `Exchange.Mailbox.*` for visibility (consistent with the current Email Tools section). Individual actions that require spam filter permissions (release, allow/block) perform their own permission checks at the API level.

### Backend (CIPP roles via `.ROLE` metadata)

- `Invoke-ExecEmailTroubleshoot`: `.ROLE Exchange.TransportRule.Read` -- the CIPP access gate uses the lower permission bar. Quarantine data is fetched in a separate try/catch; if Exchange permissions for quarantine are missing, partial results are returned with an error key.
- `Invoke-AddTenantAllowBlockList`: `.ROLE Exchange.SpamFilter.ReadWrite` (existing, unchanged)
- `Invoke-ExecQuarantineManagement`: `.ROLE Exchange.SpamFilter.ReadWrite` (existing, enhanced)

### SAM Manifest

No new SAM Manifest permissions needed -- all Exchange Online cmdlets (`Get-MessageTraceV2`, `Get-MessageTraceDetailV2`, `Get-QuarantineMessage`, `Export-QuarantineMessage`, `Release-QuarantineMessage`, `New-TenantAllowBlockListItems`) are already covered by existing grants.

### function-permissions.json

After adding new endpoints, run `Tools/Build-FunctionPermissions.ps1` to regenerate the permissions cache.
