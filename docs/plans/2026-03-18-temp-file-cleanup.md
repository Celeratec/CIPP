# Temp File Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a wizard-based tool for MSPs to clean up temp files from SharePoint/OneDrive in managed tenants.

**Architecture:** 5-step React wizard on frontend calls two PowerShell endpoints (scan + cleanup). Scanning uses Graph API with hybrid real-time/background approach. Deletion moves files to recycle bin.

**Tech Stack:** React/MUI (frontend), PowerShell Azure Functions (backend), Microsoft Graph API

---

## Task 1: Backend - Scan Endpoint

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Teams-Sharepoint/Invoke-ExecTempFileScan.ps1`

**Step 1: Create the scan endpoint skeleton**

```powershell
function Invoke-ExecTempFileScan {
    <#
    .FUNCTIONALITY Entrypoint
    .ROLE Sharepoint.Site.ReadWrite
    #>
    param($Request, $TriggerMetadata)
    
    $APIName = $Request.Params.CIPPEndpoint
    $TenantFilter = $Request.Body.tenantFilter
    $Scope = $Request.Body.scope
    $SiteId = $Request.Body.siteId
    $UserId = $Request.Body.userId
    $Filters = $Request.Body.filters
    
    try {
        $Results = @()
        
        # Determine which sites/drives to scan
        $DrivesToScan = switch ($Scope) {
            'site' {
                $SiteInfo = New-GraphGetRequest -uri "https://graph.microsoft.com/v1.0/sites/$SiteId" -tenantid $TenantFilter -AsApp $true
                @(@{ DriveId = $SiteInfo.drive.id; SiteName = $SiteInfo.displayName; SiteUrl = $SiteInfo.webUrl })
            }
            'user' {
                $DriveInfo = New-GraphGetRequest -uri "https://graph.microsoft.com/v1.0/users/$UserId/drive" -tenantid $TenantFilter -AsApp $true
                @(@{ DriveId = $DriveInfo.id; SiteName = "OneDrive - $UserId"; SiteUrl = $DriveInfo.webUrl })
            }
            'allSites' {
                $Sites = New-GraphGetRequest -uri "https://graph.microsoft.com/v1.0/sites?`$top=100" -tenantid $TenantFilter -AsApp $true
                $Sites | ForEach-Object {
                    @{ DriveId = $_.drive.id; SiteName = $_.displayName; SiteUrl = $_.webUrl }
                }
            }
            'allOneDrives' {
                $Users = New-GraphGetRequest -uri "https://graph.microsoft.com/v1.0/users?`$filter=assignedLicenses/`$count ne 0&`$count=true" -tenantid $TenantFilter -AsApp $true -ComplexFilter
                $Users | ForEach-Object {
                    try {
                        $Drive = New-GraphGetRequest -uri "https://graph.microsoft.com/v1.0/users/$($_.id)/drive" -tenantid $TenantFilter -AsApp $true -NoAuthCheck $true
                        @{ DriveId = $Drive.id; SiteName = "OneDrive - $($_.displayName)"; SiteUrl = $Drive.webUrl }
                    } catch { $null }
                } | Where-Object { $_ }
            }
        }
        
        foreach ($Drive in $DrivesToScan) {
            $DriveFiles = Get-TempFilesRecursive -TenantFilter $TenantFilter -DriveId $Drive.DriveId -Filters $Filters
            $DriveFiles | ForEach-Object {
                $_.SiteName = $Drive.SiteName
                $_.SiteUrl = $Drive.SiteUrl
            }
            $Results += $DriveFiles
        }
        
        $Body = @{
            Results = $Results
            TotalCount = $Results.Count
            TotalSize = ($Results | Measure-Object -Property size -Sum).Sum
        }
        $StatusCode = [HttpStatusCode]::OK
    } catch {
        $Body = @{ Results = "Failed to scan: $_" }
        $StatusCode = [HttpStatusCode]::InternalServerError
    }
    
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = $StatusCode
        Body = $Body
    })
}
```

**Step 2: Test the endpoint skeleton loads**

Run: Start the Azure Functions locally or deploy to test environment
Expected: Endpoint responds to POST requests

**Step 3: Commit**

```bash
git add Modules/CIPPCore/Public/Entrypoints/HTTP\ Functions/Teams-Sharepoint/Invoke-ExecTempFileScan.ps1
git commit -m "feat: add temp file scan endpoint skeleton"
```

---

## Task 2: Backend - Recursive File Scanner Helper

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/SharepointHelper/Get-TempFilesRecursive.ps1`

