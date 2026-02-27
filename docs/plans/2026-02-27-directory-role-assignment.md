# Directory Role Assignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable admins to assign and remove Entra ID directory roles (e.g. Helpdesk Administrator) to users, with support for both permanent and temporary assignments, from the user actions menu, user detail page, and roles listing page.

**Architecture:** New backend endpoint `Invoke-ExecRoleAssignment.ps1` handles add/remove/temporary-add via Graph API. Frontend adds a "Manage Admin Roles" action to `CippUserActions`, inline add/remove on the user detail page, and an "Add Member" button on the roles listing page. Temporary assignments schedule a removal task via `Add-CIPPScheduledTask`.

**Tech Stack:** PowerShell Azure Functions (backend), React/Next.js with MUI (frontend), Microsoft Graph API

---

### Task 1: Create Backend Endpoint

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-ExecRoleAssignment.ps1`

**Step 1: Create the endpoint file**

```powershell
function Invoke-ExecRoleAssignment {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        Identity.Role.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $APIName = $Request.Params.CIPPEndpoint
    $Headers = $Request.Headers
    $TenantFilter = $Request.Body.tenantFilter
    $UserId = $Request.Body.userId
    $UserPrincipalName = $Request.Body.userPrincipalName
    $DisplayName = $Request.Body.displayName
    $Action = $Request.Body.action
    $Reason = $Request.Body.reason ?? 'No reason provided'

    $Roles = if ($Request.Body.roles.value) {
        $Request.Body.roles | ForEach-Object { $_.value }
    } else {
        @($Request.Body.roles)
    }

    $RoleLabels = if ($Request.Body.roles.label) {
        $Request.Body.roles | ForEach-Object { $_.label }
    } else {
        @($Request.Body.roles)
    }

    $Results = [System.Collections.Generic.List[object]]::new()

    try {
        $UserObj = New-GraphGetRequest -Uri "https://graph.microsoft.com/beta/users/$UserId" -tenantid $TenantFilter

        switch ($Action) {
            'Add' {
                foreach ($Role in $Roles) {
                    try {
                        $Body = @{
                            '@odata.id' = "https://graph.microsoft.com/v1.0/directoryObjects/$($UserObj.id)"
                        } | ConvertTo-Json -Compress
                        $null = New-GraphPOSTRequest -uri "https://graph.microsoft.com/beta/directoryRoles(roleTemplateId='$Role')/members/`$ref" -tenantid $TenantFilter -body $Body
                    } catch {
                        $RoleError = Get-NormalizedError -Message $_.Exception.Message
                        if ($RoleError -notmatch 'already exist') {
                            throw $RoleError
                        }
                    }
                }
                $RoleNames = ($RoleLabels -join ', ')
                $Message = "Successfully assigned roles ($RoleNames) to $DisplayName ($UserPrincipalName)"
                $Results.Add($Message)
                Write-LogMessage -headers $Headers -API $APIName -tenant $TenantFilter -message $Message -Sev 'Info'
            }
            'Remove' {
                foreach ($Role in $Roles) {
                    try {
                        $null = New-GraphPOSTRequest -type DELETE -uri "https://graph.microsoft.com/beta/directoryRoles(roleTemplateId='$Role')/members/$($UserObj.id)/`$ref" -tenantid $TenantFilter
                    } catch {
                        $RoleError = Get-NormalizedError -Message $_.Exception.Message
                        throw $RoleError
                    }
                }
                $RoleNames = ($RoleLabels -join ', ')
                $Message = "Successfully removed roles ($RoleNames) from $DisplayName ($UserPrincipalName)"
                $Results.Add($Message)
                Write-LogMessage -headers $Headers -API $APIName -tenant $TenantFilter -message $Message -Sev 'Info'
            }
            'AddTemporary' {
                foreach ($Role in $Roles) {
                    try {
                        $Body = @{
                            '@odata.id' = "https://graph.microsoft.com/v1.0/directoryObjects/$($UserObj.id)"
                        } | ConvertTo-Json -Compress
                        $null = New-GraphPOSTRequest -uri "https://graph.microsoft.com/beta/directoryRoles(roleTemplateId='$Role')/members/`$ref" -tenantid $TenantFilter -body $Body
                    } catch {
                        $RoleError = Get-NormalizedError -Message $_.Exception.Message
                        if ($RoleError -notmatch 'already exist') {
                            throw $RoleError
                        }
                    }
                }

                $Expiration = ([System.DateTimeOffset]::FromUnixTimeSeconds($Request.Body.expiration)).DateTime

                $RemoveTaskBody = [pscustomobject]@{
                    TenantFilter  = $TenantFilter
                    Name          = "Role Assignment (Remove): $UserPrincipalName"
                    Command       = @{
                        value = 'Invoke-ExecRoleAssignment'
                        label = 'Invoke-ExecRoleAssignment'
                    }
                    Parameters    = [pscustomobject]@{
                        Body = @{
                            tenantFilter      = $TenantFilter
                            userId            = $UserObj.id
                            userPrincipalName = $UserPrincipalName
                            displayName       = $DisplayName
                            roles             = $Request.Body.roles
                            action            = 'Remove'
                            reason            = "Scheduled removal - $Reason"
                        }
                    }
                    ScheduledTime = $Request.Body.expiration
                    PostExecution = @{
                        Webhook = $false
                        Email   = $false
                        PSA     = $false
                    }
                }
                $null = Add-CIPPScheduledTask -Task $RemoveTaskBody -hidden $false

                $RoleNames = ($RoleLabels -join ', ')
                $Message = "Successfully assigned temporary roles ($RoleNames) to $DisplayName ($UserPrincipalName). Roles will be removed on $($Expiration.ToString('g')). Reason: $Reason"
                $Results.Add($Message)
                Write-LogMessage -headers $Headers -API $APIName -tenant $TenantFilter -message $Message -Sev 'Info'
            }
        }

        $StatusCode = [HttpStatusCode]::OK
    } catch {
        $ErrorMessage = Get-CippException -Exception $_
        $Results.Add("Failed to $Action role assignment. $($ErrorMessage.NormalizedError)")
        Write-LogMessage -headers $Headers -API $APIName -tenant $TenantFilter -message "Failed to $Action role assignment for $UserPrincipalName. $($ErrorMessage.NormalizedError)" -Sev 'Error'
        $StatusCode = [HttpStatusCode]::BadRequest
    }

    return [HttpResponseContext]@{
        StatusCode = $StatusCode
        Body       = @{ Results = @($Results) }
    }
}
```

**Step 2: Verify file is in the correct directory alongside existing user endpoints**

Run: `ls "CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/"`
Expected: See `Invoke-ExecJITAdmin.ps1` and the new `Invoke-ExecRoleAssignment.ps1` side by side.

**Step 3: Commit**

```bash
git add "CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-ExecRoleAssignment.ps1"
git commit -m "feat: add ExecRoleAssignment endpoint for directory role management"
```

---

### Task 2: Add "Manage Admin Roles" User Action

**Files:**
- Modify: `CIPP/src/components/CippComponents/CippUserActions.jsx`

**Step 1: Add the ManageAdminRolesForm component**

Add a new component above `useCippUserActions` (around line 267), following the same pattern as `ManageLicensesForm`. Import `gdaproles` and `useWatch` (useWatch is already imported).

```jsx
import gdaproles from "../../data/GDAPRoles.json";
```

```jsx
const ManageAdminRolesForm = ({ formControl }) => {
  const assignmentType = useWatch({
    control: formControl.control,
    name: "assignmentType",
  });

  const assignmentTypeValue = assignmentType?.value || assignmentType;
  const isTemporary = assignmentTypeValue === "Temporary";

  return (
    <>
      <CippFormComponent
        type="autoComplete"
        name="roles"
        label="Select Admin Roles"
        multiple={true}
        creatable={false}
        formControl={formControl}
        options={gdaproles.map((role) => ({ label: role.Name, value: role.ObjectId }))}
        validators={{ required: "Please select at least one role" }}
      />
      <CippFormComponent
        type="radio"
        name="assignmentType"
        label="Assignment Type"
        formControl={formControl}
        options={[
          { label: "Permanent", value: "Permanent" },
          { label: "Temporary", value: "Temporary" },
        ]}
        validators={{ required: "Please select an assignment type" }}
      />
      {isTemporary && (
        <CippFormComponent
          type="datePicker"
          name="expiration"
          label="Expiration Date/Time"
          dateTimeType="datetime"
          formControl={formControl}
          validators={{ required: "Please select an expiration date" }}
        />
      )}
      <CippFormComponent
        type="textField"
        name="reason"
        label="Reason (optional)"
        formControl={formControl}
      />
    </>
  );
};
```

**Step 2: Add the action to the `useCippUserActions` array**

Insert into the `// ====== MANAGE ACTIONS ======` section (after the "Add to Group" action around line 820). Add a permission check: `const canWriteRole = checkPermissions(["Identity.Role.ReadWrite"]);` near the other permission checks.

