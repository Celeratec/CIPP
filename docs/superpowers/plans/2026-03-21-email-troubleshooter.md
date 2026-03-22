# Email Troubleshooter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified Email Troubleshooter hub under Email & Exchange > Troubleshooting that combines message trace and quarantine into a single search-diagnose-act workflow.

**Architecture:** New frontend page at `/email/troubleshooting/email-troubleshooter` with a search panel, tabbed results (Trace/Quarantine), and an enhanced detail dialog. New backend endpoint `Invoke-ExecEmailTroubleshoot` combines `Get-MessageTraceV2` and `Get-QuarantineMessage` into one API call. Enhanced `Invoke-ExecQuarantineManagement` adds bulk release and allow-entry creation. Navigation restructured with Troubleshooting as first submenu under Email & Exchange.

**Tech Stack:** React/Next.js, MUI (Tabs, Chips, DataTable, Dialog, Timeline), React Hook Form, React Query mutations (ApiPostCall), PowerShell Azure Functions, Exchange Online cmdlets via New-ExoRequest.

**Spec:** `docs/superpowers/specs/2026-03-21-email-troubleshooter-design.md`

---

## File Structure

### Frontend (CIPP)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/email/troubleshooting/email-troubleshooter/index.js` | Unified troubleshooter page |
| Modify | `src/layouts/config.js` | Navigation restructure |
| Modify | `generate-placeholders.js` | Update relocated route paths |
| Move | `src/pages/email/tools/message-viewer/` → `src/pages/email/troubleshooting/message-viewer/` | |
| Move | `src/pages/email/tools/mailbox-restores/` → `src/pages/email/troubleshooting/mailbox-restores/` | |
| Move | `src/pages/email/tools/mailbox-restore-wizard/` → `src/pages/email/troubleshooting/mailbox-restore-wizard/` | |
| Delete | `src/pages/email/tools/message-trace/index.js` | Absorbed into troubleshooter |

### Backend (CIPP-API)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `Modules/CIPPCore/Private/ConvertTo-AuthenticationSummary.ps1` | Parse auth results from trace detail |
| Create | `Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1` | Combined trace + quarantine search |
| Modify | `Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Spamfilter/Invoke-ExecQuarantineManagement.ps1` | Add bulk + allow-entry support |
| Regenerate | `Modules/CIPPCore/lib/data/function-permissions.json` | Via `Tools/Build-FunctionPermissions.ps1` |

---

## Task 1: Backend — ConvertTo-AuthenticationSummary Helper

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Private/ConvertTo-AuthenticationSummary.ps1`

- [ ] **Step 1: Create the private helper function**

Create `CIPP-API/Modules/CIPPCore/Private/ConvertTo-AuthenticationSummary.ps1`:

```powershell
function ConvertTo-AuthenticationSummary {
    param(
        [Parameter(Mandatory = $false)]
        [string[]]$DetailEntries
    )

    $Summary = [PSCustomObject]@{
        SPF      = [PSCustomObject]@{ result = 'Unknown'; detail = '' }
        DKIM     = [PSCustomObject]@{ result = 'Unknown'; detail = '' }
        DMARC    = [PSCustomObject]@{ result = 'Unknown'; detail = '' }
        CompAuth = [PSCustomObject]@{ result = 'Unknown' }
    }

    if (-not $DetailEntries) { return $Summary }

    $AllDetails = $DetailEntries -join ';'

    try {
        if ($AllDetails -match 'SPF=(\w+)') {
            $Summary.SPF.result = $Matches[1]
        }
        if ($AllDetails -match 'spf\s+(pass|fail|softfail|temperror|permerror|none)\s*(?:\(([^)]+)\))?') {
            $Summary.SPF.result = $Matches[1]
            if ($Matches[2]) { $Summary.SPF.detail = $Matches[2] }
        }

        if ($AllDetails -match 'DKIM=(\w+)') {
            $Summary.DKIM.result = $Matches[1]
        }
        if ($AllDetails -match 'dkim\s+(pass|fail|none)\s*(?:\(([^)]+)\))?') {
            $Summary.DKIM.result = $Matches[1]
            if ($Matches[2]) { $Summary.DKIM.detail = $Matches[2] }
        }

        if ($AllDetails -match 'DMARC=(\w+)') {
            $Summary.DMARC.result = $Matches[1]
        }
        if ($AllDetails -match 'dmarc\s+(pass|fail|bestguesspass|none)\s*(?:action=(\w+))?') {
            $Summary.DMARC.result = $Matches[1]
            if ($Matches[2]) { $Summary.DMARC.detail = "action=$($Matches[2])" }
        }

        if ($AllDetails -match 'compauth=(\w+)') {
            $Summary.CompAuth.result = $Matches[1]
        }
    } catch {
        Write-Warning "Failed to parse authentication summary: $($_.Exception.Message)"
    }

    return $Summary
}
```

- [ ] **Step 2: Verify function loads with module**

Run from CIPP-API root:
```bash
pwsh -c "Import-Module ./Modules/CIPPCore -Force; Get-Command ConvertTo-AuthenticationSummary -ErrorAction SilentlyContinue | Select-Object Name, Source"
```
Expected: The command should NOT be exported (it's private), but should be dot-sourced. Verify no import errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
git add Modules/CIPPCore/Private/ConvertTo-AuthenticationSummary.ps1
git commit -m "feat: add ConvertTo-AuthenticationSummary private helper for parsing email auth results"
```

---