**Step 1: Create the recursive scanner function**

```powershell
function Get-TempFilesRecursive {
    param(
        [string]$TenantFilter,
        [string]$DriveId,
        [hashtable]$Filters,
        [string]$FolderId = 'root',
        [int]$MaxDepth = 10,
        [int]$CurrentDepth = 0
    )
    
    if ($CurrentDepth -ge $MaxDepth) { return @() }
    
    $Results = @()
    $Uri = "https://graph.microsoft.com/v1.0/drives/$DriveId/items/$FolderId/children?`$top=200"
    
    try {
        $Items = New-GraphGetRequest -uri $Uri -tenantid $TenantFilter -AsApp $true
    } catch {
        Write-Host "Failed to list folder $FolderId : $_"
        return @()
    }
    
    foreach ($Item in $Items) {
        if ($Item.folder) {
            $Results += Get-TempFilesRecursive -TenantFilter $TenantFilter -DriveId $DriveId -Filters $Filters -FolderId $Item.id -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1)
        } elseif ($Item.file) {
            $IsMatch = $false
            $MatchType = $null
            
            # Check Office temp files (~$*)
            if ($Filters.officeTemp -and $Item.name -match '^\~\$') {
                $IsMatch = $true
                $MatchType = 'officeTemp'
            }
            
            # Check .TMP and .temp files
            if ($Filters.tempFiles -and $Item.name -match '\.(TMP|temp)$') {
                $IsMatch = $true
                $MatchType = 'tempFiles'
            }
            
            # Check zero-byte files
            if ($Filters.zeroByteFiles -and $Item.size -eq 0) {
                $IsMatch = $true
                $MatchType = 'zeroByteFiles'
            }
            
            # Check system junk
            if ($Filters.systemJunk -and $Item.name -in @('Thumbs.db', '.DS_Store', 'desktop.ini')) {
                $IsMatch = $true
                $MatchType = 'systemJunk'
            }
            
            # Check backup files
            if ($Filters.backupFiles -and $Item.name -match '\.(bak|old)$') {
                $IsMatch = $true
                $MatchType = 'backupFiles'
            }
            
            if ($IsMatch) {
                $Results += @{
                    id = $Item.id
                    driveId = $DriveId
                    name = $Item.name
                    path = $Item.parentReference.path -replace '/drive/root:', ''
                    size = $Item.size
                    type = $MatchType
                    lastModifiedDateTime = $Item.lastModifiedDateTime
                    webUrl = $Item.webUrl
                }
            }
        }
    }
    
    return $Results
}
```

**Step 2: Test with a known drive**

Use Graph Explorer or PowerShell to verify the function finds temp files in a test site.

**Step 3: Commit**

```bash
git add Modules/CIPPCore/Public/SharepointHelper/Get-TempFilesRecursive.ps1
git commit -m "feat: add recursive temp file scanner helper"
```

---

## Task 3: Backend - Cleanup Endpoint

**Files:**
- Create: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Teams-Sharepoint/Invoke-ExecTempFileCleanup.ps1`

**Step 1: Create the cleanup endpoint**

