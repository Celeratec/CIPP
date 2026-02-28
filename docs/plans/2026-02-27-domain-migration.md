# Bulk Domain Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow CIPP users to bulk-migrate user UPNs/emails and group emails from one domain to another, preserving the old address as an alias.

**Architecture:** A single new backend endpoint (`Invoke-ExecDomainMigration`) processes users and groups sequentially -- Graph API for UPN changes, Exchange Online for alias management. Two frontend entry points (Domains page action + Users page bulk action) both call this endpoint.

**Tech Stack:** PowerShell Azure Functions (backend), React/Next.js with MUI (frontend), Microsoft Graph API, Exchange Online PowerShell

---

### Task 1: Create Backend Endpoint `Invoke-ExecDomainMigration`

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-ExecDomainMigration.ps1`

**Step 1: Create the endpoint file**

Create `Invoke-ExecDomainMigration.ps1` with this content:

```powershell
function Invoke-ExecDomainMigration {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        Identity.User.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $APIName = $Request.Params.CIPPEndpoint
    $Headers = $Request.Headers
    $TenantFilter = $Request.Body.tenantFilter
    $SourceDomain = $Request.Body.sourceDomain
    $TargetDomain = $Request.Body.targetDomain
    $Users = $Request.Body.users
    $Groups = $Request.Body.groups

    $Results = [System.Collections.Generic.List[object]]::new()

    if ([string]::IsNullOrWhiteSpace($TenantFilter) -or [string]::IsNullOrWhiteSpace($TargetDomain)) {
        return ([HttpResponseContext]@{
            StatusCode = [HttpStatusCode]::BadRequest
            Body       = @{ Results = @('Missing required parameters: tenantFilter and targetDomain') }
        })
    }

    # Process Users
    if ($Users -and $Users.Count -gt 0) {
        foreach ($User in $Users) {
            try {
                $CurrentUPN = $User.userPrincipalName
                $DisplayName = $User.displayName ?? $CurrentUPN
                $UserId = $User.id

                # Skip guest users
                if ($CurrentUPN -match '#EXT#') {
                    $Results.Add("Skipped $DisplayName - guest users cannot have their UPN changed")
                    continue
                }

                # Calculate new UPN
                $MailNickname = ($CurrentUPN -split '@')[0]
                $CurrentDomain = ($CurrentUPN -split '@')[1]

                # Skip users already on target domain
                if ($CurrentDomain -eq $TargetDomain) {
                    $Results.Add("Skipped $DisplayName - already on $TargetDomain")
                    continue
                }

                $NewUPN = "$MailNickname@$TargetDomain"

                # Check for conflicts
                $ConflictFilters = @(
                    "userPrincipalName eq '$NewUPN'"
                    "mail eq '$NewUPN'"
                    "proxyAddresses/any(x:x eq 'smtp:$NewUPN')"
                )
                $ConflictFound = $false
                foreach ($Filter in $ConflictFilters) {
                    try {
                        $ConflictUsers = New-GraphGetRequest -uri "https://graph.microsoft.com/beta/users?`$filter=$Filter&`$select=id,displayName,userPrincipalName" -tenantid $TenantFilter -ComplexFilter
                        foreach ($ConflictUser in $ConflictUsers) {
                            if ($ConflictUser.id -ne $UserId) {
                                $Results.Add("Failed to migrate $DisplayName - $NewUPN conflicts with $($ConflictUser.displayName) ($($ConflictUser.userPrincipalName)) [ID: $($ConflictUser.id)]")
                                $ConflictFound = $true
                                break
                            }
                        }
                    } catch {}
                    if ($ConflictFound) { break }
                }
                if ($ConflictFound) { continue }

                # Change UPN via Graph API
                $Body = @{
                    userPrincipalName = $NewUPN
                } | ConvertTo-Json -Compress
                $null = New-GraphPostRequest -uri "https://graph.microsoft.com/beta/users/$UserId" -tenantid $TenantFilter -type PATCH -body $Body

                # Add old email as alias via Exchange
                try {
                    $CurrentMailbox = New-ExoRequest -tenantid $TenantFilter -cmdlet 'Get-Mailbox' -cmdParams @{ Identity = $UserId } -UseSystemMailbox $true
                    if ($CurrentMailbox) {
                        $CurrentProxyAddresses = @($CurrentMailbox.EmailAddresses)
                        $OldSmtp = "smtp:$CurrentUPN"

                        # Check if alias already exists
                        $AliasExists = $CurrentProxyAddresses | Where-Object { $_.ToLower() -eq $OldSmtp.ToLower() }
                        if (-not $AliasExists) {
                            $NewProxyAddresses = @("SMTP:$NewUPN") + @($CurrentProxyAddresses | ForEach-Object {
                                if ($_ -cmatch '^SMTP:') { $_.ToLower() } else { $_ }
                            }) + @($OldSmtp)
                            # Deduplicate (case-insensitive)
                            $Seen = @{}
                            $NewProxyAddresses = $NewProxyAddresses | Where-Object {
                                $lower = $_.ToLower()
                                if ($Seen.ContainsKey($lower)) { $false } else { $Seen[$lower] = $true; $true }
                            }
                            $null = New-ExoRequest -tenantid $TenantFilter -cmdlet 'Set-Mailbox' -cmdParams @{
                                Identity       = $UserId
                                EmailAddresses = $NewProxyAddresses
                            } -UseSystemMailbox $true
                        }
                        $Results.Add("Successfully migrated $DisplayName from $CurrentUPN to $NewUPN (old address kept as alias)")
                    } else {
                        $Results.Add("Migrated $DisplayName UPN to $NewUPN (no mailbox found - alias not created)")
                    }
                } catch {
                    $AliasError = Get-CippException -Exception $_
                    $Results.Add("Migrated $DisplayName UPN to $NewUPN but failed to add alias: $($AliasError.NormalizedError)")
                }

                Write-LogMessage -API $APIName -tenant $TenantFilter -headers $Headers -message "Migrated $DisplayName from $CurrentUPN to $NewUPN" -Sev Info

            } catch {
                $ErrorMessage = Get-CippException -Exception $_
                $Results.Add("Failed to migrate $($User.displayName ?? $User.userPrincipalName): $($ErrorMessage.NormalizedError)")
                Write-LogMessage -API $APIName -tenant $TenantFilter -headers $Headers -message "Failed to migrate $($User.userPrincipalName): $($ErrorMessage.NormalizedError)" -Sev Error -LogData $ErrorMessage
            }
        }
    }

    # Process Groups
    if ($Groups -and $Groups.Count -gt 0) {
        foreach ($Group in $Groups) {
            try {
                $GroupMail = $Group.mail
                $GroupName = $Group.displayName ?? $GroupMail
                $GroupId = $Group.id
                $GroupType = $Group.groupType

                $MailPrefix = ($GroupMail -split '@')[0]
                $CurrentGroupDomain = ($GroupMail -split '@')[1]

                if ($CurrentGroupDomain -eq $TargetDomain) {
                    $Results.Add("Skipped group $GroupName - already on $TargetDomain")
                    continue
                }

                $NewMail = "$MailPrefix@$TargetDomain"

                if ($GroupType -eq 'Microsoft 365 Group') {
                    $null = New-ExoRequest -tenantid $TenantFilter -cmdlet 'Set-UnifiedGroup' -cmdParams @{
                        Identity           = $GroupId
                        PrimarySmtpAddress = $NewMail
                    } -UseSystemMailbox $true
                } else {
                    $null = New-ExoRequest -tenantid $TenantFilter -cmdlet 'Set-DistributionGroup' -cmdParams @{
                        Identity           = $GroupId
                        PrimarySmtpAddress = $NewMail
                    } -UseSystemMailbox $true
                }

                $Results.Add("Successfully migrated group $GroupName from $GroupMail to $NewMail (old address kept as alias)")
                Write-LogMessage -API $APIName -tenant $TenantFilter -headers $Headers -message "Migrated group $GroupName from $GroupMail to $NewMail" -Sev Info

            } catch {
                $ErrorMessage = Get-CippException -Exception $_
                $Results.Add("Failed to migrate group $($Group.displayName ?? $Group.mail): $($ErrorMessage.NormalizedError)")
                Write-LogMessage -API $APIName -tenant $TenantFilter -headers $Headers -message "Failed to migrate group $($Group.mail): $($ErrorMessage.NormalizedError)" -Sev Error -LogData $ErrorMessage
            }
        }
    }

    if ($Results.Count -eq 0) {
        $Results.Add('No users or groups were provided for migration.')
    }

    return ([HttpResponseContext]@{
        StatusCode = [HttpStatusCode]::OK
        Body       = @{ Results = @($Results) }
    })
}
```

**Step 2: Verify the endpoint registers**

The endpoint should auto-register from the `.FUNCTIONALITY Entrypoint` comment. Verify by checking how other endpoints in the same folder are discovered.

**Step 3: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
git add "Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-ExecDomainMigration.ps1"
git commit -m "feat: add ExecDomainMigration backend endpoint for bulk domain migration"
```