## Task 2: Backend — Invoke-ExecEmailTroubleshoot Endpoint

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1`

- [ ] **Step 1: Create the combined search endpoint**

Create `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1`:

```powershell
function Invoke-ExecEmailTroubleshoot {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        Exchange.TransportRule.Read
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $APIName = $Request.Params.CIPPEndpoint
    $TenantFilter = $Request.Body.tenantFilter

    $TraceResults = @()
    $QuarantineResults = @()
    $TraceError = $null
    $QuarantineError = $null

    $TraceParams = @{}
    if ($Request.Body.messageId) {
        $TraceParams['MessageId'] = $Request.Body.messageId
    } else {
        if ($Request.Body.days) {
            $TraceParams['StartDate'] = (Get-Date).AddDays(-[int]$Request.Body.days).ToUniversalTime().ToString('s')
            $TraceParams['EndDate'] = (Get-Date).ToUniversalTime().ToString('s')
        } elseif ($Request.Body.startDate) {
            if ($Request.Body.startDate -match '^\d+$') {
                $TraceParams['StartDate'] = [DateTimeOffset]::FromUnixTimeSeconds([int64]$Request.Body.startDate).UtcDateTime.ToString('s')
            } else {
                $TraceParams['StartDate'] = $Request.Body.startDate
            }
            if ($Request.Body.endDate) {
                if ($Request.Body.endDate -match '^\d+$') {
                    $TraceParams['EndDate'] = [DateTimeOffset]::FromUnixTimeSeconds([int64]$Request.Body.endDate).UtcDateTime.ToString('s')
                } else {
                    $TraceParams['EndDate'] = $Request.Body.endDate
                }
            }
        }

        if ($Request.Body.status) {
            $StatusValue = if ($Request.Body.status.value) { $Request.Body.status.value } else { $Request.Body.status }
            if ($StatusValue -is [array]) { $StatusValue = $StatusValue[0] }
            $TraceParams['Status'] = $StatusValue
        }
        if (![string]::IsNullOrEmpty($Request.Body.fromIP)) {
            $TraceParams['FromIP'] = $Request.Body.fromIP
        }
        if (![string]::IsNullOrEmpty($Request.Body.toIP)) {
            $TraceParams['ToIP'] = $Request.Body.toIP
        }
    }

    $SenderValue = if ($Request.Body.sender) {
        $s = $Request.Body.sender
        if ($s -is [array]) { ($s[0].value ?? $s[0]) } else { $s.value ?? $s }
    } else { $null }
    if ($SenderValue) { $SenderValue = $SenderValue -replace '#', '%23' }

    $RecipientValue = if ($Request.Body.recipient) {
        $r = $Request.Body.recipient
        if ($r -is [array]) { ($r[0].value ?? $r[0]) } else { $r.value ?? $r }
    } else { $null }
    if ($RecipientValue) { $RecipientValue = $RecipientValue -replace '#', '%23' }

    if ($SenderValue) { $TraceParams['SenderAddress'] = $SenderValue }
    if ($RecipientValue) { $TraceParams['RecipientAddress'] = $RecipientValue }

    try {
        $TraceResults = @(New-ExoRequest -TenantId $TenantFilter -Cmdlet 'Get-MessageTraceV2' -CmdParams $TraceParams |
            Select-Object MessageTraceId, MessageId, Status, Subject, RecipientAddress, SenderAddress,
                @{ Name = 'Received'; Expression = { $_.Received.ToString('u') } }, FromIP, ToIP)
        Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message 'Executed message trace via troubleshooter' -Sev 'Info'
    } catch {
        $TraceError = "Message trace failed: $($_.Exception.Message)"
        Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message $TraceError -Sev 'Error'
    }

    $QuarantineParams = @{ 'PageSize' = 1000 }
    if ($SenderValue) { $QuarantineParams['SenderAddress'] = $SenderValue }
    if ($Request.Body.days) {
        $QuarantineParams['StartReceivedDate'] = (Get-Date).AddDays(-[int]$Request.Body.days).ToUniversalTime()
        $QuarantineParams['EndReceivedDate'] = (Get-Date).ToUniversalTime()
    } elseif ($Request.Body.startDate) {
        if ($Request.Body.startDate -match '^\d+$') {
            $QuarantineParams['StartReceivedDate'] = [DateTimeOffset]::FromUnixTimeSeconds([int64]$Request.Body.startDate).UtcDateTime
        } else {
            $QuarantineParams['StartReceivedDate'] = [DateTime]::Parse($Request.Body.startDate).ToUniversalTime()
        }
        if ($Request.Body.endDate) {
            if ($Request.Body.endDate -match '^\d+$') {
                $QuarantineParams['EndReceivedDate'] = [DateTimeOffset]::FromUnixTimeSeconds([int64]$Request.Body.endDate).UtcDateTime
            } else {
                $QuarantineParams['EndReceivedDate'] = [DateTime]::Parse($Request.Body.endDate).ToUniversalTime()
            }
        } else {
            $QuarantineParams['EndReceivedDate'] = (Get-Date).ToUniversalTime()
        }
    }
    if ($Request.Body.quarantineType) {
        $QuarantineParams['QuarantineTypes'] = $Request.Body.quarantineType
    }

    try {
        $QuarantineResults = @(New-ExoRequest -tenantid $TenantFilter -cmdlet 'Get-QuarantineMessage' -cmdParams $QuarantineParams |
            Select-Object -ExcludeProperty *data.type*)

        if ($RecipientValue) {
            $QuarantineResults = $QuarantineResults | Where-Object { $_.RecipientAddress -like "*$RecipientValue*" }
        }
        if ($Request.Body.subject) {
            $QuarantineResults = $QuarantineResults | Where-Object { $_.Subject -like "*$($Request.Body.subject)*" }
        }
    } catch {
        $QuarantineError = "Quarantine search failed: $($_.Exception.Message)"
        Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message $QuarantineError -Sev 'Error'
    }

    $Body = @{
        Results = @{
            MessageTrace    = $TraceResults
            Quarantine      = $QuarantineResults
            TraceError      = $TraceError
            QuarantineError = $QuarantineError
            Summary         = @{
                traceCount          = $TraceResults.Count
                quarantineCount     = $QuarantineResults.Count
                quarantineUnreleased = @($QuarantineResults | Where-Object { $_.ReleaseStatus -ne 'RELEASED' }).Count
            }
        }
    }

    return ([HttpResponseContext]@{
        StatusCode = [HttpStatusCode]::OK
        Body       = $Body
    })
}
```

- [ ] **Step 2: Verify the function file is valid PowerShell**

```bash
pwsh -c "& { . './Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1'; Write-Host 'Syntax OK' }"
```
Expected: `Syntax OK` with no parse errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
git add "Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Tools/Invoke-ExecEmailTroubleshoot.ps1"
git commit -m "feat: add ExecEmailTroubleshoot endpoint combining message trace and quarantine search"
```