```powershell
function Invoke-ExecTempFileCleanup {
    <#
    .FUNCTIONALITY Entrypoint
    .ROLE Sharepoint.Site.ReadWrite
    #>
    param($Request, $TriggerMetadata)
    
    $APIName = $Request.Params.CIPPEndpoint
    $TenantFilter = $Request.Body.tenantFilter
    $Files = $Request.Body.files
    
    $Results = @()
    $SuccessCount = 0
    $FailureCount = 0
    
    foreach ($File in $Files) {
        try {
            $Uri = "https://graph.microsoft.com/v1.0/drives/$($File.driveId)/items/$($File.id)"
            New-GraphPostRequest -uri $Uri -tenantid $TenantFilter -AsApp $true -type DELETE
            
            $Results += @{
                id = $File.id
                name = $File.name
                status = 'deleted'
                message = 'Moved to recycle bin'
            }
            $SuccessCount++
        } catch {
            $ErrorMessage = Get-NormalizedError -message $_
            $Results += @{
                id = $File.id
                name = $File.name
                status = 'failed'
                message = $ErrorMessage
            }
            $FailureCount++
        }
    }
    
    $Body = @{
        Results = $Results
        Summary = @{
            Total = $Files.Count
            Success = $SuccessCount
            Failed = $FailureCount
        }
    }
    
    Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
        StatusCode = [HttpStatusCode]::OK
        Body = $Body
    })
}
```

**Step 2: Commit**

```bash
git add Modules/CIPPCore/Public/Entrypoints/HTTP\ Functions/Teams-Sharepoint/Invoke-ExecTempFileCleanup.ps1
git commit -m "feat: add temp file cleanup endpoint"
```

---

## Task 4: Frontend - Page and Wizard Shell

**Files:**
- Create: `CIPP/src/pages/teams-share/sharepoint/temp-file-cleanup.js`

**Step 1: Create the page with wizard structure**

```javascript
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { CippWizardConfirmation } from "/src/components/CippWizard/CippWizardConfirmation.jsx";
import { Box, Container, Stack, Step, StepLabel, Stepper, Typography, Card, CardContent, Alert } from "@mui/material";
import { useState } from "react";
import { StepSelectScope } from "/src/components/CippWizard/TempFileCleanup/StepSelectScope";
import { StepConfigureFilters } from "/src/components/CippWizard/TempFileCleanup/StepConfigureFilters";
import { StepScanResults } from "/src/components/CippWizard/TempFileCleanup/StepScanResults";
import { StepSelectFiles } from "/src/components/CippWizard/TempFileCleanup/StepSelectFiles";
import { StepConfirmDelete } from "/src/components/CippWizard/TempFileCleanup/StepConfirmDelete";

const steps = [
  { label: "Select Scope", description: "Choose where to look" },
  { label: "Configure Filters", description: "Select file types" },
  { label: "Scan", description: "Find matching files" },
  { label: "Select Files", description: "Review and select" },
  { label: "Confirm", description: "Execute cleanup" },
];

const Page = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    tenant: null,
    scope: 'site',
    siteId: null,
    userId: null,
    filters: {
      officeTemp: true,
      tempFiles: true,
      zeroByteFiles: true,
      systemJunk: true,
      backupFiles: false,
    },
    scanResults: [],
    selectedFiles: [],
  });

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const updateWizardData = (data) => setWizardData((prev) => ({ ...prev, ...data }));

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <StepSelectScope data={wizardData} onUpdate={updateWizardData} onNext={handleNext} />;
      case 1:
        return <StepConfigureFilters data={wizardData} onUpdate={updateWizardData} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <StepScanResults data={wizardData} onUpdate={updateWizardData} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <StepSelectFiles data={wizardData} onUpdate={updateWizardData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <StepConfirmDelete data={wizardData} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Typography variant="h4">Temp File Cleanup</Typography>
          <Alert severity="info">
            This wizard helps you find and remove temporary files from SharePoint and OneDrive. 
            Deleted files are moved to the recycle bin and can be recovered for 93 days.
          </Alert>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Card>
            <CardContent>{renderStep()}</CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
```

**Step 2: Commit**

```bash
git add src/pages/teams-share/sharepoint/temp-file-cleanup.js
git commit -m "feat: add temp file cleanup page with wizard shell"
```

---

## Task 5: Frontend - Step 1 (Select Scope)

**Files:**
- Create: `CIPP/src/components/CippWizard/TempFileCleanup/StepSelectScope.jsx`

**Step 1: Create the scope selection component**