```jsx
{
  label: "Manage Admin Roles",
  type: "POST",
  url: "/api/ExecRoleAssignment",
  icon: <AdminPanelSettings />,
  data: {
    userId: "id",
    userPrincipalName: "userPrincipalName",
    displayName: "displayName",
  },
  multiPost: true,
  relatedQueryKeys: ["ListRoles", "ListUsers*"],
  children: ({ formHook: formControl }) => (
    <ManageAdminRolesForm formControl={formControl} />
  ),
  customDataformatter: (users, action, formData) => {
    const userList = Array.isArray(users) ? users : [users];
    const assignmentType = formData?.assignmentType?.value || formData?.assignmentType;
    const actionType = assignmentType === "Temporary" ? "AddTemporary" : "Add";
    return userList.map((user) => ({
      userId: user.id,
      userPrincipalName: user.userPrincipalName,
      displayName: user.displayName,
      tenantFilter: user.Tenant || undefined,
      roles: formData.roles,
      action: actionType,
      expiration: formData.expiration ? Math.floor(new Date(formData.expiration).getTime() / 1000) : undefined,
      reason: formData.reason || undefined,
    }));
  },
  confirmText: "Are you sure you want to manage admin roles for the selected user(s)?",
  condition: () => canWriteRole,
  category: "manage",
  quickAction: true,
},
```

