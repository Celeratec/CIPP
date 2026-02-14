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

Manage365 inherits the full feature set of CIPP and extends it with additional capabilities focused on deeper Teams, SharePoint, OneDrive, and Dynamics 365 management, centralized cross-tenant access governance, external collaboration controls, and tenant-level SharePoint and Teams policy management -- areas where day-to-day administration often requires switching between multiple Microsoft portals.

For information about the upstream CIPP project, visit [cipp.app](https://cipp.app) and [docs.cipp.app](https://docs.cipp.app).

---

## Features from CIPP (Upstream)

Manage365 includes the complete CIPP feature set:

### Identity Management
- User administration (create, edit, delete, offboard)
- Risky users monitoring
- Group management with templates
- Device management (Entra ID devices with NinjaOne enrichment, cross-linked to Intune)
- Per-user device view with hardware details and NinjaOne agent status
- Role management and JIT Admin
- Reports: MFA, inactive users, sign-in logs, Entra Connect, risk detections

### Tenant Administration
- Multi-tenant management and configuration
- Alert configuration and audit logs
- Secure Score monitoring
- Application management and consent requests
- GDAP relationship management
- Standards alignment and drift detection
- Best Practice Analyser and Domains Analyser
- Conditional Access policy management, templates, and vacation mode
- Licence reporting

### Security & Compliance
- Incident and alert management (including MDO alerts)
- Defender status, deployment, and TVM vulnerabilities
- Device compliance reporting

### Endpoint Management
- Application management and deployment queue
- Managed device administration with NinjaOne hardware enrichment (CPU, RAM, agent status)
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
- Safe Links policies and templates
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
- **Member management** -- add and remove site members, add site administrators; works for both group-connected sites (via M365 Group membership) and non-group sites (Communication sites, classic Team sites) via the SharePoint REST API; Admin and Guest badges displayed inline
- **Guest invitation** -- invite external guest users directly from the site details page with a purpose-built dialog:
  - Guests are invited to the tenant and automatically added as site members in a single operation -- for group-connected sites via M365 Group, and for non-group sites via the SharePoint REST API (`ensureuser` + `associatedmembergroup`)
  - **Domain restriction diagnostics** -- if an invitation fails due to a domain collaboration restriction, the dialog runs a client-side root cause analysis against Entra External Collaboration settings and SharePoint Sharing settings, identifying the specific policy and domain list that is blocking the invitation
  - **Quick-fix** -- one-click "Allow domain & Retry" button that updates the B2B domain allow/block list and retries the invitation; if the restriction is Azure-managed, provides step-by-step instructions and a direct link to the Entra admin center
  - **Invite Another Guest** -- after a successful invitation, reset the form to invite additional guests in succession without closing the dialog
  - Send email invitation toggle is on by default; sync delay guidance shown after successful invitations
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

### Cross-Drive File Transfer

A guided wizard for moving or copying files between OneDrive accounts and SharePoint sites:

- **Transfer between any combination** -- OneDrive to SharePoint, OneDrive to OneDrive, or SharePoint to SharePoint
- **Visual file picker** -- browse and select files and folders from the source with checkbox selection
- **Destination folder browser** -- navigate into the target location and choose exactly where files should land
- **Move or Copy** -- choose to move files (removes the original) or copy them (keeps the original in place)
- **Bulk transfers** -- select multiple files and folders in a single operation

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

### NinjaOne Device Enrichment

When a NinjaOne integration is configured and device data has been synced, Manage365 automatically enriches device views across the application with hardware and agent data from NinjaOne. This works across all three device pages:

- **MEM Devices** (`/endpoint/MEM/devices`) -- Intune managed devices enriched with NinjaOne hardware
- **Identity Devices** (`/identity/administration/devices`) -- Entra ID device objects enriched with NinjaOne hardware
- **User Devices tab** (`/identity/administration/users/user/devices`) -- per-user device cards enriched with NinjaOne hardware

**Table enrichment:**
- Four additional columns appear when NinjaOne data is available: CPU, RAM (GB), Agent Status (Online/Offline), and Last NinjaOne Contact
- Columns are conditionally shown -- when NinjaOne is not configured, the tables work exactly as before

**Card enrichment:**
- Compliance/status color-coded left borders on all device cards (green = compliant, red = non-compliant/disabled, orange = grace period, blue = enabled)
- NinjaOne Online/Offline badge chip on each device card
- Ownership type badges (Corporate/Personal) on MEM device cards
- Trust type badges (Azure AD Joined / Domain Joined / Workplace) on Identity device cards
- NinjaOne hardware panel on each card showing CPU (with core count), RAM, OS, domain, and last contact time

**Offcanvas detail views:**
- Rich offcanvas panels on MEM Devices and Identity Devices pages with structured sections: hero header, status badges, device info, NinjaOne hardware (CPU, RAM, OS, architecture, last boot, domain, last contact, device class), user/enrollment, and timeline
- NinjaOne hardware section only appears for devices with NinjaOne data

**Cross-linking between device views:**
- MEM Devices page includes "View in Entra" action linking to the Entra device details
- Identity Devices page includes "View in Intune" action linking to the Intune device details
- User Devices tab includes "View in Intune" icon on managed device cards
- All pages retain their existing "View in Entra" / "View in Intune" external links

**Graceful degradation:** If NinjaOne is not configured, returns no cached data, or the API call fails, all pages work exactly as before with no NinjaOne UI elements visible.

### SharePoint Sharing Settings

A dedicated tenant-level settings page for managing SharePoint and OneDrive external sharing policies, accessible from **Teams & SharePoint > SharePoint > Sharing Settings**:

- **External Sharing Level** -- set the top-level sharing capability (internal only, existing guests, new and existing guests, anyone with anonymous links); site-level sharing cannot exceed this tenant setting
- **Sharing Domain Restrictions** -- configure an allow list or block list of domains that can receive SharePoint/OneDrive sharing invitations; domain management with inline add/remove chip interface
- **External User Behavior** -- toggle whether external users can reshare content they received
- **Default Sharing Link Settings** -- configure the default link type (specific people, organization members, anyone), default permission (view/edit), and anonymous link controls including file/folder permissions and expiration days

| Endpoint | Purpose |
|---|---|
| `ListSharepointSettings` | Get tenant-level SharePoint settings via Graph API (existing, now surfaced in UI) |
| `EditSharepointSettings` | Update tenant-level SharePoint sharing settings |

### Teams Tenant Settings

A comprehensive tenant-level policy management page for Microsoft Teams, accessible from **Teams & SharePoint > Teams > Teams Settings**. Organized into four tabs:

- **Federation & External Access** -- configure federation mode (allow all, block all, allow/block specific domains) with inline domain list management; toggle Teams consumer and unmanaged account communication; control external access policy settings
- **Guest & Cloud Storage** -- toggle guest user access to Teams; enable or disable third-party cloud storage providers (Google Drive, ShareFile, Box, Dropbox, Egnyte)
- **Meeting Policy** -- control anonymous user join/start, lobby bypass rules, PSTN bypass, presenter roles, meeting chat, and external participant control sharing
- **Messaging Policy** -- configure message editing/deletion, chat deletion, read receipts, custom emoji creation/deletion, and security/compliance end-user reporting

Each tab tracks changes independently with visual "modified" indicators and section-specific save buttons.

| Endpoint | Purpose |
|---|---|
| `ListTeamsSettings` | Get all tenant-level Teams policies (federation, external access, client config, meeting, messaging) |
| `EditTeamsSettings` | Update Teams tenant policies by section (federation, client, meeting, messaging) |

### Cross-Tenant Access & External Collaboration Management

Centralized governance of Microsoft Entra cross-tenant access policies, B2B collaboration settings, and external identity controls -- settings that are otherwise only manageable directly in the Entra portal and difficult to standardize across clients.

**Overview Dashboard** (`/tenant/administration/cross-tenant-access/`)
- Health score (0-100) with severity breakdown (Critical / Warning / Info)
- Policy summary showing B2B Collaboration, Direct Connect, and Inbound Trust status at a glance
- Quick navigation to all cross-tenant management areas

**Default Policy Editor** (`/tenant/administration/cross-tenant-access/policy`)
- Tabbed interface for editing all cross-tenant access policy defaults:
  - **B2B Collaboration** -- inbound and outbound user/application access (allow/block)
  - **B2B Direct Connect** -- inbound and outbound access for Teams shared channels
  - **Inbound Trust** -- trust external MFA, compliant devices, hybrid AD joined devices
  - **Tenant Restrictions v2** -- control which external tenants users can access
  - **Automatic User Consent** -- auto-redeem inbound and outbound invitations

**Partner Organizations** (`/tenant/administration/cross-tenant-access/partners/`)
- List all partner-specific cross-tenant configurations with status chips
- Add new partner organizations with per-partner overrides for B2B Collaboration, Direct Connect, Inbound Trust, and Automatic Consent
- Edit and delete existing partner configurations
- Reverse tenant name lookup for partner identification

**External Collaboration Settings** (`/tenant/administration/cross-tenant-access/external-collaboration`)
- **Guest invite restrictions** -- control who can invite guests (no one, admins only, members, everyone)
- **Guest user access level** -- same as members, limited (default), or restricted (blocks directory enumeration)
- **Domain allow/deny lists** -- manage which domains can or cannot be invited for B2B collaboration, with inline domain chip management
- **Additional controls** -- email-based subscriptions, email-verified user join, block MSN/personal account sign-in

**Configuration Health & Conflict Detection** (`/tenant/administration/cross-tenant-access/health`)
- Automated analysis of cross-tenant configuration detecting:
  - Overly permissive B2B Collaboration or Direct Connect defaults
  - Missing inbound trust configuration
  - Unconfigured Tenant Restrictions v2
  - Permissive or completely disabled guest invitation policies
  - Guest users with member-level access
  - Partner configuration conflicts (partner overrides that contradict defaults)
  - SharePoint sharing domain restrictions (allow/block lists) that may independently block external access
  - SharePoint external sharing completely disabled
- Health score with visual breakdown and categorized findings with specific recommendations
- Each finding includes a direct "Go to settings" link navigating to the exact page where the issue can be resolved

**Security Baseline Templates** (`/tenant/administration/cross-tenant-access/templates/`)
- Create reusable security baseline templates capturing the full cross-tenant and external collaboration configuration
- Templates include: B2B Collaboration defaults, Direct Connect defaults, Inbound Trust, Tenant Restrictions, Automatic Consent, Guest Invite policy, Guest User Role, domain restrictions, and additional external user settings
- Apply templates to any tenant in a single operation (updates cross-tenant access policy, authorization policy, and domain restrictions)
- Edit and delete templates; track authorship and update timestamps

**Standards Integration** (9 new standards under "Entra (AAD) Standards")

Cross-tenant settings are also available as individual standards in the existing Standards framework, enabling drift detection, automated remediation, alerting, and BPA integration:

| Standard | What it controls |
|---|---|
| `B2BCollaborationInbound` | Default inbound B2B collaboration access (allow/block) |
| `B2BCollaborationOutbound` | Default outbound B2B collaboration access (allow/block) |
| `B2BDirectConnectInbound` | Default inbound B2B Direct Connect access (allow/block) |
| `B2BDirectConnectOutbound` | Default outbound B2B Direct Connect access (allow/block) |
| `CrossTenantTrustCompliant` | Trust compliant devices from external tenants |
| `CrossTenantTrustHybridJoin` | Trust hybrid Azure AD joined devices from external tenants |
| `GuestUserRole` | Guest user access level (member / limited / restricted) |
| `BlockMSNSignIn` | Block personal Microsoft account sign-in |
| `AutomaticUserConsent` | Automatic invitation redemption (inbound + outbound) |

These join the existing `ExternalMFATrusted`, `GuestInvite`, and `DisableGuestDirectory` standards for 12 total standards covering the full cross-tenant and external collaboration surface area.

### Cross-Service Context Clues & Navigation

External access in Microsoft 365 is controlled by multiple independent settings layers (Cross-Tenant Access Policy, Entra External Collaboration, SharePoint Sharing, Teams Federation) -- any one of which can block access. Manage365 adds contextual banners and cross-links throughout these settings pages so administrators can quickly identify which layer is causing an issue:

- **Cross-Tenant Default Policy** -- banner explaining that B2B settings are only one layer, with direct links to External Collaboration, SharePoint Sharing Settings, and Teams Settings
- **External Collaboration** -- banner in the domain restrictions section warning that SharePoint has a separate domain list, with link to SharePoint Sharing Settings
- **SharePoint Sharing Settings** -- banners in the sharing level and domain restrictions cards explaining the relationship with Entra domain lists and Cross-Tenant Access Policy
- **Teams Settings** -- banners on the Federation tab (explaining the difference between federation and B2B collaboration) and Guest Access tab (explaining that Entra, Cross-Tenant, and SharePoint must all align)
- **Health Report** -- every finding includes a "Go to settings" button linking directly to the page where the issue can be resolved

### Risk Coaching & Settings Safety

Manage365 includes an inline risk coaching system that alerts administrators to potentially dangerous settings as they make changes, recommends safer alternatives, and requires explicit confirmation before saving high-risk configurations. This is implemented via two reusable components (`CippRiskAlert` for inline warnings and `CippRiskSummaryDialog` for save-time confirmation) used consistently across the application.

**Settings pages with inline risk coaching (30+ risk rules):**

- **External Collaboration** -- 5 rules: unrestricted guest invitations (error), guests with member-level access (error), self-service join (warning), no domain restrictions (warning), personal accounts allowed (info)
- **Cross-Tenant Default Policy** -- 4 rules: automatic consent inbound/outbound (warning), all trust claims accepted (info), all access policies open (info)
- **SharePoint Sharing Settings** -- 8 rules: anonymous sharing enabled (error), default link is anonymous (error), anonymous links grant edit (error), anonymous links never expire (error), no domain restrictions (warning), external resharing (warning), default edit permission (warning)
- **Teams Tenant Settings** -- 13 rules across all tabs: anonymous meeting start (error), everyone bypasses lobby (error), open federation (warning), consumer/unmanaged accounts (warning), PSTN lobby bypass (warning), external control sharing (warning), presenter defaults (warning), third-party storage (warning), security reporting disabled (warning), message deletion/compliance (info)
- **Cross-Tenant Partner Configuration** -- 4 rules: automatic consent (warning), all trust accepted (info), all access open (info)
- **Cross-Tenant Security Templates** -- 8 rules: same as external collaboration + cross-tenant, with emphasis that risky templates get replicated at scale across all tenants

**Action pages with destructive-operation coaching:**

- **Offboarding Wizard** -- 5 inline alerts for the most dangerous offboarding options: delete user (error -- permanent deletion), clear Immutable ID (error -- breaks hybrid sync), remove licenses (warning -- immediate service loss), remove MFA devices (warning -- security gap), remove all groups (warning -- resource access loss)
- **Transport Rule Creation** -- 3 action-based alerts: delete message (error -- silent permanent loss), redirect message (warning -- original recipient never receives), reject message (warning -- legitimate email may be blocked)
- **Alert Configuration** -- 2 alerts for automated actions: disable user (warning -- false positives lock out users), BEC remediate (warning -- false positives disrupt users with password resets)
- **Team Details Settings** -- risk metadata for 8 settings: channel deletion by members/guests (high), app management (medium), connector management (medium), guest channel management (medium), message deletion (medium), owner message deletion (medium), message editing (medium)

**UX behavior:**
- Risk alerts animate in/out inline next to each control as values change (using MUI `Collapse`)
- When saving, if any error or warning-level risks are active, a confirmation dialog lists all risks grouped by severity -- the user must click "Save Anyway" to proceed
- Info-level alerts are shown inline for awareness but do not block saves
- Each alert includes a specific recommendation for the safer alternative

### Additional Enhancements

- **Background site deletion** -- SharePoint site deletion is offloaded to prevent UI timeouts on large sites, with polling for completion status and toast notifications
- **Data freshness indicators** -- SharePoint and OneDrive list pages display the Microsoft report refresh date
- **Client-side navigation** -- internal links use Next.js router for seamless navigation (no full page reloads or toolbar flashing)
- **Consistent action icons** -- standardized quick-action buttons on Teams and SharePoint site cards
- **Table data filtering** -- `CippTablePage` supports an `apiDataFilter` prop for client-side data transformation, enabling enrichment patterns like the NinjaOne device merge

### Custom Backend Endpoints

The following API endpoints were created to support Manage365-specific features:

| Endpoint | Purpose |
|---|---|
| `ExecSharePointInviteGuest` | Invite an external guest to the tenant and add them to a SharePoint site -- via M365 Group for group-connected sites, via SharePoint REST API (`ensureuser` + `associatedmembergroup`) for non-group sites; includes domain restriction diagnostics on failure |
| `ExecSetSharePointMember` | Add or remove site members -- via M365 Group for group-connected sites, via SharePoint REST API for non-group sites (Communication, classic Team) |
| `ExecTeamFromGroup` | Team-enable an existing M365 Group from a SharePoint site |
| `ExecTeamSettings` | Update individual team settings (member, guest, messaging, fun) |
| `ExecTeamAction` | Archive, unarchive, clone teams; create/delete channels; list/add/remove channel members; remove apps |
| `ExecTeamMember` | Add/remove team members and owners; change roles |
| `ExecOneDriveFileAction` | OneDrive file operations (download, rename, move, copy, delete, create folder) and cross-drive transfers between OneDrive and SharePoint |
| `ListDynamicsEnvironments` | List Power Platform / Dynamics 365 environments via BAP Admin API |
| `ListDynamicsUsers` | List Dataverse system users with security role expansion |
| `ListDynamicsSecurityRoles` | List Dynamics 365 security roles with business unit details |
| `ListDynamicsBusinessUnits` | List Dynamics 365 business unit hierarchy |
| `ListDynamicsSolutions` | List installed Dataverse solutions with publisher info |
| `ListNinjaDeviceInfo` | Read NinjaOne parsed device cache and return enrichment fields (CPU, RAM, OS, agent status) keyed by Azure AD device ID |
| `ListCrossTenantPolicy` | Get default cross-tenant access policy (B2B Collab, Direct Connect, Inbound Trust, Tenant Restrictions) |
| `EditCrossTenantPolicy` | Update default cross-tenant access policy settings |
| `ListCrossTenantPartners` | List partner-specific cross-tenant access configurations with tenant name lookup |
| `ExecAddCrossTenantPartner` | Add a new partner cross-tenant access configuration |
| `EditCrossTenantPartner` | Update an existing partner configuration |
| `ExecRemoveCrossTenantPartner` | Remove a partner cross-tenant access configuration |
| `ListExternalCollaboration` | Get authorization policy, guest settings, and B2B domain allow/deny lists |
| `EditExternalCollaboration` | Update guest invite, guest role, and domain restriction settings; creates B2B Management Policy if none exists |
| `ListCrossTenantHealth` | Aggregated health analysis with conflict detection, SharePoint sharing checks, and security scoring |
| `ListCrossTenantTemplates` | List saved cross-tenant security baseline templates |
| `ExecAddCrossTenantTemplate` | Create or update a security baseline template |
| `ExecRemoveCrossTenantTemplate` | Delete a security baseline template |
| `ExecApplyCrossTenantTemplate` | Apply a template to a tenant (cross-tenant policy + authorization policy + domain restrictions) |
| `EditSharepointSettings` | Update tenant-level SharePoint sharing settings (sharing capability, domain restrictions, link defaults) |
| `ListTeamsSettings` | Get all tenant-level Teams policies (federation, external access, client config, meeting, messaging) |
| `EditTeamsSettings` | Update Teams tenant policies by section (federation, client, meeting, messaging) |

---

## Technology Stack

- **Frontend:** React / Next.js with Material-UI (MUI v7)
- **Backend:** PowerShell Azure Functions
- **API:** Microsoft Graph API (including Cross-Tenant Access Policy, Authorization Policy, and SharePoint Admin Settings endpoints), SharePoint Admin API, SharePoint REST API (`_api/web` for site-level user and group management), Teams PowerShell cmdlets (via `New-TeamsRequest`), Power Platform BAP API, Dataverse Web API, NinjaOne API (via CIPP extension)
- **Hosting:** Azure Static Web Apps + Azure Functions
- **Data:** React Query for caching and state management

---

## Acknowledgments

Manage365 is built on the [CIPP](https://cipp.app) open-source project created by [Kelvin Tegelaar](https://github.com/KelvinTegelaar) and the CIPP community. We are grateful for their foundational work that makes this project possible.