```javascript
import { Stack, Typography, RadioGroup, FormControlLabel, Radio, Button, Box, Alert } from "@mui/material";
import { CippAutoComplete } from "/src/components/CippComponents/CippAutocomplete";

export const StepSelectScope = ({ data, onUpdate, onNext }) => {
  const handleScopeChange = (event) => {
    onUpdate({ scope: event.target.value, siteId: null, userId: null });
  };

  const canProceed = data.tenant && (
    (data.scope === 'site' && data.siteId) ||
    (data.scope === 'user' && data.userId) ||
    data.scope === 'allSites' ||
    data.scope === 'allOneDrives'
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Let&apos;s find those temp files! First, choose where to look.</Typography>
      
      <CippAutoComplete
        api={{
          url: "/api/ListTenants",
          queryKey: "ListTenants",
          labelField: "displayName",
          valueField: "defaultDomainName",
        }}
        label="Select Tenant"
        value={data.tenant}
        onChange={(value) => onUpdate({ tenant: value })}
        required
      />

      {data.tenant && (
        <>
          <Typography variant="subtitle1">Scope</Typography>
          <RadioGroup value={data.scope} onChange={handleScopeChange}>
            <FormControlLabel value="site" control={<Radio />} label="Specific SharePoint site" />
            <FormControlLabel value="user" control={<Radio />} label="Specific user's OneDrive" />
            <FormControlLabel value="allSites" control={<Radio />} label="All SharePoint sites" />
            <FormControlLabel value="allOneDrives" control={<Radio />} label="All OneDrives" />
          </RadioGroup>

          {data.scope === 'site' && (
            <CippAutoComplete
              api={{
                url: "/api/ListSites",
                queryKey: "ListSites",
                data: { tenantFilter: data.tenant?.value },
                labelField: "displayName",
                valueField: "id",
              }}
              label="Select SharePoint Site"
              value={data.siteId}
              onChange={(value) => onUpdate({ siteId: value })}
            />
          )}

          {data.scope === 'user' && (
            <CippAutoComplete
              api={{
                url: "/api/ListUsers",
                queryKey: "ListUsers",
                data: { tenantFilter: data.tenant?.value },
                labelField: "displayName",
                valueField: "id",
              }}
              label="Select User"
              value={data.userId}
              onChange={(value) => onUpdate({ userId: value })}
            />
          )}

          {(data.scope === 'allSites' || data.scope === 'allOneDrives') && (
            <Alert severity="warning">
              Scanning all {data.scope === 'allSites' ? 'sites' : 'OneDrives'} may take several minutes for large tenants.
            </Alert>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" onClick={onNext} disabled={!canProceed}>
          Next
        </Button>
      </Box>
    </Stack>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/CippWizard/TempFileCleanup/StepSelectScope.jsx
git commit -m "feat: add scope selection step for temp file cleanup"
```

---

## Task 6: Frontend - Step 2 (Configure Filters)

**Files:**
- Create: `CIPP/src/components/CippWizard/TempFileCleanup/StepConfigureFilters.jsx`

**Step 1: Create the filter configuration component**

```javascript
import { Stack, Typography, FormGroup, FormControlLabel, Checkbox, Button, Box, Paper } from "@mui/material";

const filterOptions = [
  { key: 'officeTemp', label: 'Office temp files (~$*)', description: 'Created when editing Word, Excel, PowerPoint', defaultChecked: true },
  { key: 'tempFiles', label: 'Temporary files (*.TMP, *.temp)', description: 'System and app temp files', defaultChecked: true },
  { key: 'zeroByteFiles', label: 'Zero-byte files', description: 'Empty files that serve no purpose', defaultChecked: true },
  { key: 'systemJunk', label: 'System junk (Thumbs.db, .DS_Store, desktop.ini)', description: 'OS-generated metadata files', defaultChecked: true },
  { key: 'backupFiles', label: 'Backup files (*.bak, *.old)', description: 'May be intentional - review carefully', defaultChecked: false },
];

export const StepConfigureFilters = ({ data, onUpdate, onNext, onBack }) => {
  const handleFilterChange = (key) => (event) => {
    onUpdate({
      filters: {
        ...data.filters,
        [key]: event.target.checked,
      },
    });
  };

  const hasAnyFilter = Object.values(data.filters).some(Boolean);

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Select which file types to scan for. We recommend starting with the common ones.</Typography>
      
      <FormGroup>
        {filterOptions.map((option) => (
          <Paper key={option.key} sx={{ p: 2, mb: 1 }} variant="outlined">
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.filters[option.key]}
                  onChange={handleFilterChange(option.key)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{option.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{option.description}</Typography>
                </Box>
              }
            />
          </Paper>
        ))}
      </FormGroup>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext} disabled={!hasAnyFilter}>
          Start Scan
        </Button>
      </Box>
    </Stack>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/CippWizard/TempFileCleanup/StepConfigureFilters.jsx
git commit -m "feat: add filter configuration step for temp file cleanup"
```