**Step 3: Verify imports**

`AdminPanelSettings` is already imported. `gdaproles` needs to be added to the imports at the top.

**Step 4: Verify no lint errors**

Run linter on the modified file.

**Step 5: Commit**

```bash
git add src/components/CippComponents/CippUserActions.jsx
git commit -m "feat: add Manage Admin Roles user action"
```

---

### Task 3: Add Inline Role Management on User Detail Page

**Files:**
- Modify: `CIPP/src/pages/identity/administration/users/user/index.jsx`

**Step 1: Add remove action to role rows in `roleMembershipItems`**

In the `roleMembershipItems` useMemo (around line 586), add an `actions` array to the table config and a `refreshFunction`. The roles come from `userMemberOf` filtered to `#microsoft.graph.directoryRole`. Each role has `id` (directory role instance ID), `roleTemplateId`, and `displayName`.

Replace the existing `roleMembershipItems` useMemo with:

```jsx
const roleMembershipItems = useMemo(() => {
  if (!userMemberOf) return [];
  const roles = userMemberOf.filter((item) => item?.["@odata.type"] === "#microsoft.graph.directoryRole");
  return [
    {
      id: 1,
      cardLabelBox: {
        cardLabelBoxHeader: <AdminPanelSettings />,
      },
      text: "Admin Roles",
      subtext: "List of roles the user is a member of",
      statusText: ` ${roles.length} Role(s)`,
      statusColor: "info.main",
      table: {
        title: "Admin Roles",
        hideTitle: true,
        data: roles,
        simpleColumns: ["displayName", "description"],
        refreshFunction: refreshFunction,
        actions: [
          {
            label: "Remove Role",
            icon: <TrashIcon />,
            url: "/api/ExecRoleAssignment",
            type: "POST",
            data: {
              userId: data?.id,
              userPrincipalName: data?.userPrincipalName,
              displayName: data?.displayName,
              tenantFilter: tenant,
              action: "!Remove",
            },
            fields: [],
            customDataformatter: (row) => ({
              userId: data?.id,
              userPrincipalName: data?.userPrincipalName,
              displayName: data?.displayName,
              tenantFilter: tenant,
              action: "Remove",
              roles: [{ label: row.displayName, value: row.roleTemplateId }],
            }),
            confirmText: "Are you sure you want to remove the [displayName] role from this user?",
            relatedQueryKeys: [`ListUsers-${userId}`],
            color: "danger",
          },
        ],
      },
    },
  ];
}, [userMemberOf, refreshFunction, data, tenant, userId]);
```