---

## Task 3: Backend — Enhance ExecQuarantineManagement

**Files:**
- Modify: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Spamfilter/Invoke-ExecQuarantineManagement.ps1`

- [ ] **Step 1: Add AddAllowEntry support and structured results**

Replace the entire content of `Invoke-ExecQuarantineManagement.ps1` with:

```powershell
function Invoke-ExecQuarantineManagement {
    <#
    .FUNCTIONALITY
        Entrypoint
    .ROLE
        Exchange.SpamFilter.ReadWrite
    #>
    [CmdletBinding()]
    param($Request, $TriggerMetadata)

    $APIName = $Request.Params.CIPPEndpoint
    $TenantFilter = $Request.Body.tenantFilter | Select-Object -First 1
    $ActionType = $Request.Body.Type | Select-Object -First 1
    $AllowSender = [boolean]$Request.Body.AllowSender
    $AddAllowEntry = [boolean]$Request.Body.AddAllowEntry

    $Identities = if ($Request.Body.Identity -is [string]) {
        @($Request.Body.Identity)
    } else {
        @($Request.Body.Identity)
    }

    $ResultsList = [System.Collections.Generic.List[object]]::new()

    foreach ($Id in $Identities) {
        $Entry = [PSCustomObject]@{
            Identity         = $Id
            ReleaseResult    = $null
            AllowEntryResult = $null
        }

        try {
            $ReleaseParams = @{
                AllowSender  = $AllowSender
                ReleaseToAll = $true
                ActionType   = $ActionType
                Identity     = $Id
            }
            New-ExoRequest -tenantid $TenantFilter -cmdlet 'Release-QuarantineMessage' -cmdParams $ReleaseParams
            $Entry.ReleaseResult = 'Success'
            Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message "Successfully processed Quarantine ID $Id" -Sev 'Info'
        } catch {
            $Entry.ReleaseResult = "Failed: $($_.Exception.Message)"
            Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message "Quarantine release failed for $Id`: $($_.Exception.Message)" -Sev 'Error' -LogData $_
        }

        if ($AddAllowEntry -and $Entry.ReleaseResult -eq 'Success') {
            try {
                $QMsg = New-ExoRequest -tenantid $TenantFilter -cmdlet 'Get-QuarantineMessage' -cmdParams @{ Identity = $Id }
                $SenderAddr = $QMsg.SenderAddress | Select-Object -First 1
                if ($SenderAddr) {
                    New-ExoRequest -tenantid $TenantFilter -cmdlet 'New-TenantAllowBlockListItems' -cmdParams @{
                        Entries     = @($SenderAddr)
                        ListType    = 'Sender'
                        Allow       = $true
                        RemoveAfter = 45
                        Notes       = "Allowed via Email Troubleshooter - Quarantine release"
                    }
                    $Entry.AllowEntryResult = 'Success'
                } else {
                    $Entry.AllowEntryResult = 'Skipped: sender address not found'
                }
            } catch {
                $Entry.AllowEntryResult = "Failed: $($_.Exception.Message)"
                Write-LogMessage -headers $Request.Headers -API $APIName -tenant $TenantFilter -message "Allow entry failed for $Id`: $($_.Exception.Message)" -Sev 'Error'
            }
        } elseif ($AddAllowEntry) {
            $Entry.AllowEntryResult = 'Skipped: release failed'
        }

        $ResultsList.Add($Entry)
    }

    $SuccessCount = @($ResultsList | Where-Object { $_.ReleaseResult -eq 'Success' }).Count
    $Body = [pscustomobject]@{
        Results = if ($ResultsList.Count -eq 1) {
            if ($ResultsList[0].ReleaseResult -eq 'Success') { "Successfully processed $($Identities[0])" }
            else { $ResultsList[0].ReleaseResult }
        } else {
            "$SuccessCount of $($ResultsList.Count) messages processed successfully"
        }
        Details = @($ResultsList)
    }

    return ([HttpResponseContext]@{
        StatusCode = [HttpStatusCode]::OK
        Body       = $Body
    })
}
```

- [ ] **Step 2: Verify syntax**

```bash
pwsh -c "& { . './Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Spamfilter/Invoke-ExecQuarantineManagement.ps1'; Write-Host 'Syntax OK' }"
```

- [ ] **Step 3: Commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
git add "Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Email-Exchange/Spamfilter/Invoke-ExecQuarantineManagement.ps1"
git commit -m "feat: enhance ExecQuarantineManagement with bulk operations and allow-entry creation"
```

---

## Task 4: Backend — Regenerate Function Permissions