---

## Task 7: Frontend - Step 3 (Scan Results)

**Files:**
- Create: `CIPP/src/components/CippWizard/TempFileCleanup/StepScanResults.jsx`

**Step 1: Create the scan results component**

```javascript
import { Stack, Typography, Button, Box, LinearProgress, Alert, Card, CardContent } from "@mui/material";
import { useEffect, useState } from "react";
import { ApiGetCall } from "/src/api/ApiCall";
import { getCippFormatting } from "/src/utils/get-cipp-formatting";

export const StepScanResults = ({ data, onUpdate, onNext, onBack }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const scanMutation = ApiGetCall({
    url: "/api/ExecTempFileScan",
    queryKey: ["TempFileScan", data.tenant?.value, data.scope, data.siteId?.value, data.userId?.value],
    data: {
      tenantFilter: data.tenant?.value,
      scope: data.scope,
      siteId: data.siteId?.value,
      userId: data.userId?.value,
      filters: data.filters,
    },
  });

  useEffect(() => {
    if (scanMutation.isSuccess) {
      setIsScanning(false);
      onUpdate({
        scanResults: scanMutation.data?.Results || [],
        selectedFiles: scanMutation.data?.Results || [],
      });
    } else if (scanMutation.isError) {
      setIsScanning(false);
      setError(scanMutation.error?.message || "Scan failed");
    }
  }, [scanMutation.isSuccess, scanMutation.isError, scanMutation.data]);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const totalSize = data.scanResults.reduce((sum, file) => sum + (file.size || 0), 0);

  return (
    <Stack spacing={3}>
      <Typography variant="h6">
        {isScanning ? "Scanning... This may take a moment for large sites." : "Scan Complete"}
      </Typography>

      {isScanning && (
        <Box>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Searching for temp files...
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isScanning && !error && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5">
              Found {data.scanResults.length} files ({getCippFormatting(totalSize, "size", "bytes")})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              matching your criteria
            </Typography>
          </CardContent>
        </Card>
      )}

      {!isScanning && data.scanResults.length === 0 && !error && (
        <Alert severity="success">No temp files found! Your storage is clean.</Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={onBack} disabled={isScanning}>Back</Button>
        <Button 
          variant="contained" 
          onClick={onNext} 
          disabled={isScanning || data.scanResults.length === 0}
        >
          Review Files
        </Button>
      </Box>
    </Stack>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/CippWizard/TempFileCleanup/StepScanResults.jsx
git commit -m "feat: add scan results step for temp file cleanup"
```

---

## Task 8: Frontend - Step 4 (Select Files)

**Files:**
- Create: `CIPP/src/components/CippWizard/TempFileCleanup/StepSelectFiles.jsx`

**Step 1: Create the file selection component**

