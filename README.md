<p align="center">
  <img src="public/Main%20logo%20-CMYK.png" alt="Manage365 Logo" height="80">
</p>

<h1 align="center">Manage365</h1>

<p align="center">
  An enhanced Microsoft 365 multi-tenant management portal based on the <a href="https://cipp.app">CIPP</a> open-source project.
</p>

---

> **Last updated:** February 2026
>
> Manage365 is built on top of the [CyberDrain Improved Partner Portal (CIPP)](https://cipp.app). CIPP is actively developed and may implement similar features over time. This document reflects the state of both projects as of the date above.

## What is Manage365?

Manage365 is a Microsoft 365 multi-tenant administration portal designed for Microsoft Partners and IT administrators. It provides a centralized interface for managing users, teams, SharePoint, Exchange, security, compliance, Intune, Dynamics 365, and more across all of your Microsoft 365 tenants.

Manage365 inherits the full feature set of CIPP and extends it with additional capabilities focused on deeper Teams, SharePoint, OneDrive, and Dynamics 365 management -- areas where day-to-day administration often requires switching between multiple Microsoft portals.

For information about the upstream CIPP project, visit [cipp.app](https://cipp.app) and [docs.cipp.app](https://docs.cipp.app).

---

## Features from CIPP (Upstream)

Manage365 includes the complete CIPP feature set:

### Identity Management
- User administration (create, edit, delete, offboard)
- Risky users monitoring
- Group management with templates
- Device management
- Role management and JIT Admin
- Reports: MFA, inactive users, sign-in logs, Azure AD Connect, risk detections

### Tenant Administration
- Multi-tenant management and configuration
- Alert configuration and audit logs
- Secure Score monitoring
- Application management and consent requests
- GDAP relationship management
- Standards alignment and drift detection
- Best Practice Analyser and Domains Analyser
- Conditional Access policy management, templates, and vacation mode
- Licence reporting (including Sherweb CSP)

### Security & Compliance
- Incident and alert management (including MDO alerts)
- Defender status, deployment, and TVM vulnerabilities
- Device compliance reporting
- Safe Links policies and templates

### Intune / Endpoint Management
- Application management and deployment queue
- Autopilot device management, profiles, and status pages
- Configuration and compliance policies with templates
- App protection policies and assignment filters
- Script management
- Reports: device score analytics, work from anywhere, autopilot deployments, discovered apps

### Email & Exchange
- Mailbox administration (active, deleted, rules, permissions)
- Contact management with templates
- Quarantine and restricted user management
- Tenant Allow/Block Lists
- Retention policies and tags
- Transport rules and connectors with templates
- Spam filter and connection filter management
- Resource management (rooms, equipment, room lists)
- Reports: mailbox statistics, activity, CAS settings, permissions, calendar permissions, anti-phishing, malware filters, safe attachments, GAL

### Tools
- Graph Explorer
- Application approval workflow
- Tenant and IP lookup
- Domain health checks
- Message trace, mailbox restores, message viewer
- Dark web breach lookups (tenant and individual)
- Template library and community repositories
- Task scheduler

### Settings & Administration
- Application settings and integrations
- Setup wizard and onboarding
- Logbook and diagnostics
- Custom data / directory extensions
- Super admin tools (tenant mode, exchange cmdlets, timers, table maintenance)

---

## Features Unique to Manage365

The following capabilities have been developed specifically for Manage365 and are not available in upstream CIPP as of the date shown above.

### SharePoint Site Details Page

An interactive detail page for individual SharePoint sites, providing at-a-glance site health and hands-on management:

- **Site overview** with hero banner showing site type, status badges (inactive, storage critical), and quick-action chips
- **Storage monitoring** with visual progress bar, percentage, and color-coded status (green/yellow/red)
- **Member management** -- add and remove site members, add site administrators, with Admin badges displayed inline
- **Data freshness** -- shows the Microsoft report refresh date so administrators know how current the numbers are
- **Usage data enrichment** -- automatically fetches site usage data from the API, so the page is fully populated regardless of navigation path
- **Create Team from Site** -- for group-connected sites, one-click team creation from the existing Microsoft 365 Group
- **Cross-linking** -- direct navigation chip to the associated Teams detail page (if team-enabled), plus external "Open in SharePoint" link

### Teams Detail Page

A comprehensive management interface for individual Microsoft Teams, consolidating information and actions that normally require the Teams Admin Center:

- **Team overview** with visibility status, archive state, and quick stats (owners, members, channels, apps)
- **Member and owner management** -- add members/owners via user picker, remove members, promote to owner, demote to member
- **Channel management** -- create new channels (standard, private, shared) with owner selection for private/shared channels; delete channels with data loss warnings
- **Channel member management** -- expand private and shared channels inline to view their members; add members with role selection (member/owner); remove members directly from the channel member list
- **App management** -- view all installed apps with version info; remove apps with impact warnings
- **Interactive settings** -- toggle team settings directly from the page using chip buttons (not read-only display):
  - Member permissions (create channels, delete channels, add apps, manage tabs, manage connectors)
  - Guest permissions (create/delete channels)
  - Messaging settings (edit/delete messages, team/channel mentions)
  - Fun settings (Giphy with rating dropdown, stickers, custom memes)
- **Risk-aware confirmations** -- high-risk settings (e.g., allowing channel deletion) trigger a warning dialog explaining the security implications before the change is applied
- **Cross-linking** -- direct navigation chip to the associated SharePoint site detail page, plus "Open in Teams" deep link
- **Refresh** -- all data tables support refresh to re-fetch live data from the API

### OneDrive File Browser

A full-featured file browser for managing OneDrive contents without leaving the portal:

- **User picker** -- select any user's OneDrive directly from the page
- **Folder navigation** -- traverse into folders and subfolders with breadcrumb navigation
- **File operations**:
  - Download files
  - Rename files and folders
  - Move files/folders between locations
  - Copy files/folders
  - Delete files/folders (moves to recycle bin)
  - Create new folders
- **File type icons** -- visual indicators for different file types and directories
- **Open in browser** -- launch files directly in their web application

### SharePoint Recycle Bin

A management interface for deleted SharePoint sites, enabling recovery and cleanup:

- **Deleted site listing** with card and table view support
- **Restore** deleted sites with one click
- **Permanently delete** sites with appropriate warnings about irreversibility
- **Retention tracking** -- shows days remaining before auto-purge (93-day retention)
- **Visual expiration warnings** -- color-coded indicators for sites nearing expiration (< 7 days, < 30 days)
- **Filtering** by expiration status

### Enhanced Error Messages

Improved error and result message display throughout the application:

- **Structured formatting** -- error messages like "Failed to Add member in team 'Accounting'. Error: ..." are split into a bold action summary and readable error details
- **Entity highlighting** -- quoted names and identifiers are automatically bolded for quick scanning
- **Word-break handling** -- long error strings wrap properly instead of overflowing
- **Results management** -- expandable details, CSV export, and table view for bulk operation results

### Card Views

CIPP uses table-only views for listing data. Manage365 adds card view alternatives across many pages, providing a more visual way to browse and manage resources:

- **Teams list** -- cards showing team name, visibility, member/channel counts with quick-action buttons
- **SharePoint sites list** -- cards with storage usage bars, file counts, activity status, and quick actions
- **OneDrive accounts** -- cards with storage indicators and user details
- **SharePoint Recycle Bin** -- cards with retention countdown and expiration warnings
- Standardized card widths with text truncation and tooltips for consistency across all card views

### Dynamics 365 Management

Read-only visibility into Microsoft Dynamics 365 / Dataverse environments, providing insight without needing the Power Platform Admin Center:

- **Environment listing** -- view all Power Platform environments (production, sandbox, trial) with type, region, version, state, and capacity details via the BAP Admin API
- **User management** -- list all Dataverse system users with access mode, business unit, and security role assignments displayed inline
- **Security roles** -- browse all security roles with managed/custom classification, business unit association, and inherited status
- **Business units** -- view the organizational hierarchy of business units with parent relationships, contact details, and location
- **Solutions** -- list all installed Dataverse solutions with version, publisher, managed/unmanaged classification, and install date
- **Environment context** -- admin pages (users, roles, business units, solutions) support environment selection; navigate from the environments list or pick one inline
- **Off-canvas details** -- each entity type has a rich detail panel with structured metadata, status badges, and related information

### Additional Enhancements

- **Background site deletion** -- SharePoint site deletion is offloaded to prevent UI timeouts on large sites, with polling for completion status and toast notifications
- **Data freshness indicators** -- SharePoint and OneDrive list pages display the Microsoft report refresh date
- **Client-side navigation** -- internal links use Next.js router for seamless navigation (no full page reloads or toolbar flashing)
- **Consistent action icons** -- standardized quick-action buttons on Teams and SharePoint site cards

### Custom Backend Endpoints

The following API endpoints were created to support Manage365-specific features:

| Endpoint | Purpose |
|---|---|
| `ExecTeamFromGroup` | Team-enable an existing M365 Group from a SharePoint site |
| `ExecTeamSettings` | Update individual team settings (member, guest, messaging, fun) |
| `ExecTeamAction` | Archive, unarchive, clone teams; create/delete channels; list/add/remove channel members; remove apps |
| `ExecTeamMember` | Add/remove team members and owners; change roles |
| `ExecOneDriveFileAction` | OneDrive file operations (download, rename, move, copy, delete, create folder) |
| `ListDynamicsEnvironments` | List Power Platform / Dynamics 365 environments via BAP Admin API |
| `ListDynamicsUsers` | List Dataverse system users with security role expansion |
| `ListDynamicsSecurityRoles` | List Dynamics 365 security roles with business unit details |
| `ListDynamicsBusinessUnits` | List Dynamics 365 business unit hierarchy |
| `ListDynamicsSolutions` | List installed Dataverse solutions with publisher info |

---

## Technology Stack

- **Frontend:** React / Next.js with Material-UI (MUI v7)
- **Backend:** PowerShell Azure Functions
- **API:** Microsoft Graph API, SharePoint Admin API, Power Platform BAP API, Dataverse Web API
- **Hosting:** Azure Static Web Apps + Azure Functions
- **Data:** React Query for caching and state management

---## AcknowledgmentsManage365 is built on the [CIPP](https://cipp.app) open-source project created by [Kelvin Tegelaar](https://github.com/KelvinTegelaar) and the CIPP community. We are grateful for their foundational work that makes this project possible.