- [ ] **Step 1: Regenerate function-permissions.json**

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
pwsh -c "./Tools/Build-FunctionPermissions.ps1"
```

Expected: Script runs without errors, updates `Modules/CIPPCore/lib/data/function-permissions.json` with the new `Invoke-ExecEmailTroubleshoot` entry.

- [ ] **Step 2: Verify the new endpoint appears**

```bash
pwsh -c "Get-Content './Modules/CIPPCore/lib/data/function-permissions.json' | ConvertFrom-Json | Select-Object -ExpandProperty 'Invoke-ExecEmailTroubleshoot'"
```

Expected: Shows `Role = Exchange.TransportRule.Read`, `Functionality = Entrypoint`.

- [ ] **Step 3: Commit**

```bash
git add Modules/CIPPCore/lib/data/function-permissions.json
git commit -m "chore: regenerate function-permissions.json with new email troubleshooter endpoint"
```

---

## Task 5: Frontend — Navigation Restructure and File Relocations

**Files:**
- Modify: `CIPP/src/layouts/config.js`
- Modify: `CIPP/generate-placeholders.js`
- Move: multiple directories under `src/pages/email/tools/`
- Delete: `src/pages/email/tools/message-trace/index.js`

- [ ] **Step 1: Move files to new locations**

```bash
cd /Users/clint/Documents/GitHub/CIPP
mkdir -p src/pages/email/troubleshooting
mv src/pages/email/tools/message-viewer src/pages/email/troubleshooting/message-viewer
mv src/pages/email/tools/mailbox-restores src/pages/email/troubleshooting/mailbox-restores
mv src/pages/email/tools/mailbox-restore-wizard src/pages/email/troubleshooting/mailbox-restore-wizard
rm src/pages/email/tools/message-trace/index.js
rmdir src/pages/email/tools/message-trace
```

- [ ] **Step 2: Update navigation config — add Troubleshooting section**

In `src/layouts/config.js`, find the Email & Exchange `items` array (starts after the Email & Exchange header definition). Insert the Troubleshooting section as the **first item** in the `items` array, before Administration.

Add this object as the first element of the Email & Exchange `items` array:

```javascript
      {
        title: "Troubleshooting",
        permissions: ["Exchange.Mailbox.*"],
        items: [
          {
            title: "Email Troubleshooter",
            path: "/email/troubleshooting/email-troubleshooter",
            permissions: ["Exchange.Mailbox.*"],
          },
          {
            title: "Quarantine",
            path: "/email/administration/quarantine",
            permissions: ["Exchange.SpamFilter.*"],
          },
          {
            title: "Message Viewer",
            path: "/email/troubleshooting/message-viewer",
            permissions: ["Exchange.Mailbox.*"],
          },
          {
            title: "Mailbox Restores",
            path: "/email/troubleshooting/mailbox-restores",
            permissions: ["Exchange.Mailbox.*"],
          },
        ],
      },
```

- [ ] **Step 3: Remove Quarantine from Administration section**

In the Administration items array, remove the Quarantine entry:
```javascript
          {
            title: "Quarantine",
            path: "/email/administration/quarantine",
            permissions: ["Exchange.SpamFilter.*"],
          },
```

- [ ] **Step 4: Update Tools section — remove Email Tools or trim to Mail Test only**

Find the "Email Tools" section under Tools (around line 1057). Replace it with just Mail Test:

```javascript
      {
        title: "Email Tools",
        permissions: ["Exchange.Mailbox.*"],
        items: [
          {
            title: "Mail Test",
            path: "/email/tools/mail-test",
            permissions: ["Exchange.Mailbox.*"],
          },
        ],
      },
```

- [ ] **Step 5: Update generate-placeholders.js**

Find the email tools entries (around line 106-109) and update the paths:

Change:
```javascript
  { title: "Mailbox Restore Wizard", path: "/email/tools/mailbox-restore-wizard" },
  { title: "Mailbox Restores", path: "/email/tools/mailbox-restores" },
  { title: "Mail Test", path: "/email/tools/mail-test" },
  { title: "Message Viewer", path: "/email/tools/message-viewer" },
```

To:
```javascript
  { title: "Mailbox Restore Wizard", path: "/email/troubleshooting/mailbox-restore-wizard" },
  { title: "Mailbox Restores", path: "/email/troubleshooting/mailbox-restores" },
  { title: "Mail Test", path: "/email/tools/mail-test" },
  { title: "Message Viewer", path: "/email/troubleshooting/message-viewer" },
```

Also find and remove any entry for `/email/reports/message-trace` (around line 123) since that was a stale placeholder path.

- [ ] **Step 6: Verify the dev server compiles**

```bash
cd /Users/clint/Documents/GitHub/CIPP
npm run build
```

Expected: Build succeeds with no errors for missing imports from moved files.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: restructure navigation — add Troubleshooting section under Email & Exchange, relocate email tools"
```

---

## Task 6: Frontend — Email Troubleshooter Page (Search Panel)

**Files:**
- Create: `CIPP/src/pages/email/troubleshooting/email-troubleshooter/index.js`

- [ ] **Step 1: Create the page with search panel**

Create `src/pages/email/troubleshooting/email-troubleshooter/index.js`. This step builds just the search form — results are added in Task 7.

