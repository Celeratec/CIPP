# Bulk Domain Migration Feature -- Design Document

## Problem

MSP clients frequently change their organization's default domain name. When this happens, every user's primary email and sign-in (UPN) needs to move to the new domain, while the old email address must remain as an alias to preserve inbound mail delivery. Today this requires editing users one at a time. CIPP needs a bulk operation for this.

## Requirements

- Bulk-change UPN and primary email for selected users to a new domain
- Keep old email address as an alias automatically (always, no opt-out)
- Support migrating group email addresses (M365 groups, distribution lists, mail-enabled security groups) as an option
- Two entry points:
  - **Domains page:** "Migrate Users to This Domain" action on a domain row
  - **Users page:** "Change Domain" bulk action on selected users
- Per-object success/failure reporting for partial failures

## Architecture

Single dedicated backend endpoint (`Invoke-ExecDomainMigration`) processes users and groups sequentially. UPN changes go through the Graph API; alias management goes through Exchange Online cmdlets. Two frontend entry points share the same backend endpoint.

## Backend: `Invoke-ExecDomainMigration`

### Endpoint

- **Path:** `POST /api/ExecDomainMigration`
- **Role:** `Identity.User.ReadWrite`
- **File:** `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-ExecDomainMigration.ps1`

### Request Body

```json
{
  "tenantFilter": "contoso.onmicrosoft.com",
  "sourceDomain": "oldcompany.com",
  "targetDomain": "newcompany.com",
  "users": [
    { "id": "guid", "userPrincipalName": "john@oldcompany.com", "displayName": "John Smith" }
  ],
  "groups": [
    { "id": "guid", "mail": "sales@oldcompany.com", "displayName": "Sales Team", "groupType": "Microsoft 365 Group" }
  ]
}
```

### User Processing (per user)

1. Validate: skip guest users (`#EXT#` in UPN) with warning
2. Validate: skip users already on target domain with info message
3. Calculate new UPN: replace `@sourceDomain` with `@targetDomain`
4. Check for conflicts: query Graph for existing objects with the new UPN/email
5. PATCH via Graph API: update `userPrincipalName`
6. Add old email as alias via Exchange `Set-Mailbox -EmailAddresses @{Add="smtp:old@domain.com"}` using `New-ExoRequest`
7. If no mailbox exists (unlicensed), report partial success: "UPN changed, no mailbox for alias"

### Group Processing (per group, by type)

- **M365 Groups:** `Set-UnifiedGroup -PrimarySmtpAddress new@domain.com` (old address auto-demoted to alias)
- **Distribution Lists / Mail-Enabled Security:** `Set-DistributionGroup -PrimarySmtpAddress new@domain.com`

### Response

```json
{
  "Results": [
    "Successfully migrated john@oldcompany.com to john@newcompany.com",
    "Successfully migrated sales@oldcompany.com to sales@newcompany.com",
    "Skipped guest user guest#EXT#@oldcompany.com - guest users cannot be migrated",
    "Failed to migrate bob@oldcompany.com - Conflict: UPN already in use by Bob Jones [id: guid]"
  ]
}
```

## Frontend: Domains Page Entry Point

### Location

`/tenant/administration/domains/` -- new action on verified, non-initial domain rows.

### Component

New dedicated component: `CippDomainMigrationDialog.jsx` (the UI is too complex for standard `CippApiDialog`).

### Flow

1. User clicks "Migrate Users to This Domain" on a domain row
2. Dialog opens with the target domain pre-filled (read-only)
3. Source domain dropdown loads from `ListGraphRequest` with `Endpoint: "domains"`, excluding the target
4. After selecting source domain:
   - Users table loads via `ListGraphRequest` with `Endpoint: "users"` and `$filter=endsWith(userPrincipalName,'@sourceDomain')`
   - Select-all checkbox + individual checkboxes
5. "Include Groups" toggle: when enabled, loads groups with mail on source domain
6. Summary bar: "X users and Y groups will be migrated from old.com to new.com"
7. Submit calls `POST /api/ExecDomainMigration`
8. Results displayed via standard `CippApiResults` pattern

### Action Definition (in domains page)

```javascript
{
  label: "Migrate Users to This Domain",
  condition: (row) => row.isVerified && !row.isInitial,
  icon: <SwapHoriz />,
  customFunction: (row) => { /* open CippDomainMigrationDialog */ },
}
```

## Frontend: Users Page Bulk Action

### Location

`CippUserActions.jsx` -- new entry in the "edit" category.

### Action Definition

```javascript
{
  label: "Change Domain",
  type: "POST",
  url: "/api/ExecDomainMigration",
  icon: <SwapHoriz />,
  multiPost: true,
  fields: [
    {
      type: "autoComplete",
      name: "targetDomain",
      label: "Target Domain",
      api: {
        url: "/api/ListGraphRequest",
        data: { Endpoint: "domains", $filter: "isVerified eq true" },
        labelField: "id",
        valueField: "id",
      },
    },
  ],
  customDataformatter: (users, action, formData) => {
    // Groups selected users by their current domain
    // Builds request body with users array, sourceDomain(s), targetDomain
  },
  confirmText: "This will change the primary email and sign-in for the selected users to the new domain. Existing email addresses will be kept as aliases.",
  condition: () => canWriteUser,
  category: "edit",
}
```

### Data Formatter Logic

Users selected from the Users page may be on different source domains. The `customDataformatter` groups them by current domain and constructs the request payload accordingly. The backend handles multi-source-domain scenarios.

## Error Handling

### Conflict Detection

Before changing a UPN, the endpoint queries Graph for objects that already use the target address (same pattern as `EditUser.ps1`). On conflict, returns the conflicting object's type, display name, and ID.

### Edge Cases

| Scenario | Behavior |
|---|---|
| Guest users (`#EXT#` in UPN) | Skipped with warning message |
| Already on target domain | Skipped with info message |
| Unlicensed user (no mailbox) | UPN changed; alias step skipped with note |
| Shared mailboxes | Treated as regular users, migrated normally |
| Conflicting UPN exists | Failed with conflict details |
| Exchange unreachable | UPN changed; alias failure reported as partial success |

### Response Format

Per-object results array allows the UI to show exactly which users succeeded, which failed, and why. This follows the existing CIPP pattern for bulk operations.

## Permissions

- **Graph API:** `User.ReadWrite.All` (already in SAMManifest)
- **Exchange Online:** Existing Exchange permissions cover `Set-Mailbox` and `Set-DistributionGroup`
- No new SAMManifest entries expected, but should be verified during implementation