```javascript
import { Stack, Typography, Button, Box, Checkbox, TextField, Chip } from "@mui/material";
import { CippDataTable } from "/src/components/CippTable/CippDataTable";
import { useState, useMemo } from "react";
import { getCippFormatting } from "/src/utils/get-cipp-formatting";

const typeLabels = {
  officeTemp: "Office Temp",
  tempFiles: "Temp File",
  zeroByteFiles: "Zero Byte",
  systemJunk: "System Junk",
  backupFiles: "Backup",
};

export const StepSelectFiles = ({ data, onUpdate, onNext, onBack }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(null);

  const filteredFiles = useMemo(() => {
    return data.scanResults.filter((file) => {
      const matchesSearch = !search || file.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || file.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [data.scanResults, search, typeFilter]);

  const handleSelectAll = () => {
    onUpdate({ selectedFiles: [...data.scanResults] });
  };

  const handleSelectNone = () => {
    onUpdate({ selectedFiles: [] });
  };

  const handleSelectByType = (type) => {
    const filesOfType = data.scanResults.filter((f) => f.type === type);
    const currentIds = new Set(data.selectedFiles.map((f) => f.id));
    const allSelected = filesOfType.every((f) => currentIds.has(f.id));
    
    if (allSelected) {
      onUpdate({ selectedFiles: data.selectedFiles.filter((f) => f.type !== type) });
    } else {
      const newSelected = [...data.selectedFiles];
      filesOfType.forEach((f) => {
        if (!currentIds.has(f.id)) newSelected.push(f);
      });
      onUpdate({ selectedFiles: newSelected });
    }
  };

  const handleRowSelect = (file, isSelected) => {
    if (isSelected) {
      onUpdate({ selectedFiles: [...data.selectedFiles, file] });
    } else {
      onUpdate({ selectedFiles: data.selectedFiles.filter((f) => f.id !== file.id) });
    }
  };

  const selectedSize = data.selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const types = [...new Set(data.scanResults.map((f) => f.type))];

  const columns = [
    { 
      header: "", 
      id: "select",
      cell: ({ row }) => {
        const isSelected = data.selectedFiles.some((f) => f.id === row.original.id);
        return (
          <Checkbox 
            checked={isSelected} 
            onChange={(e) => handleRowSelect(row.original, e.target.checked)}
          />
        );
      },
      size: 50,
    },
    { header: "Name", accessorKey: "name" },
    { header: "Path", accessorKey: "path" },
    { 
      header: "Size", 
      accessorKey: "size",
      cell: ({ getValue }) => getCippFormatting(getValue(), "size", "bytes"),
    },
    { 
      header: "Type", 
      accessorKey: "type",
      cell: ({ getValue }) => <Chip label={typeLabels[getValue()] || getValue()} size="small" />,
    },
    { 
      header: "Modified", 
      accessorKey: "lastModifiedDateTime",
      cell: ({ getValue }) => getCippFormatting(getValue(), "date"),
    },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Review the files below. Uncheck any you want to keep.</Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button size="small" variant="outlined" onClick={handleSelectAll}>Select All</Button>
        <Button size="small" variant="outlined" onClick={handleSelectNone}>Select None</Button>
        {types.map((type) => (
          <Button 
            key={type} 
            size="small" 
            variant="outlined" 
            onClick={() => handleSelectByType(type)}
          >
            Toggle {typeLabels[type]}
          </Button>
        ))}
      </Box>

      <TextField
        placeholder="Search files..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
      />

      <Typography variant="body2" color="text.secondary">
        {data.selectedFiles.length} of {data.scanResults.length} files selected ({getCippFormatting(selectedSize, "size", "bytes")})
      </Typography>

      <CippDataTable
        data={filteredFiles}
        columns={columns}
        noCard
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={onBack}>Back</Button>
        <Button 
          variant="contained" 
          onClick={onNext} 
          disabled={data.selectedFiles.length === 0}
        >
          Continue to Confirmation
        </Button>
      </Box>
    </Stack>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/CippWizard/TempFileCleanup/StepSelectFiles.jsx
git commit -m "feat: add file selection step for temp file cleanup"
```

---

## Task 9: Frontend - Step 5 (Confirm Delete)

**Files:**
- Create: `CIPP/src/components/CippWizard/TempFileCleanup/StepConfirmDelete.jsx`

**Step 1: Create the confirmation component**