**Step 2: Add the TrashIcon import**

`TrashIcon` is already imported from `@heroicons/react/24/outline`.

**Step 3: Verify no lint errors**

Run linter on the modified file.

**Step 4: Commit**

```bash
git add src/pages/identity/administration/users/user/index.jsx
git commit -m "feat: add inline role removal on user detail page"
```

---

### Task 4: Add "Add Member" on Roles Listing Page

**Files:**
- Modify: `CIPP/src/pages/identity/administration/roles/index.js`

**Step 1: Add state and mutation for the add-member dialog**

Add state variables near the existing `removeDialog` state (around line 61):

```jsx
const [addMemberDialog, setAddMemberDialog] = useState({
  open: false,
  role: null,
});
```

Add a mutation for adding members:

```jsx
const addMemberMutation = ApiPostCall({
  urlFromData: true,
  relatedQueryKeys: ["ListRoles"],
});
```

**Step 2: Add "Add Member" button in the off-canvas Members card**

In the `offCanvasChildren` callback (around line 251), inside the Members Card (the `<Card>` that has `<CardHeader>` with "Members ({members.length})"), add a button to the `CardHeader`'s `action` prop:

```jsx
<CardHeader
  title={
    <Stack direction="row" spacing={1} alignItems="center">
      <UserGroupIcon style={{ width: 18, height: 18 }} />
      <Typography variant="subtitle2">
        Members ({members.length})
      </Typography>
    </Stack>
  }
  action={
    <Button
      size="small"
      variant="contained"
      startIcon={<PersonAdd />}
      onClick={() => setAddMemberDialog({ open: true, role: row })}
    >
      Add Member
    </Button>
  }
  sx={{ py: 1.5, px: 2 }}
/>
```