```jsx
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Chip,
  Collapse,
  Stack,
  Tab,
  Tabs,
  Typography,
  Badge,
  Alert,
} from "@mui/material";
import { Search, ClearAll, ExpandMore, ExpandLess } from "@mui/icons-material";
import { Grid } from "@mui/system";
import CippFormComponent from "../../../../components/CippComponents/CippFormComponent";
import CippButtonCard from "../../../../components/CippCards/CippButtonCard";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { ApiPostCall } from "../../../../api/ApiCall";
import { useSettings } from "../../../../hooks/use-settings";

const quickPresets = [
  { key: "quarantined24h", label: "Quarantined (24h)", days: 1, status: "Quarantined" },
  { key: "failed48h", label: "Failed Delivery (48h)", days: 2, status: "Failed" },
  { key: "recent7d", label: "All Recent (7d)", days: 7, status: null },
];

const Page = () => {
  const tenantFilter = useSettings().currentTenant;
  const [activePreset, setActivePreset] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [traceResults, setTraceResults] = useState([]);
  const [quarantineResults, setQuarantineResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [traceError, setTraceError] = useState(null);
  const [quarantineError, setQuarantineError] = useState(null);

  const formControl = useForm({
    defaultValues: {
      dateFilter: "relative",
      days: 2,
      startDate: null,
      endDate: null,
      sender: [],
      recipient: [],
      messageId: "",
      subject: "",
      status: [],
      fromIP: "",
      toIP: "",
      quarantineType: [],
    },
    mode: "onChange",
  });

  const [searchExpanded, setSearchExpanded] = useState(true);

  const searchApi = ApiPostCall({
    urlFromData: true,
    queryKey: "EmailTroubleshoot",
    onResult: (result) => {
      const data = result?.Results ?? result;
      setTraceResults(data?.MessageTrace ?? []);
      setQuarantineResults(data?.Quarantine ?? []);
      setSummary(data?.Summary ?? null);
      setTraceError(data?.TraceError ?? null);
      setQuarantineError(data?.QuarantineError ?? null);
      setSearchExpanded(false);
    },
  });

  const buildSearchData = (overrides = {}) => {
    const values = { ...formControl.getValues(), ...overrides };
    const data = { tenantFilter };

    if (values.messageId) {
      data.messageId = values.messageId;
      return data;
    }

    if (values.sender?.length) data.sender = values.sender;
    if (values.recipient?.length) data.recipient = values.recipient;
    if (values.status?.length) data.status = values.status[0];
    if (values.fromIP) data.fromIP = values.fromIP;
    if (values.toIP) data.toIP = values.toIP;
    if (values.subject) data.subject = values.subject;
    if (values.quarantineType?.length) data.quarantineType = values.quarantineType[0]?.value ?? values.quarantineType[0];

    if (values.dateFilter === "relative") {
      data.days = values.days;
    } else {
      data.startDate = values.startDate;
      data.endDate = values.endDate;
    }

    return data;
  };

  const onSubmit = (overrides) => {
    searchApi.mutate({
      url: "/api/ExecEmailTroubleshoot",
      data: buildSearchData(overrides),
    });
  };

  const onClear = () => {
    formControl.reset();
    setActivePreset(null);
    setTraceResults([]);
    setQuarantineResults([]);
    setSummary(null);
    setTraceError(null);
    setQuarantineError(null);
  };

  const applyPreset = (preset) => {
    formControl.setValue("dateFilter", "relative");
    formControl.setValue("days", preset.days);
    if (preset.status) {
      formControl.setValue("status", [{ label: preset.status, value: preset.status }]);
    } else {
      formControl.setValue("status", []);
    }
    setActivePreset(preset.key);
    onSubmit({ dateFilter: "relative", days: preset.days, status: preset.status ? [{ value: preset.status }] : [] });
  };

  const isMessageIdSet = !!formControl.watch("messageId");

  const isIPAddress = {
    validate: (value) =>
      !value ||
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(value) ||
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value) ||
      "Invalid IP address",
  };

  return (
    <Stack spacing={2} sx={{ px: 3 }}>
      {/* Quick Filter Presets */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Quick Search:
        </Typography>
        {quickPresets.map((preset) => (
          <Chip
            key={preset.key}
            label={preset.label}
            size="small"
            onClick={() => applyPreset(preset)}
            color={activePreset === preset.key ? "primary" : "default"}
            variant={activePreset === preset.key ? "filled" : "outlined"}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Stack>

      {/* Search Panel */}
      <CippButtonCard component="accordion" title="Search" accordionExpanded={true}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <CippFormComponent
              type="radio"
              row
              name="dateFilter"
              label="Date Range"
              options={[
                { label: "Relative", value: "relative" },
                { label: "Custom", value: "startEnd" },
              ]}
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>
          {formControl.watch("dateFilter") === "relative" && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CippFormComponent
                type="autoComplete"
                name="days"
                label="Time Range"
                options={[
                  { label: "Last 24 hours", value: 1 },
                  { label: "Last 2 days", value: 2 },
                  { label: "Last 7 days", value: 7 },
                  { label: "Last 10 days", value: 10 },
                ]}
                formControl={formControl}
                disabled={isMessageIdSet}
              />
            </Grid>
          )}
          {formControl.watch("dateFilter") === "startEnd" && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <CippFormComponent
                  type="datePicker"
                  name="startDate"
                  label="Start Date"
                  dateTimeType="datetime"
                  formControl={formControl}
                  disabled={isMessageIdSet}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CippFormComponent
                  type="datePicker"
                  name="endDate"
                  label="End Date"
                  dateTimeType="datetime"
                  formControl={formControl}
                  disabled={isMessageIdSet}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <CippFormComponent
              type="autoComplete"
              freeSolo
              multiple
              creatable
              name="sender"
              label="Sender"
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CippFormComponent
              type="autoComplete"
              freeSolo
              multiple
              creatable
              name="recipient"
              label="Recipient"
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>

          {/* Advanced Section */}
          <Grid size={12}>
            <Button
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            >
              Advanced Options
            </Button>
          </Grid>
          <Grid size={12}>
            <Collapse in={showAdvanced}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="messageId"
                    label="Message ID"
                    formControl={formControl}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="subject"
                    label="Subject"
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="status"
                    label="Status"
                    options={[
                      { label: "None", value: "None" },
                      { label: "Delivered", value: "Delivered" },
                      { label: "Failed", value: "Failed" },
                      { label: "Quarantined", value: "Quarantined" },
                      { label: "Filtered As Spam", value: "FilteredAsSpam" },
                      { label: "Expanded", value: "Expanded" },
                      { label: "Pending", value: "Pending" },
                    ]}
                    multiple
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="quarantineType"
                    label="Quarantine Type"
                    options={[
                      { label: "Spam", value: "Spam" },
                      { label: "Phish", value: "Phish" },
                      { label: "Malware", value: "Malware" },
                      { label: "High Confidence Phish", value: "HighConfPhish" },
                    ]}
                    multiple
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="fromIP"
                    label="From IP"
                    formControl={formControl}
                    validators={isIPAddress}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="toIP"
                    label="To IP"
                    formControl={formControl}
                    validators={isIPAddress}
                    disabled={isMessageIdSet}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          <Grid size={12} sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => onSubmit()} variant="contained" color="primary" startIcon={<Search />}>
              Search
            </Button>
            <Button onClick={onClear} variant="outlined" startIcon={<ClearAll />}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </CippButtonCard>

      {/* Error Alerts */}
      {traceError && (
        <Alert severity="warning" onClose={() => setTraceError(null)}>
          {traceError}
        </Alert>
      )}
      {quarantineError && (
        <Alert severity="warning" onClose={() => setQuarantineError(null)}>
          {quarantineError}
        </Alert>
      )}

      {/* Results Tabs — placeholder, implemented in Task 7 */}
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab
          label={
            <Badge badgeContent={summary?.traceCount ?? 0} color="primary" max={999}>
              <span style={{ paddingRight: 12 }}>Message Trace</span>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={summary?.quarantineUnreleased ?? 0} color="warning" max={999}>
              <span style={{ paddingRight: 12 }}>Quarantine</span>
            </Badge>
          }
        />
      </Tabs>

      {activeTab === 0 && (
        <CippDataTable
          title="Message Trace Results"
          simpleColumns={["Received", "Status", "SenderAddress", "RecipientAddress", "Subject"]}
          data={traceResults}
          isFetching={searchApi.isPending}
          refreshFunction={() => onSubmit()}
        />
      )}

      {activeTab === 1 && (
        <CippDataTable
          title="Quarantine Results"
          simpleColumns={["ReceivedTime", "ReleaseStatus", "Subject", "SenderAddress", "RecipientAddress", "Type", "PolicyName"]}
          data={quarantineResults}
          isFetching={searchApi.isPending}
          refreshFunction={() => onSubmit()}
        />
      )}
    </Stack>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
```

