# Directory Role Assignment

## Problem

CIPP displays Entra ID directory roles (e.g. Helpdesk Administrator, Exchange Administrator) on user detail and role listing pages but only supports removal. There is no way to assign roles to users from within CIPP except through the JIT Admin flow, which is designed for temporary accounts and carries unnecessary overhead for simple permanent assignments.

## Solution

Add direct directory role assignment capability with support for both permanent and temporary assignments, accessible from three surfaces: user actions (list + detail), the user detail page inline, and the roles listing page.

## Architecture

### Backend: `Invoke-ExecRoleAssignment.ps1`

New HTTP Function endpoint at `/api/ExecRoleAssignment`.

**Actions:**

| Action | Graph API Call | Scheduling |
|--------|---------------|------------|
| `Add` | `POST /beta/directoryRoles(roleTemplateId='{id}')/members/$ref` | None |
| `Remove` | `DELETE /beta/directoryRoles(roleTemplateId='{id}')/members/{userId}/$ref` | None |
| `AddTemporary` | Same as Add, then `Add-CIPPScheduledTask` to schedule Remove at expiration | Yes |

**Request body:**

```json
{
  "tenantFilter": "tenant.onmicrosoft.com",
  "userId": "object-id",
  "userPrincipalName": "user@tenant.com",
  "displayName": "User Name",
  "roles": [{ "label": "Helpdesk Administrator", "value": "729827e3-..." }],
  "action": "Add | Remove | AddTemporary",
  "expiration": 1234567890,
  "reason": "optional reason"
}
```

**Role annotation:** `.ROLE Identity.Role.ReadWrite`

**No new SAM permissions required** — existing `RoleManagement.ReadWrite.Directory` covers this.

### Frontend: CippUserActions — "Manage Admin Roles"

New action in `useCippUserActions()` hook, following the "Manage Licenses" pattern:

- Multi-select role picker using `GDAPRoles.json`
- Radio: Permanent / Temporary
- Conditional expiration date picker (visible when Temporary selected)
- Optional reason text field
- Posts to `/api/ExecRoleAssignment`
- Category: `manage`, `quickAction: true`
- Permission gate: `Identity.Role.ReadWrite`
- Supports `multiPost: true` for bulk role assignment

### Frontend: User Detail Page Enhancements

In `pages/identity/administration/users/user/index.jsx`:

- Add remove action (trash icon) to each role row in `roleMembershipItems` table, calling `/api/ExecRoleAssignment` with action `Remove`
- Add "Add Role" button in the Admin Roles banner header, opening the Manage Admin Roles dialog pre-populated for the current user
- Trigger `refreshFunction` after add/remove to reload membership data

### Frontend: Roles Listing Page — Add Member

In `pages/identity/administration/roles/index.js`:

- Add "Add Member" button at the top of the Members card in the off-canvas panel
- Dialog with:
  - User picker autocomplete (`/api/ListGraphRequest` → `users` endpoint)
  - Permanent / Temporary radio
  - Conditional expiration date picker
- Posts to `/api/ExecRoleAssignment`
- Invalidates `ListRoles` query on success

## Data Flow

```
User clicks "Manage Admin Roles" (user action or inline)
  → Dialog: select roles, assignment type, optional expiration
  → POST /api/ExecRoleAssignment
  → Backend resolves user via Graph, loops over roles:
    → Add: POST directoryRoles(roleTemplateId)/members/$ref per role
    → AddTemporary: same Add, then Add-CIPPScheduledTask for removal
    → Remove: DELETE directoryRoles(roleTemplateId)/members/{userId}/$ref
  → Returns results array
  → Frontend invalidates queries, refreshes UI
```

## Error Handling

- Permission denied (403): "Insufficient permissions. Ensure RoleManagement.ReadWrite.Directory is granted and CPV has been refreshed."
- User already in role: Silently succeed (Graph API is idempotent for this)
- Role not activated: Some directory roles need activation first. The endpoint will attempt `POST /beta/directoryRoles` with the roleTemplateId to activate before adding members.
- Guest UPN encoding: Use `userId` (object ID) rather than UPN for the member reference URL to avoid `#EXT#` issues.

## Files Changed

| File | Change |
|------|--------|
| `CIPP-API/.../Invoke-ExecRoleAssignment.ps1` | New endpoint |
| `CIPP/src/components/CippComponents/CippUserActions.jsx` | Add "Manage Admin Roles" action |
| `CIPP/src/pages/identity/administration/users/user/index.jsx` | Add/remove roles inline |
| `CIPP/src/pages/identity/administration/roles/index.js` | Add member to role |