---

### Task 2: Add "Change Domain" Bulk Action to Users Page

**Files:**
- Modify: `CIPP/src/components/CippComponents/CippUserActions.jsx`

**Step 1: Add the SwapHoriz import**

In the MUI icons import block (around line 3-27), add `SwapHoriz` to the import list:

```javascript
import {
  // ... existing imports ...
  SwapHoriz,
} from "@mui/icons-material";
```

**Step 2: Add the Change Domain action**

Add a new action object in the "edit" category section (after the "Update Address & Company" action, around line 429). The action uses `multiPost: true` with a `customDataformatter`:

```javascript
{
  label: "Change Domain",
  type: "POST",
  icon: <SwapHoriz />,
  url: "/api/ExecDomainMigration",
  multiPost: true,
  fields: [
    {
      type: "autoComplete",
      name: "targetDomain",
      label: "Target Domain",
      multiple: false,
      creatable: false,
      api: {
        url: "/api/ListGraphRequest",
        data: {
          Endpoint: "domains",
          $select: "id,isVerified,isInitial",
          $count: true,
        },
        queryKey: "ListDomainsAutoComplete",
        dataKey: "Results",
        labelField: (domain) => domain.id,
        valueField: "id",
        addedField: {
          isVerified: "isVerified",
          isInitial: "isInitial",
        },
      },
    },
  ],
  customDataformatter: (users, action, formData) => {
    const userList = Array.isArray(users) ? users : [users];
    const targetDomain = formData?.targetDomain?.value || formData?.targetDomain;
    if (!targetDomain) return [];

    const userPayload = userList.map((user) => ({
      id: user.id,
      userPrincipalName: user.userPrincipalName,
      displayName: user.displayName,
    }));

    return {
      tenantFilter: userList[0]?.Tenant || tenant,
      targetDomain: targetDomain,
      users: userPayload,
      groups: [],
    };
  },
  confirmText:
    "This will change the primary email and sign-in for the selected users to the new domain. Existing email addresses will be kept as aliases to preserve mail delivery.",
  condition: () => canWriteUser,
  category: "edit",
},
```