```javascript
import { Stack, Typography, Button, Box, Card, CardContent, Checkbox, FormControlLabel, Alert, Divider } from "@mui/material";
import { useState } from "react";
import { ApiPostCall } from "/src/api/ApiCall";
import { CippApiResults } from "/src/components/CippComponents/CippApiResults";
import { getCippFormatting } from "/src/utils/get-cipp-formatting";

export const StepConfirmDelete = ({ data, onBack }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState(null);

  const deleteMutation = ApiPostCall({
    url: "/api/ExecTempFileCleanup",
    queryKey: ["TempFileCleanup"],
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteMutation.mutateAsync({
        tenantFilter: data.tenant?.value,
        files: data.selectedFiles.map((f) => ({ id: f.id, driveId: f.driveId, name: f.name })),
      });
      setResults(response);
    } catch (error) {
      setResults({ error: error.message || "Deletion failed" });
    }
    setIsDeleting(false);
  };

  const selectedSize = data.selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const affectedSites = [...new Set(data.selectedFiles.map((f) => f.SiteName))];

  if (results) {
    return (
      <Stack spacing={3}>
        <Typography variant="h6">Cleanup Complete</Typography>
        <CippApiResults apiObject={deleteMutation} />
        {results.Summary && (
          <Alert severity={results.Summary.Failed > 0 ? "warning" : "success"}>
            Successfully deleted {results.Summary.Success} of {results.Summary.Total} files.
            {results.Summary.Failed > 0 && ` ${results.Summary.Failed} files could not be deleted.`}
          </Alert>
        )}
        <Alert severity="info">
          Deleted files can be recovered from the SharePoint/OneDrive recycle bin for 93 days.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Almost done! Please review carefully before confirming.</Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Files to delete:</Typography>
              <Typography fontWeight="bold">{data.selectedFiles.length}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Total size:</Typography>
              <Typography fontWeight="bold">{getCippFormatting(selectedSize, "size", "bytes")}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Affected locations:</Typography>
              <Typography fontWeight="bold">{affectedSites.length}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      <FormControlLabel
        control={
          <Checkbox 
            checked={confirmed} 
            onChange={(e) => setConfirmed(e.target.checked)}
            color="warning"
          />
        }
        label="I understand these files will be moved to the recycle bin"
      />

      <Alert severity="info">
        Files can be recovered from the site recycle bin for 93 days.
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={onBack} disabled={isDeleting}>Back</Button>
        <Button 
          variant="contained" 
          color="error"
          onClick={handleDelete} 
          disabled={!confirmed || isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Selected Files"}
        </Button>
      </Box>
    </Stack>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/CippWizard/TempFileCleanup/StepConfirmDelete.jsx
git commit -m "feat: add confirmation step for temp file cleanup"
```

---

## Task 10: Add Navigation Menu Item

**Files:**
- Modify: `CIPP/src/layouts/config.js`

**Step 1: Find the SharePoint section and add the new menu item**

Look for the SharePoint section in the navigation config and add:

```javascript
{
  title: "Temp File Cleanup",
  path: "/teams-share/sharepoint/temp-file-cleanup",
},
```

Add it after "Recycle Bin" in the SharePoint items array.

**Step 2: Commit**

```bash
git add src/layouts/config.js
git commit -m "feat: add temp file cleanup to navigation menu"
```

---

## Task 11: Integration Testing

**Step 1: Start the development servers**

Frontend:
```bash
cd CIPP && npm run dev
```

Backend:
```bash
cd CIPP-API && func start
```

**Step 2: Test the complete flow**

1. Navigate to Teams & SharePoint > SharePoint > Temp File Cleanup
2. Select a test tenant
3. Choose a specific SharePoint site (start small)
4. Keep default filters
5. Verify scan completes and shows results
6. Select some files
7. Confirm deletion
8. Verify files appear in recycle bin

**Step 3: Test edge cases**

- Empty site (no temp files found)
- Large site (timeout handling)
- Permission denied scenario
- Zero results with specific filter

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete temp file cleanup tool implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Scan endpoint | `Invoke-ExecTempFileScan.ps1` |
| 2 | Recursive scanner | `Get-TempFilesRecursive.ps1` |
| 3 | Cleanup endpoint | `Invoke-ExecTempFileCleanup.ps1` |
| 4 | Page + wizard shell | `temp-file-cleanup.js` |
| 5 | Step 1: Select Scope | `StepSelectScope.jsx` |
| 6 | Step 2: Configure Filters | `StepConfigureFilters.jsx` |
| 7 | Step 3: Scan Results | `StepScanResults.jsx` |
| 8 | Step 4: Select Files | `StepSelectFiles.jsx` |
| 9 | Step 5: Confirm Delete | `StepConfirmDelete.jsx` |
| 10 | Navigation menu | `config.js` |
| 11 | Integration testing | — |