- [ ] **Step 2: Verify the page compiles**

```bash
cd /Users/clint/Documents/GitHub/CIPP
npm run build
```

Expected: Build succeeds. The page should render at `/email/troubleshooting/email-troubleshooter`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/email/troubleshooting/email-troubleshooter/index.js
git commit -m "feat: add Email Troubleshooter page with search panel and basic tabbed results"
```

---

## Task 7: Frontend — Trace Tab Actions and Quarantine Tab with Bulk Operations

**Files:**
- Modify: `CIPP/src/pages/email/troubleshooting/email-troubleshooter/index.js`

- [ ] **Step 1: Add imports for action icons and dialogs**

At the top of the file, add to the MUI imports:

```javascript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  Close,
  Done,
  DoneAll,
  Block,
  ContentCopy,
  CheckCircle,
  Pending,
  Cancel,
} from "@mui/icons-material";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CippMessageViewer } from "../../../../components/CippComponents/CippMessageViewer.jsx";
import { ApiGetCall } from "../../../../api/ApiCall";
```

- [ ] **Step 2: Add trace tab row actions**

Inside the `Page` component, add the trace actions array and detail dialog state:

```javascript
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [traceDetailData, setTraceDetailData] = useState([]);
  const [detailMessageId, setDetailMessageId] = useState(null);

  const traceDetailApi = ApiPostCall({
    urlFromData: true,
    queryKey: `TraceDetail-${detailMessageId}`,
    onResult: (result) => setTraceDetailData(result),
  });

  const viewTraceDetail = (row) => {
    setDetailMessageId(row.MessageTraceId);
    traceDetailApi.mutate({
      url: "/api/ListMessageTrace",
      data: {
        tenantFilter,
        id: row.MessageTraceId,
        recipient: row.RecipientAddress,
        traceDetail: true,
      },
    });
    setDetailDialogOpen(true);
  };

  const traceActions = [
    {
      label: "View Delivery Details",
      noConfirm: true,
      customFunction: viewTraceDetail,
      icon: <DocumentTextIcon />,
    },
    {
      label: "View in Explorer",
      noConfirm: true,
      link: `https://security.microsoft.com/realtimereportsv3?tid=${tenantFilter}&dltarget=Explorer&dlstorage=Url&viewid=allemail&query-NetworkMessageId=[MessageTraceId]`,
      icon: <DocumentTextIcon />,
    },
    {
      label: "Allow Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Allow",
        notes: "!Allowed via Email Troubleshooter",
        RemoveAfter: true,
      },
      confirmText: "Allow this sender for all users in the tenant?",
      icon: <CheckCircle />,
    },
    {
      label: "Block Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Block",
        notes: "!Blocked via Email Troubleshooter",
        NoExpiration: true,
      },
      confirmText: "Block this sender for all users in the tenant?",
      icon: <Block />,
    },
    {
      label: "Release from Quarantine",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "MessageId", Type: "!Release" },
      confirmText: "Release this message from quarantine?",
      icon: <Done />,
      condition: (row) => row.Status === "Quarantined",
    },
    {
      label: "Copy Message ID",
      noConfirm: true,
      customFunction: (row) => navigator.clipboard.writeText(row.MessageId || row.MessageTraceId),
      icon: <ContentCopy />,
    },
  ];