**Step 3: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add src/components/CippComponents/CippUserActions.jsx
git commit -m "feat: add Change Domain bulk action to users page"
```

---

### Task 3: Create Domain Migration Dialog Component

**Files:**
- Create: `CIPP/src/components/CippComponents/CippDomainMigrationDialog.jsx`

**Step 1: Create the dialog component**

This component is opened from the Domains page when a user clicks "Migrate Users to This Domain" on a domain row. It provides:
- A read-only target domain field (pre-filled from the row)
- A source domain picker (loads other tenant domains)
- After selecting source domain: a user table + optional groups table with checkboxes
- A submit button that calls ExecDomainMigration

```jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useForm } from "react-hook-form";
import { SwapHoriz } from "@mui/icons-material";
import { ApiGetCall, ApiPostCall } from "../../api/ApiCall";
import { CippApiResults } from "./CippApiResults";
import { CippFormComponent } from "./CippFormComponent";
import { useSettings } from "../../hooks/use-settings";

export const CippDomainMigrationDialog = ({ open, onClose, targetDomain }) => {
  const [sourceDomain, setSourceDomain] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [includeGroups, setIncludeGroups] = useState(false);
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const userSettings = useSettings();
  const tenantFilter = userSettings.currentTenant;

  const domainListQuery = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: "domains",
      tenantFilter: tenantFilter,
      $select: "id,isVerified,isInitial",
    },
    queryKey: `DomainMigration-Domains-${tenantFilter}`,
    waiting: open,
  });

  const userListQuery = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: "users",
      tenantFilter: tenantFilter,
      $count: true,
      $select: "id,displayName,userPrincipalName,mail,accountEnabled",
      $filter: `endsWith(userPrincipalName,'@${sourceDomain}')`,
    },
    queryKey: `DomainMigration-Users-${tenantFilter}-${sourceDomain}`,
    waiting: !!sourceDomain,
  });

  const groupListQuery = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: "groups",
      tenantFilter: tenantFilter,
      $count: true,
      $select: "id,displayName,mail,groupTypes,mailEnabled,securityEnabled",
      $filter: `endsWith(mail,'@${sourceDomain}')`,
    },
    queryKey: `DomainMigration-Groups-${tenantFilter}-${sourceDomain}`,
    waiting: !!sourceDomain && includeGroups,
  });

  const migrationRequest = ApiPostCall({
    urlFromData: true,
    relatedQueryKeys: [
      `DomainMigration-Users-${tenantFilter}`,
      "ListUsers",
    ],
  });

  const availableDomains = useMemo(() => {
    if (!domainListQuery.data?.Results) return [];
    return domainListQuery.data.Results.filter(
      (d) => d.isVerified && d.id !== targetDomain
    ).map((d) => ({ label: d.id, value: d.id }));
  }, [domainListQuery.data, targetDomain]);

  const users = useMemo(() => {
    if (!userListQuery.data?.Results) return [];
    return userListQuery.data.Results.filter(
      (u) => !u.userPrincipalName?.includes("#EXT#")
    );
  }, [userListQuery.data]);

  const groups = useMemo(() => {
    if (!groupListQuery.data?.Results) return [];
    return groupListQuery.data.Results.filter((g) => g.mail);
  }, [groupListQuery.data]);

  const getGroupType = useCallback((group) => {
    if (group.groupTypes?.includes("Unified")) return "Microsoft 365 Group";
    if (group.mailEnabled && group.securityEnabled) return "Mail-Enabled Security";
    if (group.mailEnabled) return "Distribution List";
    return "Security Group";
  }, []);

  const handleClose = () => {
    setSourceDomain(null);
    setSelectedUserIds([]);
    setSelectedGroupIds([]);
    setIncludeGroups(false);
    migrationRequest.reset?.();
    onClose();
  };

  const handleSubmit = () => {
    const selectedUsers = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => ({
        id: u.id,
        userPrincipalName: u.userPrincipalName,
        displayName: u.displayName,
      }));

    const selectedGroups = includeGroups
      ? groups
          .filter((g) => selectedGroupIds.includes(g.id))
          .map((g) => ({
            id: g.id,
            mail: g.mail,
            displayName: g.displayName,
            groupType: getGroupType(g),
          }))
      : [];

    migrationRequest.mutate({
      url: "/api/ExecDomainMigration",
      data: {
        tenantFilter,
        sourceDomain,
        targetDomain,
        users: selectedUsers,
        groups: selectedGroups,
      },
    });
  };

  const userColumns = [
    { field: "displayName", headerName: "Display Name", flex: 1 },
    { field: "userPrincipalName", headerName: "Current UPN", flex: 1.5 },
    {
      field: "accountEnabled",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Disabled"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  const groupColumns = [
    { field: "displayName", headerName: "Group Name", flex: 1 },
    { field: "mail", headerName: "Current Email", flex: 1.5 },
    {
      field: "groupTypes",
      headerName: "Type",
      width: 180,
      valueGetter: (value, row) => getGroupType(row),
    },
  ];

  const totalSelected = selectedUserIds.length + (includeGroups ? selectedGroupIds.length : 0);

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SwapHoriz />
          <Typography variant="h6">Migrate to {targetDomain}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            This will change the primary email and sign-in for selected users/groups to
            @{targetDomain}. Existing email addresses will be kept as aliases to preserve mail
            delivery.
          </Alert>

          <CippFormComponent
            type="autoComplete"
            name="sourceDomain"
            label="Source Domain (migrate FROM)"
            formControl={useForm()}
            options={availableDomains}
            isFetching={domainListQuery.isFetching}
            multiple={false}
            creatable={false}
            onChange={(e, value) => {
              setSourceDomain(value?.value || null);
              setSelectedUserIds([]);
              setSelectedGroupIds([]);
            }}
          />

          {sourceDomain && (
            <>
              <Divider />
              <Typography variant="subtitle1" fontWeight={600}>
                Users on @{sourceDomain}
                {userListQuery.isFetching && " (loading...)"}
              </Typography>

              {users.length > 0 ? (
                <Box sx={{ height: 350 }}>
                  <DataGrid
                    rows={users}
                    columns={userColumns}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={selectedUserIds}
                    onRowSelectionModelChange={(ids) => setSelectedUserIds(ids)}
                    density="compact"
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  />
                </Box>
              ) : (
                !userListQuery.isFetching && (
                  <Alert severity="warning">No users found on @{sourceDomain}</Alert>
                )
              )}

              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeGroups}
                    onChange={(e) => {
                      setIncludeGroups(e.target.checked);
                      setSelectedGroupIds([]);
                    }}
                  />
                }
                label="Include groups (M365 Groups, Distribution Lists)"
              />

              {includeGroups && sourceDomain && (
                <>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Groups on @{sourceDomain}
                    {groupListQuery.isFetching && " (loading...)"}
                  </Typography>

                  {groups.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <DataGrid
                        rows={groups}
                        columns={groupColumns}
                        checkboxSelection
                        disableRowSelectionOnClick
                        rowSelectionModel={selectedGroupIds}
                        onRowSelectionModelChange={(ids) => setSelectedGroupIds(ids)}
                        density="compact"
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      />
                    </Box>
                  ) : (
                    !groupListQuery.isFetching && (
                      <Alert severity="warning">No mail-enabled groups found on @{sourceDomain}</Alert>
                    )
                  )}
                </>
              )}

              {totalSelected > 0 && (
                <Alert severity="success">
                  {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""}
                  {includeGroups && selectedGroupIds.length > 0
                    ? ` and ${selectedGroupIds.length} group${selectedGroupIds.length !== 1 ? "s" : ""}`
                    : ""}{" "}
                  will be migrated from @{sourceDomain} to @{targetDomain}
                </Alert>
              )}

              <CippApiResults apiObject={migrationRequest} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={totalSelected === 0 || migrationRequest.isPending}
        >
          {migrationRequest.isPending
            ? "Migrating..."
            : `Migrate ${totalSelected} item${totalSelected !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

**Step 2: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add src/components/CippComponents/CippDomainMigrationDialog.jsx
git commit -m "feat: add CippDomainMigrationDialog component for domain migration wizard"
```

---

### Task 4: Add "Migrate Users to This Domain" Action on Domains Page

**Files:**
- Modify: `CIPP/src/pages/tenant/administration/domains/index.js`

**Step 1: Add state and imports for the migration dialog**

At the top of the file, add the dialog import and SwapHoriz icon. In the Page component, add state for tracking which domain was clicked and the dialog open state.

Add to imports:

```javascript
import { SwapHoriz } from "@mui/icons-material";
import { CippDomainMigrationDialog } from "../../../../components/CippComponents/CippDomainMigrationDialog";
```

Add state inside the Page component:

```javascript
const [migrationTarget, setMigrationTarget] = useState(null);
```

Add import for `useState`:

```javascript
import { useState } from "react";
```

**Step 2: Add the action to the actions array**

Add a new action object after the "Set as Default" action (around line 202):

```javascript
{
  label: "Migrate Users to This Domain",
  condition: (row) => row.isVerified && !row.isInitial,
  icon: <SwapHoriz />,
  noConfirm: true,
  customFunction: (row) => {
    setMigrationTarget(row.id);
  },
},
```

**Step 3: Render the dialog**

Before the closing `</CippTablePage>` tag, add:

```jsx
{migrationTarget && (
  <CippDomainMigrationDialog
    open={!!migrationTarget}
    onClose={() => setMigrationTarget(null)}
    targetDomain={migrationTarget}
  />
)}
```

Wait -- `CippTablePage` might not accept children. Instead, render the dialog as a sibling. Place it after `</CippTablePage>` but before the page's closing fragment `</>`. If the page doesn't use a fragment, wrap in one.

The domains page currently returns a single `<CippTablePage>` element. Wrap the return in a fragment:

```jsx
return (
  <>
    <CippTablePage ... />
    {migrationTarget && (
      <CippDomainMigrationDialog
        open={!!migrationTarget}
        onClose={() => setMigrationTarget(null)}
        targetDomain={migrationTarget}
      />
    )}
  </>
);
```

**Step 4: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add src/pages/tenant/administration/domains/index.js
git commit -m "feat: add Migrate Users action to domains page"
```

---

### Task 5: Verify and Fix Lint/Build Errors

**Step 1: Run lint on modified frontend files**

Use `ReadLints` tool on:
- `src/components/CippComponents/CippUserActions.jsx`
- `src/components/CippComponents/CippDomainMigrationDialog.jsx`
- `src/pages/tenant/administration/domains/index.js`

**Step 2: Fix any lint errors found**

Common issues to watch for:
- Missing imports
- Unused imports
- Hook dependency arrays
- Prop types

**Step 3: Commit fixes**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add -A
git commit -m "fix: resolve lint errors in domain migration feature"
```

---

### Task 6: Final Integration Verification

**Step 1: Verify backend endpoint file structure**

Check that the new endpoint file is in the correct directory alongside other user endpoints:
- `ls "CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/"`
- Confirm `Invoke-ExecDomainMigration.ps1` is present

**Step 2: Verify frontend imports resolve**

Check that all imports in the new/modified files reference existing modules.

**Step 3: Review the complete change set**

Run `git diff` on both repos to review all changes holistically.

**Step 4: Final commit (if needed)**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add -A && git commit -m "chore: finalize domain migration feature"
```
