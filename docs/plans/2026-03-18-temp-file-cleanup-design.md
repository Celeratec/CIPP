# Temp File Cleanup Tool Design

**Date:** 2026-03-18  
**Status:** Approved  

## Overview

A wizard-based tool for MSPs to clean up temporary and junk files from SharePoint sites and OneDrive in managed tenants. The tool provides extensive coaching, double verification, and uses recycle bin deletion for safety.

## Problem Statement

SharePoint and OneDrive accumulate temporary files over time:
- Office temp files (`~$*`) left behind from editing sessions
- System temp files (`.TMP`, `.temp`)
- Zero-byte files (failed uploads, corrupted files)
- OS metadata files (`Thumbs.db`, `.DS_Store`, `desktop.ini`)
- Old backup files (`*.bak`, `*.old`)

MSPs need a safe, guided way to clean these up across client tenants.

## Solution

A 5-step wizard with hybrid scanning (real-time with background fallback) that:
1. Guides users through scope selection
2. Lets them configure file type filters
3. Scans recursively with progress feedback
4. Presents files for selection with bulk actions
5. Requires double confirmation before deletion

Files are moved to recycle bin (93-day recovery) rather than permanently deleted.

## Architecture

### Frontend Components

```
src/pages/teams-share/sharepoint/temp-file-cleanup.js

src/components/CippWizard/TempFileCleanup/
├── StepSelectScope.jsx       
├── StepConfigureFilters.jsx  
├── StepScanResults.jsx       
├── StepSelectFiles.jsx       
└── StepConfirmDelete.jsx     
```

### Backend Endpoints

```
CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Teams-Sharepoint/
├── Invoke-ExecTempFileScan.ps1      (scan endpoint)
├── Invoke-ExecTempFileCleanup.ps1   (delete endpoint)

CIPP-API/Modules/CIPPCore/Public/Entrypoints/Activity Triggers/
└── Push-ExecTempFileScan.ps1        (background scan)
```

### Permissions

- **CIPP Role:** `Sharepoint.Site.ReadWrite`
- **Graph API:** `Sites.ReadWrite.All` (already in SAMManifest)

## Wizard Flow

### Step 1: Select Scope

**Coaching:** "Let's find those temp files! First, choose where to look."

Options:
- Tenant selector (required)
- Scope radio buttons:
  - Specific SharePoint site (with site autocomplete)
  - Specific user's OneDrive (with user autocomplete)
  - All SharePoint sites (with large-scan warning)
  - All OneDrives (with large-scan warning)

### Step 2: Configure Filters

**Coaching:** "Select which file types to scan for. We recommend starting with the common ones."

Preset categories (checkboxes):
- ☑️ Office temp files (`~$*`)
- ☑️ Temporary files (`*.TMP`, `*.temp`)
- ☑️ Zero-byte files
- ☑️ System junk (`Thumbs.db`, `.DS_Store`, `desktop.ini`)
- ☐ Backup files (`*.bak`, `*.old`) - unchecked by default

### Step 3: Scan & Results

**Coaching:** "Scanning... This may take a moment for large sites."

Features:
- Progress indicator with file count
- 45-second timeout threshold
- Background fallback offer: "Continue scanning in background?"
- Results summary: file count and total size

### Step 4: Select Files

**Coaching:** "Review the files below. Uncheck any you want to keep."

Features:
- Table: Name, Path, Size, Type, Modified Date
- Bulk actions: Select All, Select None, Select by Type
- Search and filter
- Selected count and size

### Step 5: Confirm & Execute

**Coaching:** "Almost done! Please review carefully before confirming."

Features:
- Summary card (file count, size, affected sites)
- First confirmation: Checkbox "I understand these files will be moved to the recycle bin"
- Second confirmation: "Delete Selected Files" button (disabled until checkbox checked)
- Recovery note about 93-day retention

## File Type Patterns

| Category | Patterns | Description |
|----------|----------|-------------|
| Office temp | `~$*` | Word, Excel, PowerPoint temp files |
| Temp files | `*.TMP`, `*.temp` | System and app temp files |
| Zero-byte | (size = 0) | Empty files |
| System junk | `Thumbs.db`, `.DS_Store`, `desktop.ini` | OS metadata |
| Backup files | `*.bak`, `*.old` | May be intentional |

## Error Handling

### Scan Errors
- No permission: Skip site, continue with others
- Site not found: Skip, show in summary
- Timeout: Offer background mode
- Throttled: Auto-retry with backoff

### Delete Errors
- Already deleted: Skip, report in results
- File locked: Skip, offer retry
- Permission denied: Skip site's files
- Partial success: Show detailed results

### Recovery
- All messages include recycle bin recovery guidance
- Link to affected sites' recycle bins

## Menu Location

```
Teams & SharePoint
└── SharePoint
    ├── Sites List
    ├── Site Settings  
    ├── File Browser
    ├── Recycle Bin
    └── Temp File Cleanup  ← NEW
```

## Technical Details

### Scanning Algorithm

1. Use Graph API `/sites/{siteId}/drive/root/children` recursively
2. Filter by file extension and size client-side (Graph doesn't support complex filters)
3. Batch requests for efficiency (max 20 concurrent)
4. Track progress via file count

### Background Scanning

1. If scan exceeds 45 seconds, offer background mode
2. Store job in Azure Table Storage with status
3. Use Durable Functions orchestrator for large scans
4. Poll for completion or use webhook notification

### Deletion API

1. Use Graph API `DELETE /sites/{siteId}/drive/items/{itemId}`
2. This moves to recycle bin by default
3. Batch delete requests (max 20 concurrent)
4. Return success/failure for each file

## Success Criteria

- [ ] User can scan any scope (site, user, tenant-wide)
- [ ] Scan provides progress feedback
- [ ] Large scans don't timeout (background fallback works)
- [ ] User can select/deselect files before deletion
- [ ] Double confirmation prevents accidental deletion
- [ ] Files are recoverable from recycle bin
- [ ] Error messages are helpful and actionable