Import `PersonAdd` from `@mui/icons-material` (already imported at line 37-40 area; check if it's there, otherwise add it).

**Step 3: Add the Add Member dialog component**

After the existing Remove Member Dialog (around line 510), add:

```jsx
{/* Add Member Dialog */}
<Dialog
  open={addMemberDialog.open}
  onClose={() => setAddMemberDialog({ open: false, role: null })}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <PersonAdd sx={{ color: theme.palette.primary.main }} />
    Add Member to {addMemberDialog.role?.DisplayName}
  </DialogTitle>
  <DialogContent>
    <AddMemberForm
      role={addMemberDialog.role}
      tenant={tenant}
      onClose={() => setAddMemberDialog({ open: false, role: null })}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["ListRoles"] });
        setAddMemberDialog({ open: false, role: null });
      }}
      mutation={addMemberMutation}
    />
  </DialogContent>
</Dialog>
```

**Step 4: Create the AddMemberForm component**

Add above the `Page` component. This is a self-contained form with a user picker, assignment type, and conditional expiration:

```jsx
import { useForm, useWatch } from "react-hook-form";
import CippFormComponent from "../../../../components/CippComponents/CippFormComponent";
import { CippApiResults } from "../../../../components/CippComponents/CippApiResults";
```

```jsx
const AddMemberForm = ({ role, tenant, onClose, onSuccess, mutation }) => {
  const formControl = useForm({ mode: "onChange" });
  const assignmentType = useWatch({
    control: formControl.control,
    name: "assignmentType",
  });
  const assignmentTypeValue = assignmentType?.value || assignmentType;
  const isTemporary = assignmentTypeValue === "Temporary";

  const handleSubmit = formControl.handleSubmit((formData) => {
    const actionType = isTemporary ? "AddTemporary" : "Add";
    const user = formData.user;
    mutation.mutate({
      url: "/api/ExecRoleAssignment",
      data: {
        tenantFilter: tenant,
        userId: user.value,
        userPrincipalName: user.addedFields?.userPrincipalName || user.value,
        displayName: user.label,
        roles: [{ label: role.DisplayName, value: role.roleTemplateId }],
        action: actionType,
        expiration: formData.expiration
          ? Math.floor(new Date(formData.expiration).getTime() / 1000)
          : undefined,
        reason: formData.reason || undefined,
      },
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <CippFormComponent
          type="autoComplete"
          name="user"
          label="Select User"
          multiple={false}
          creatable={false}
          formControl={formControl}
          validators={{ required: "Please select a user" }}
          api={{
            url: "/api/ListGraphRequest",
            data: {
              Endpoint: "users",
              $select: "id,displayName,userPrincipalName",
              $top: 999,
              $count: true,
            },
            queryKey: `ListUsersAutoComplete-${tenant}`,
            dataKey: "Results",
            labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
            valueField: "id",
            addedField: {
              userPrincipalName: "userPrincipalName",
              displayName: "displayName",
            },
          }}
        />
        <CippFormComponent
          type="radio"
          name="assignmentType"
          label="Assignment Type"
          formControl={formControl}
          options={[
            { label: "Permanent", value: "Permanent" },
            { label: "Temporary", value: "Temporary" },
          ]}
          validators={{ required: "Please select an assignment type" }}
        />
        {isTemporary && (
          <CippFormComponent
            type="datePicker"
            name="expiration"
            label="Expiration Date/Time"
            dateTimeType="datetime"
            formControl={formControl}
            validators={{ required: "Please select an expiration date" }}
          />
        )}
        <CippFormComponent
          type="textField"
          name="reason"
          label="Reason (optional)"
          formControl={formControl}
        />
        <CippApiResults apiObject={mutation} />
        <DialogActions sx={{ px: 0, pb: 0 }}>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
          >
            {mutation.isPending ? "Adding..." : "Add Member"}
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
};
```

**Step 5: Add required imports**

Add to the existing imports:
- `PersonAdd` to the `@mui/icons-material` import (check if not already there)
- `useForm, useWatch` from `react-hook-form`
- `CippFormComponent` from the components
- `CippApiResults` from the components

**Step 6: Verify no lint errors**

Run linter on the modified file.

**Step 7: Commit**

```bash
git add src/pages/identity/administration/roles/index.js
git commit -m "feat: add member to role from roles listing page"
```

---

### Task 5: Final Verification

**Step 1: Check all modified files for lint errors**

Run linter on:
- `CIPP/src/components/CippComponents/CippUserActions.jsx`
- `CIPP/src/pages/identity/administration/users/user/index.jsx`
- `CIPP/src/pages/identity/administration/roles/index.js`

**Step 2: Verify the build compiles**

Run: `cd CIPP && npm run build` (or `next build`)
Expected: No compilation errors.

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint and build issues for role assignment feature"
```
