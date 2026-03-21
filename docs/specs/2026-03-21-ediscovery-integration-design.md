# eDiscovery Integration -- Phase 1 Design Spec

## Overview

Add eDiscovery case management to CIPP, enabling MSPs to place legal holds, run content searches, and export results for client tenants directly from the CIPP interface. Phase 1 covers the core lawsuit workflow using Microsoft Graph eDiscovery API Standard-tier features (works for both E3 and E5 tenants).

## Architecture

- **API**: Microsoft Graph eDiscovery (`/v1.0/security/cases/ediscoveryCases`)
- **Auth**: App-only via SAM (`-AsApp $true`) with `eDiscovery.Read.All` and `eDiscovery.ReadWrite.All` application permissions
- **Tier support**: Standard API (E3) and Premium API (E5) -- Phase 1 uses Standard-tier features
- **Async pattern**: Long-running operations (search estimates, exports) return HTTP 202; frontend polls via React Query `refetchInterval`

## Backend (CIPP-API)

### SAM Manifest

Add two application permissions to `SAMManifest.json` under Microsoft Graph (`00000003-0000-0000-c000-000000000000`):

- `eDiscovery.Read.All` -- `50180013-6191-4d1e-a373-e590ff4e66af` (Role)
- `eDiscovery.ReadWrite.All` -- `acb8f680-0834-4146-b69e-4ab1571b4e03` (Role)

### Endpoints

All files under `Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Security/`:

| Endpoint | Method | Graph Operation |
|----------|--------|-----------------|
| `ListEdiscoveryCases` | GET | List all cases |
| `ExecEdiscoveryCase` | POST | Create/update/close/reopen/delete case |
| `ListEdiscoveryCaseHolds` | GET | List holds in case |
| `ExecEdiscoveryCaseHold` | POST | Create/update/remove hold |
| `ListEdiscoveryCaseSearches` | GET | List searches in case |
| `ExecEdiscoveryCaseSearch` | POST | Create/update/delete/run search |
| `ExecEdiscoveryCaseExport` | POST | Initiate export |
| `ListEdiscoveryCaseOperations` | GET | Check operation status |

All use `.ROLE Security.Ediscovery.ReadWrite` and `-AsApp $true`.

### Graph API Routes

- Cases: `https://graph.microsoft.com/v1.0/security/cases/ediscoveryCases`
- Holds: `.../ediscoveryCases/{caseId}/legalHolds`
- Searches: `.../ediscoveryCases/{caseId}/searches`
- Search estimate: `.../searches/{searchId}/estimateStatistics`
- Search export: `.../searches/{searchId}/exportResult`
- Operations: `.../ediscoveryCases/{caseId}/operations`

## Frontend (CIPP)

### Navigation

Under "Security & Compliance" in `config.js`:

```
eDiscovery
  └── Cases   /security/ediscovery/cases
```

Permission: `Security.Ediscovery.ReadWrite`

### Pages

- **Cases list** (`src/pages/security/ediscovery/cases/index.js`) -- `CippTablePage` with create/close/delete actions
- **Case detail** (`src/pages/security/ediscovery/cases/case/index.js`) -- `HeaderedTabbedLayout` with Overview, Legal Holds, Searches, Exports tabs
- **Legal Holds tab** (`case/holds.js`) -- holds table with create hold form (content sources, KQL query)
- **Searches tab** (`case/searches.js`) -- searches table with create/run/estimate, status polling
- **Exports tab** (`case/exports.js`) -- exports table with status polling, download links

### Async Polling

- POST triggers long-running operation, returns `{ status: "running" }`
- List queries use `refetchInterval: 5000` while any item status is running
- Polling stops when status resolves to completed or failed

### Error Guidance

- **403 / Authorization_RequestDenied**: CPV refresh + eDiscovery Administrator role assignment guidance
- **License not available**: M365 E3/E5 license required
- **400 / KQL syntax**: Check search query syntax
- **404**: Resource not found, may have been deleted

## Key Constraint

The CIPP service principal needs the **eDiscovery Administrator** role in each client tenant's Purview portal. This cannot be automated via Graph API and must be surfaced clearly in permission error guidance.

## Phase 2 (future)

- Custodian management
- Review sets
- E3/E5 tier auto-detection with feature gating
- Advanced export options
- Guided KQL query builder