```

- [ ] **Step 3: Add quarantine tab row actions with bulk support**

```javascript
  const [selectedQuarantineRows, setSelectedQuarantineRows] = useState([]);
  const [messageViewerOpen, setMessageViewerOpen] = useState(false);
  const [messageViewerContent, setMessageViewerContent] = useState(null);
  const [viewMessageId, setViewMessageId] = useState(null);
  const [messageContentsWaiting, setMessageContentsWaiting] = useState(false);

  const getMessageContents = ApiGetCall({
    url: "/api/ListMailQuarantineMessage",
    data: { tenantFilter, Identity: viewMessageId },
    waiting: messageContentsWaiting,
    queryKey: `QuarantineMessage-${viewMessageId}`,
  });

  const viewQuarantineMessage = (row) => {
    setViewMessageId(row.Identity);
    if (!messageContentsWaiting) setMessageContentsWaiting(true);
    getMessageContents.refetch();
    setMessageViewerOpen(true);
  };

  const bulkReleaseApi = ApiPostCall({
    urlFromData: true,
    queryKey: "BulkQuarantineRelease",
  });

  const handleBulkRelease = (type, addAllowEntry = false) => {
    const identities = selectedQuarantineRows.map((r) => r.Identity);
    if (identities.length > 50) {
      if (!window.confirm(`WARNING: You are about to process ${identities.length} messages. This may take a while and could have significant impact. Continue?`)) return;
    } else if (identities.length > 10) {
      if (!window.confirm(`You are about to ${type.toLowerCase()} ${identities.length} messages. Are you sure?`)) return;
    }
    bulkReleaseApi.mutate({
      url: "/api/ExecQuarantineManagement",
      data: {
        tenantFilter,
        Identity: identities,
        Type: type,
        AddAllowEntry: addAllowEntry,
      },
    });
  };

  const quarantineActions = [
    {
      label: "View Message",
      noConfirm: true,
      customFunction: viewQuarantineMessage,
      icon: <EyeIcon />,
    },
    {
      label: "View Delivery Timeline",
      noConfirm: true,
      customFunction: (row) => {
        setDetailMessageId(row.MessageId);
        traceDetailApi.mutate({
          url: "/api/ListMessageTrace",
          data: { tenantFilter, messageId: row.MessageId },
        });
        setDetailDialogOpen(true);
      },
      icon: <DocumentTextIcon />,
    },
    {
      label: "Release",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release" },
      confirmText: "Release this message?",
      icon: <Done />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Deny",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Deny" },
      confirmText: "Deny this message?",
      icon: <Block />,
      condition: (row) => row.ReleaseStatus !== "DENIED",
    },
    {
      label: "Release & Allow Sender",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release", AllowSender: true },
      confirmText: "Release and allow this sender?",
      icon: <DoneAll />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Release & Add Allow Entry",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release", AddAllowEntry: true },
      confirmText: "Release and add sender to Tenant Allow List?",
      icon: <DoneAll />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Block Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Block",
        notes: "!Blocked via Email Troubleshooter",
        NoExpiration: true,
      },
      confirmText: "Block this sender?",
      icon: <Block />,
    },
  ];
```

- [ ] **Step 4: Update the results area JSX with actions, bulk toolbar, and dialogs**

Replace the placeholder tabs/tables JSX with the full implementation including the actions, bulk action toolbar for quarantine, and dialogs (detail dialog, message viewer dialog). Wire up `onChange={(rows) => setSelectedQuarantineRows(rows)}` on the quarantine `CippDataTable` to enable row selection for bulk actions (CippDataTable enables selection automatically when `onChange` is provided). Add a toolbar above the quarantine table with bulk action buttons (Release Selected, Deny Selected, Release & Allow All) that are disabled when no rows are selected. Add the quarantine `Quarantined` status chip click handler on the trace table to switch tabs.

- [ ] **Step 5: Add the detail dialog and message viewer dialog JSX**

After the tabs area, add:

```jsx
      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ py: 2 }}>
          Delivery Details
          <IconButton onClick={() => setDetailDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {traceDetailApi.isPending && (
            <Typography variant="body1" sx={{ py: 4 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Loading delivery details...
            </Typography>
          )}
          {traceDetailApi.isSuccess && (
            <CippDataTable
              noCard
              title="Delivery Timeline"
              simpleColumns={["Date", "Event", "Action", "Detail"]}
              data={traceDetailData ?? []}
              isFetching={traceDetailApi.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Message Viewer Dialog */}
      <Dialog open={messageViewerOpen} onClose={() => setMessageViewerOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ py: 2 }}>
          Quarantine Message
          <IconButton onClick={() => setMessageViewerOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {getMessageContents.isSuccess ? (
            <CippMessageViewer emailSource={getMessageContents?.data?.Message} />
          ) : (
            <Skeleton variant="rectangular" height={400} />
          )}
        </DialogContent>
      </Dialog>
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/email/troubleshooting/email-troubleshooter/index.js
git commit -m "feat: add trace and quarantine tab actions, bulk operations, and detail dialogs"
```

---

## Task 8: Frontend — Enhanced Detail Panel with Delivery Timeline

**Files:**
- Modify: `CIPP/src/pages/email/troubleshooting/email-troubleshooter/index.js`

This task enhances the detail dialog from a plain table to a visual delivery timeline with authentication results and a quick actions bar.

**Note:** The backend `Invoke-ExecEmailTroubleshoot` trace detail path should also return auth summary data. When implementing, extend the trace detail API call (which goes through `Invoke-ListMessageTrace` with `traceDetail: true`) to also call `ConvertTo-AuthenticationSummary` on the Detail fields and return the parsed auth data alongside the timeline events. This may require a small modification to `Invoke-ListMessageTrace.ps1` to attach an `AuthSummary` property to the response when `traceDetail` is true.

- [ ] **Step 1: Add timeline rendering component**

Add a `DeliveryTimeline` component inside the file (above the `Page` component) or as a separate component. This renders trace detail events as a vertical timeline with color-coded cards:

```jsx
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from "@mui/lab";
import { Paper } from "@mui/material";

const getEventColor = (event) => {
  const e = (event || "").toUpperCase();
  if (e.includes("DELIVER") || e.includes("RESOLVE")) return "success";
  if (e.includes("FAIL") || e.includes("DROP")) return "error";
  if (e.includes("QUARANTINE")) return "warning";
  return "grey";
};

const DeliveryTimeline = ({ events }) => {
  if (!events?.length) return <Typography>No delivery events found.</Typography>;

  return (
    <Timeline position="right">
      {events.map((evt, idx) => (
        <TimelineItem key={idx}>
          <TimelineOppositeContent sx={{ maxWidth: 120, flex: "none" }}>
            <Typography variant="caption" color="text.secondary">
              {evt.Date}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={getEventColor(evt.Event)} />
            {idx < events.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Paper elevation={0} sx={{ p: 1.5, mb: 1, bgcolor: "background.default", borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {evt.Event}
              </Typography>
              {evt.Action && (
                <Typography variant="body2" color="text.secondary">
                  Action: {evt.Action}
                </Typography>
              )}
              {evt.Detail && (
                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                  {evt.Detail}
                </Typography>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
```

- [ ] **Step 2: Verify @mui/lab is available**

`@mui/lab` is already a dependency in `package.json`. Verify:
```bash
cd /Users/clint/Documents/GitHub/CIPP
grep "@mui/lab" package.json
```
Expected: Shows `@mui/lab` in dependencies.

- [ ] **Step 3: Replace the plain table in the detail dialog with the timeline**

In the detail dialog's `DialogContent`, replace the `CippDataTable` with:

```jsx
          {traceDetailApi.isSuccess && (
            <DeliveryTimeline events={traceDetailData ?? []} />
          )}
```

- [ ] **Step 4: Verify build and visual output**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add delivery timeline visualization to detail panel"
```

---

## Task 9: Frontend — Cross-Tab Linking and Status Chips

**Files:**
- Modify: `CIPP/src/pages/email/troubleshooting/email-troubleshooter/index.js`

- [ ] **Step 1: Add custom cell renderer for Status column in trace tab**

Add a column definition override for the Status column that renders color-coded chips. When the chip shows "Quarantined", make it clickable to switch to the Quarantine tab:

```javascript
  const traceColumns = [
    {
      header: "Status",
      accessorKey: "Status",
      Cell: ({ row }) => {
        const status = row.original.Status;
        const colorMap = {
          Delivered: "success",
          Quarantined: "warning",
          Failed: "error",
          FilteredAsSpam: "warning",
        };
        const isQuarantined = status === "Quarantined";
        return (
          <Chip
            label={status}
            color={colorMap[status] || "default"}
            size="small"
            variant="outlined"
            onClick={isQuarantined ? () => {
              setActiveTab(1);
              setHighlightMessageId(row.original.MessageId);
            } : undefined}
            sx={isQuarantined ? { cursor: "pointer" } : {}}
          />
        );
      },
    },
  ];
```

Add state for cross-tab highlighting:
```javascript
  const [highlightMessageId, setHighlightMessageId] = useState(null);
```

Then update the trace `CippDataTable` to use `columns` prop alongside `simpleColumns` for the non-custom columns.

When `highlightMessageId` is set, filter the quarantine results to show the matching message. If no match is found in the quarantine data, show an alert: "This message was not found in the current quarantine results. It may have already been released or expired."

- [ ] **Step 2: Add release status chips to quarantine tab**

Similarly add a cell renderer for `ReleaseStatus` on the quarantine table using the same color-coded chip pattern from the existing quarantine page.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/email/troubleshooting/email-troubleshooter/index.js
git commit -m "feat: add color-coded status chips and cross-tab quarantine linking"
```

---

## Task 10: Final Verification and Cleanup

- [ ] **Step 1: Verify all moved pages resolve correctly**

Start the dev server and navigate to each new route:
- `/email/troubleshooting/email-troubleshooter`
- `/email/troubleshooting/message-viewer`
- `/email/troubleshooting/mailbox-restores`
- `/email/troubleshooting/mailbox-restore-wizard` (via mailbox-restores add flow)
- `/email/administration/quarantine` (still works at old path)

Verify old routes return 404:
- `/email/tools/message-trace`
- `/email/tools/message-viewer`
- `/email/tools/mailbox-restores`

- [ ] **Step 2: Verify sidebar navigation renders correctly**

Check that:
- Troubleshooting appears as first submenu under Email & Exchange
- All four items are visible: Email Troubleshooter, Quarantine, Message Viewer, Mailbox Restores
- Mail Test still appears under Tools > Email Tools

- [ ] **Step 3: Run full build**

```bash
cd /Users/clint/Documents/GitHub/CIPP
npm run build
```

```bash
cd /Users/clint/Documents/GitHub/CIPP-API
pwsh -c "Import-Module ./Modules/CIPPCore -Force; Write-Host 'Module loaded successfully'"
```

- [ ] **Step 4: Final commit**

```bash
cd /Users/clint/Documents/GitHub/CIPP
git add -A
git commit -m "chore: final cleanup and route verification for email troubleshooter"
```
