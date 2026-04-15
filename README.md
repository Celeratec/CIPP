<p align="center">
  <img src="public/Main%20logo%20-CMYK.png" alt="Manage365 Logo" height="80">
</p>

<h1 align="center">Manage365</h1>

<p align="center">
  An enhanced Microsoft 365 multi-tenant management portal based on the <a href="https://cipp.app">CIPP</a> open-source project.
</p>

---

> **Last synced with upstream:** April 2026 (CIPP v10.3.1 / CIPP-API v10.3.x)
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
- User administration (create, edit, delete, offboard with orchestrator-based batch processing and scheduler-routed task tracking)
- User form validation with field-level constraints (max length, required, pattern)
- Vacation mode wizard with mailbox permissions, calendar delegation, and out-of-office scheduling
- Offboarding wizard with dialog mode, table view for all tenant offboarding tasks, scheduler integration for proper task tracking and alerting, and custom tests
- Bulk guest invitation
- Risky users monitoring
- Group management with templates, group detail page, and deploy group template button
- Device management (Entra ID devices with NinjaOne enrichment, cross-linked to Intune)
- Per-user device view with hardware details and NinjaOne agent status
- Role management and JIT Admin
- Reports: MFA (with role-targeted CA policy detection), inactive users, sign-in logs, Entra Connect, risk detections, BEC remediation

### Tenant Administration
- Multi-tenant management and configuration
- Upgraded tenant onboarding experience with type selection
- Alert configuration and audit logs (group membership change, Defender severity filtering, inactive users)
- Alert snooze dialog and snoozed alerts management
- Secure Score monitoring
- Application management, consent requests, and app management policies
- App registration and enterprise app detail pages with permissions viewer
- GDAP relationship management with GDAP trace
- Tenant group management with usage reporting
- Standards alignment and drift detection (including device registration local admin controls)
- New standard: Restrict User Device Registration
- Standards dialog with enabled/disabled status filter and severity color mapping
- Best Practice Analyser and Domains Analyser (with DKIM selector rotation)
- Conditional Access policy management, templates, and vacation mode with authentication flow selection
- Licence reporting and management with granular control and dynamic license backfill
- BitLocker recovery key search and caching
- Feature flags
- Reusable settings standards with templates
- Configuration backup with restore wizard (type-filtered restoration with row count reporting)
- Incident report and attachment options
- Log retention settings
- Dashboard v2: report toolbar, custom dashboards, responsive layout
- Report builder with templates and generated reports
- Executive report with menuItem variant support

### Security & Compliance
- Incident and alert management (including MDO alerts)
- Defender status, deployment, and TVM vulnerabilities
- Defender alerts with severity filtering
- Device compliance reporting
- Customer Lockbox
- eDiscovery case management with legal holds, content searches, and exports (see Manage365 features below)

### Endpoint Management
- Application management and deployment queue (including Win32/custom apps)
- Application assignment filter options
- Managed device administration with NinjaOne hardware enrichment (CPU, RAM, agent status)
- Device detail page
- DEP sync
- Autopilot device management, profiles, and status pages
- Configuration and compliance policies with templates
- Intune reusable settings deployment and templates with assignment verification
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
- SendFromAlias standard (enable/disable)
- Resource management (rooms, equipment, room lists)
- Message trace, mailbox restores, message viewer
- Reports: mailbox statistics, activity, CAS settings, permissions, calendar permissions, mailbox forwarding, anti-phishing, malware filters, safe attachments, GAL
- Queue tracking for report generation

### Tools
- Graph Explorer with simple filter UI
- Universal Search v2 with user and group search
- Application approval workflow
- Tenant and IP lookup
- Domain health checks
- Dark web breach lookups (tenant and individual)
- Template library and community repositories
- Task scheduler with label-based action filtering
- Guest account disable support with sign-in audit fallback
- Script editor improvements
- Super admin pages relocated to /cipp/advanced/super-admin/

### Settings & Administration
- Application settings and integrations (including PWPush with CloudFlare Tunnel and default passphrase support)
- SIEM settings with SAS token generation for log table access
- SAM service principal lock configuration
- Setup wizard and onboarding
- Enhanced bookmark management with sidebar, drag-and-drop reordering, lock, and sort options
- Compact navigation mode for denser sidebar layout
- Logbook with severity color mapping
- Custom data / directory extensions
- Super admin tools (tenant mode, exchange cmdlets, timers, table maintenance)

---

## Features Unique to Manage365

The following capabilities have been developed specifically for Manage365 and are not available in upstream CIPP as of the date shown above.

### Visual Card Views & Modern UI

CIPP uses table-only views for listing data. Manage365 adds card view alternatives across every major list page -- Users, Groups, Teams, Mailboxes, Contacts, Devices, Applications, SharePoint Sites, OneDrive, and more. Cards surface key status badges, metadata, and up to 8 quick-action buttons directly on each item, so common tasks are one click away without opening a detail page. Standardized card widths, meaningful icons (OS-aware device icons, entity-type icons), and consistent badge design provide a polished, scannable interface. Card view loading is optimized to only show skeletons during initial data fetch; background refetches do not blank already-loaded cards.

### Mobile-Responsive Design

Comprehensive mobile responsiveness throughout the application: responsive data tables that adapt to screen size, mobile-friendly toolbars with compact controls, sticky wizard step buttons, a mobile tenant selector in the top navigation, and card views optimized for touch. The entire interface is usable on tablets and phones without horizontal scrolling.

### Enhanced Detail Pages

Manage365 extends upstream's detail pages with significantly richer, purpose-built interfaces for key entities:

- **SharePoint Sites** -- storage monitoring, member and administrator management (including non-group-connected sites), guest invitation with domain restriction diagnostics and one-click quick-fix, cross-linking to Teams, Create Team from Site, and direct file browser access
- **Teams** -- member/owner management, channel management (including private/shared channel members with per-channel file browsing), app management, interactive toggle-chip settings for member permissions, guest permissions, messaging, and fun settings, plus guest invitation with Teams-specific diagnostics and direct file browser access at both team and channel level
- **Groups** -- hero overview by group type, member/owner/contact management, editable properties, interactive toggle-chip settings, dynamic membership rule display, on-premises sync awareness, and add member to multiple groups at once from the groups list page (extends upstream's group page)
- **Mailboxes / User Exchange Tab** -- mailbox type identification, aliases, archive status, direct link to Exchange settings, clickable external mail restriction tiles (independently block/allow inbound or outbound external email with confirmation dialogs and consequence warnings), one-click spam block clearing when a mailbox has been flagged by Microsoft for suspected spam activity, and **interactive hold management** -- toggle Litigation Hold and Retention Hold on/off directly from the Exchange info card with confirmation dialogs, data loss warnings, and optional duration (days) for Litigation Hold; read-only holds (eDiscovery, In-Place, Compliance Tag, Purview Retention) display with Purview portal guidance
- **Contacts** -- editable properties form with on-premises sync awareness
- **Entra Devices** -- OS-aware hero, source presence chips (Entra, Intune, NinjaOne), NinjaOne hardware enrichment, quick actions (enable/disable, BitLocker, delete)
- **MEM Devices** -- compliance-colored hero, NinjaOne hardware enrichment, categorized quick actions (sync, reboot, rename, LAPS, BitLocker, retire, delete), NinjaOne data merged into device listings (extends upstream's device page)
- **Applications** -- assignment details, install experience, detection rules, and assignment quick actions

### Teams Business Voice Management

A comprehensive voice management section with dedicated pages for each component of the Teams telephony stack:

- **Phone Numbers** -- card and table views with assignment status, assigned user displayed prominently, number type, emergency location, and quick actions to assign/unassign users and set emergency locations
- **Call Queues** -- view all call queues with routing method, agent counts, overflow and timeout settings; detailed off-canvas view with agent list, conference mode, and music/greeting configuration
- **Auto Attendants** -- view all auto attendants with voice response status, operator, language, and timezone; detailed off-canvas view with business hours and after-hours call flows, menu options, and holiday schedules
- **Dial Plans** -- view all tenant dial plans with normalization rule counts; detailed off-canvas view with full rule list showing match patterns and translations

### File Management

- **Tenant-wide file search** -- search across all SharePoint sites and OneDrive accounts in a tenant using Microsoft's KQL syntax. Filter by file name, type, author, date, path, and more. Results include a copy-link button for sharing direct file URLs with end users, a browse-to-location button to jump into the file browser, and an open-in-SharePoint link. Built-in search tips guide users through KQL operators and combined filters.
- **File browser** for any user's OneDrive or SharePoint site -- navigate folders, download, rename, move, copy, delete files, and create folders without leaving the portal. Includes a location switcher to jump between SharePoint sites or OneDrive users without returning to the landing page. Direct "Browse Files" links are available from Team detail pages, individual channel rows, and SharePoint site detail pages, opening the file browser pre-loaded to the correct site.
- **Cross-drive transfer wizard** -- move or copy files and folders between OneDrive accounts and SharePoint sites with a visual destination browser. Supports single-item and bulk transfers with per-item progress tracking (pending, in progress, done, skipped, failed) displayed in a live status table.
- **Conflict resolution** -- three options when items already exist at the destination:
  - **Rename** (default) -- Graph API automatically appends a numeric suffix to avoid conflicts
  - **Replace** -- deletes the existing item at the destination before copying, ensuring a clean overwrite for both files and folders
  - **Skip duplicates** -- files that already exist at the destination are skipped; folders that already exist are intelligently merged rather than skipped entirely. A recursive comparison checks whether the destination folder's contents fully match the source. Fully matching folders are skipped instantly. Partially-copied folders are merged: only the missing files and subfolders are copied into place while already-existing items are left untouched. This enables resuming a previously interrupted transfer without re-copying everything.
- **Frontend pre-check optimization** -- when skip duplicates is selected, the destination contents are fetched once upfront and duplicate files are marked as skipped immediately in the UI without making individual backend calls, providing instant feedback before the transfer begins
- **Verified transfers** -- cross-drive copy and move operations poll the Graph API monitor URL for completion, then verify the destination item exists and matches the source in size before reporting success. For moves, the source is only deleted after verified copy completion to prevent data loss
- **Folder compare** -- side-by-side recursive comparison of any two folder locations (OneDrive or SharePoint). A two-panel dialog lets users pick a source and destination, then runs a depth-limited diff that returns every difference: items only in the source, items only in the destination, and files with differing sizes. Results are displayed in a flat table with status chips, size columns, and checkbox selection. Users can select any subset of differing items and copy them to the other location in bulk, with per-item progress tracking. Matching file counts are shown in summary chips so users can quickly gauge how much the two locations overlap
- **Temp file cleanup wizard** -- a guided 5-step wizard to find and remove temporary and junk files from SharePoint sites and OneDrive accounts:
  - **Flexible scope** -- scan a single SharePoint site, a specific user's OneDrive, all SharePoint sites, or all OneDrives in a tenant
  - **Configurable filters** -- select which file types to target: Office temp files (~$*), .TMP/.temp files, zero-byte files, system junk (Thumbs.db, .DS_Store, desktop.ini), and backup files (.bak, .old)
  - **Recursive scanning** -- searches all folders up to 10 levels deep with progress feedback
  - **File selection** -- review scan results in a searchable table with per-file checkboxes, bulk select/deselect, and type-based filtering
  - **Double verification** -- checkbox confirmation plus button click required before any deletion
  - **Safe deletion** -- files are moved to the SharePoint/OneDrive recycle bin (93-day recovery) rather than permanently deleted
  - **Detailed results** -- per-file success/failure status with actionable error messages

### SharePoint Admin Dashboard

A dedicated SharePoint dashboard under Teams & SharePoint > SharePoint > Dashboard providing at-a-glance visibility into tenant storage health and site administration:

- **Key Metrics** -- tenant storage used/total, total sites, total files, and inactive site count
- **Storage Charts** -- tenant quota donut (used vs free), storage breakdown by site type (Communication, Group-Connected, Classic), and top 10 sites by storage consumption as a bar chart
- **Storage Alerts** -- sites approaching storage limits (>75% and >90%) sorted by severity with colored chips
- **Inactive Sites** -- sites with no activity in 90+ days, sorted by storage used to help identify cleanup candidates
- **Sharing Configuration** -- tenant-level external sharing settings, default link type, resharing policy, and link expiration at a glance
- **Recently Created Sites** -- new sites from the last 30 days

Data is cached in the CIPP reporting database and refreshed daily during the scheduled cache cycle. A manual "Refresh Data" button triggers an on-demand cache update. The dashboard gracefully handles the first visit before any data is cached with a clear empty state and refresh prompt.

### SharePoint Recycle Bin

Manage and recover deleted SharePoint sites with retention tracking, visual expiration warnings, one-click restore, and permanent delete with appropriate safety warnings.

### Cross-Tenant Access & External Collaboration Governance

Centralized management of Microsoft Entra cross-tenant access policies, B2B collaboration settings, and external identity controls -- settings that are otherwise only manageable in the Entra portal and difficult to standardize across clients:

- **Overview Dashboard** with health scoring and policy summary
- **Default Policy Editor** for B2B Collaboration, Direct Connect, Inbound Trust, Tenant Restrictions v2, and Automatic User Consent
- **Partner Organizations** management with per-partner overrides and reverse tenant name lookup
- **External Collaboration Settings** for guest invite restrictions, guest access levels, and domain allow/deny lists
- **Configuration Health & Conflict Detection** -- automated analysis across all cross-tenant settings layers with specific recommendations and direct links to fix issues
- **Security Baseline Templates** -- create, apply, and reuse cross-tenant security configurations across tenants
- **Standards Integration** -- 9 new standards (12 total covering the full cross-tenant surface) enabling drift detection, automated remediation, and alerting through the existing CIPP Standards framework

### Tenant-Level Policy Management

Dedicated settings pages for policies that normally require switching between multiple Microsoft admin portals:

- **SharePoint Sharing Settings** -- external sharing level, domain restrictions, default link type, anonymous link controls, and resharing behavior
- **Teams Tenant Settings** -- federation and external access, guest access, cloud storage providers, meeting policy, messaging policy, and meeting background management, organized in a tabbed interface with per-section save. The meeting backgrounds tab lets administrators enable organization-wide custom backgrounds, view currently configured images, assign branding policies to individual users, and links directly to the Teams Admin Center for image upload (Microsoft does not expose a public API for background image upload). Includes image requirement guidance with dimension warnings.

### Cross-Service Context Clues

External access in Microsoft 365 is controlled by multiple independent settings layers (Cross-Tenant Access, Entra External Collaboration, SharePoint Sharing, Teams Federation) -- any one of which can block access. Manage365 adds contextual banners and cross-links throughout these settings pages so administrators can quickly identify which layer is causing an issue and navigate directly to it.

### Risk Coaching & Settings Safety

An inline risk coaching system that alerts administrators to potentially dangerous settings as they make changes. Over 30 risk rules across External Collaboration, Cross-Tenant Policy, SharePoint Sharing, Teams Settings, Offboarding Wizard, Transport Rules, and Alert Configuration highlight dangerous options, recommend safer alternatives, and require explicit confirmation before saving high-risk configurations. B2B direct connect settings include dedicated risk coaching that explains the security model -- direct connect users have no directory footprint and are not subject to Conditional Access unless inbound trust is configured -- and recommends partner-specific policies over opening the default.

### Access Type Coaching: Guest Access vs External Access

Microsoft 365 has two fundamentally different ways to collaborate with external users -- Guest Access (B2B Collaboration) and External Access (B2B Direct Connect) -- controlled by different settings layers with different capabilities and security implications. Manage365 adds consistent, context-aware coaching throughout the application so administrators understand which access type applies to what they're doing:

- **Inline chips** with educational tooltips replace generic "Guest" labels on member lists across Teams, SharePoint, and user management pages
- **Contextual banners** in all guest invitation and channel member dialogs explain which access type is being used, what it means, and which email types are supported (organizational vs personal)
- **Expandable info panels** on Teams channel detail, Cross-Tenant Access, and SharePoint pages provide a side-by-side comparison of both access types with characteristics, limitations, and links to the relevant settings pages
- **Standards helpText** for guest-related standards (Guest Invite, Teams Guest Access, External MFA Trust, SP Azure B2B) now clarifies which access type each standard controls
- **Backend messages** tag every success and error result with the access type label (e.g., "Guest Access — B2B Collaboration" or "External Access — B2B Direct Connect") so results are unambiguous
- **Actionable error guidance** when a personal email is entered for a shared channel explains why it's not supported and directs the user to use a private channel instead

All coaching content is driven by a single shared data layer (`accessTypes.js`) so terminology stays consistent across the entire application and can be updated in one place.

### Guest Invitation & Channel Member Diagnostics

Invite external guests directly from SharePoint site and Teams detail pages. Add external members to shared channels via B2B direct connect, or add guests with any email address (including personal emails like Gmail and Outlook.com) to private channels via B2B collaboration with automatic Email One-Time Passcode support. If an operation fails, the system automatically diagnoses the root cause -- checking cross-tenant access policies (B2B direct connect inbound/outbound), B2B domain restrictions, Teams guest access settings, Entra external collaboration settings, and SharePoint permissions -- and provides categorized, structured guidance with direct links to the relevant CIPP settings page. Microsoft internal error codes (e.g., "xTap") are translated to human-readable descriptions.

### Pre-flight Domain Validation & Email Intelligence

Real-time validation of guest email addresses before invitation, powered by a reusable domain intelligence API (`ExecValidateExternalDomain`). As administrators type an email address in any guest invitation dialog, the system:

- **Classifies the email domain** via OIDC discovery as consumer (Gmail, Yahoo, Outlook.com), organizational (another M365 tenant), or unresolvable
- **Checks for existing guest accounts** in the target tenant to avoid duplicate invitations
- **Evaluates tenant policies** across Entra External Collaboration, B2B domain allow/block lists, SharePoint sharing settings, Teams guest access, and Cross-Tenant Access policies
- **Returns a structured verdict** with pass/fail/warning status, recommended access type, and specific fix guidance for any blocking policies

Consumer domain detection is also integrated into the guest invite drawer and the Add Channel Member dialog for shared channels, where personal emails are blocked with an explanation of why shared channels require work/school accounts and a suggestion to use a private channel instead.

### Interactive Access Type Decision Tree

An interactive question-and-answer flow added to the `CippAccessTypeGuide` component (`variant="decision"`) helps administrators choose between Guest Access (B2B Collaboration) and External Access (B2B Direct Connect). Context-specific trees for SharePoint, Teams standard/private/shared channels, and a general-purpose flow guide users to the correct access type based on the external user's email type and the target resource, with clear lists of what is and isn't supported and concrete next steps.

### External Access Wizard

A multi-step guided wizard (`/teams-share/external-access`) that unifies the entire external user onboarding flow:

1. **Who** -- enter one or more guest email addresses with inline domain validation and real-time policy feedback
2. **Where** -- select the target resource (SharePoint site, Teams standard/private/shared channel) with context-aware access type recommendations; shared channel options are automatically hidden for personal email addresses
3. **Review** -- summary of guests, resource, access type, and any policy warnings before execution
4. **Execute** -- sends invitations with per-guest progress tracking and individual success/error results

### Sharing & Guest Troubleshooter

A comprehensive diagnostic tool (`/teams-share/troubleshooting/sharing-troubleshooter`) that performs a structured sequence of 10 checks to identify why an external user cannot access a shared resource:

1. Domain type classification (consumer vs organizational via OIDC)
2. Guest account existence in the tenant
3. Guest account status (enabled, disabled, pending acceptance)
4. Entra External Collaboration invite restrictions
5. Entra B2B domain allow/block lists
6. Email One-Time Passcode authentication method status
7. SharePoint tenant sharing settings and domain restrictions
8. Teams guest access configuration
9. Cross-Tenant Access policies (for organizational domains and shared channels)
10. Site-level membership verification (when a resource URL is provided)

Results are displayed in a visual timeline with color-coded pass/fail/warning status, detailed explanations, fix recommendations with links to the relevant settings page, and quick presets for common troubleshooting scenarios. The backend (`ExecSharingTroubleshoot`) returns a structured timeline that can be consumed by other components.

### SharePoint Document Library Sharing Links

A new backend endpoint (`ExecCreateSharingLink`) enables creation of sharing links for specific SharePoint drive items using the Microsoft Graph `createLink` API. Supports view, edit, and embed link types with anonymous, organization, or specific-people scopes, optional expiration dates, and password protection.

### Guest Lifecycle Dashboard

A dedicated guest user management page (`/identity/administration/guest-users`) providing visibility into all guest accounts across a tenant:

- **Summary cards** showing total guests and counts by status: Active, Stale (no sign-in for 90+ days), Pending Acceptance, Disabled, and Never Signed In
- **Status classification** computed from sign-in activity data via the Graph beta API
- **Filterable table** with one-click status filter buttons to quickly isolate problematic guests
- **Row actions** including re-invite for pending or stale guests

### Guest-Ready Bulk Configuration

A "Quick Setup: Guest-Ready Configuration" card on the Cross-Tenant Access page that configures a tenant for external guest collaboration in one click. Applies secure defaults across three services:

- **Entra:** Guest invite restrictions set to Admins and Guest Inviter role
- **SharePoint:** External sharing enabled for new and existing guests
- **Teams:** Guest access enabled

Includes a confirmation dialog showing exactly what will be changed and per-step success/error reporting.

### Enhanced Cross-Tenant Health Checks

Four new health checks (12-15) added to the Cross-Tenant Health endpoint:

- **Teams guest access** -- warns if guest access is disabled in Teams client configuration
- **Email OTP status** -- warns if Email One-Time Passcode authentication is not enabled, which blocks personal email guests
- **SharePoint/Entra sharing mismatch** -- detects when Entra allows guests but SharePoint sharing is disabled (or vice versa)
- **Domain restriction divergence** -- detects when Entra and SharePoint have mismatched allowed/blocked domain lists

### eDiscovery Case Management

End-to-end eDiscovery workflow for managing legal holds, content searches, and evidence exports directly from the portal -- eliminating the need to switch to the Microsoft Purview compliance portal or write PowerShell scripts for each client:

- **Case management** -- create, close, reopen, and delete eDiscovery cases per tenant with status tracking, case metadata, and external ID support for correlating with legal matter numbers
- **Legal holds** -- place litigation holds on specific user mailboxes and SharePoint sites with optional KQL content queries to narrow the scope. Supports multiple content sources per hold and displays hold status with content source counts
- **Content searches** -- create KQL-based searches across Exchange, SharePoint, Teams, and OneDrive. Run search estimates to preview result counts and data volume before committing to an export. Status polling auto-refreshes while searches are running
- **Export and production** -- initiate exports from completed searches with configurable export criteria. Export operations track progress percentage and provide download links when complete. Auto-polling updates export status in real time
- **Async operation tracking** -- long-running operations (search estimates, exports) are handled asynchronously with automatic 5-second polling that stops when the operation completes or fails
- **Setup guidance** -- a proactive setup banner on the cases page explains the one-time per-tenant prerequisites (CPV refresh for permissions and eDiscovery Administrator role assignment in Purview), plus reactive error classification that detects 403/permission and license errors and renders structured remediation steps
- **Tier support** -- uses the Microsoft Graph eDiscovery Standard API (September 2025), which works for both E3 and E5 tenants. Phase 2 will add Premium-only features (custodian management, review sets, advanced export options) for E5 tenants

Built on app-only authentication (`eDiscovery.Read.All` and `eDiscovery.ReadWrite.All`) via SAM, consistent with the rest of the CIPP architecture. Located under Security & Compliance > eDiscovery > Cases.

### Dynamics 365 Management

Read-only visibility into Power Platform / Dynamics 365 environments, users, security roles, business units, and solutions -- providing insight without needing the Power Platform Admin Center.

### NinjaOne Device Enrichment

When NinjaOne integration is configured, device views across the application are automatically enriched with hardware data (CPU, RAM, OS, agent status, last contact). Works across MEM Devices, Entra Devices, and per-user device views, with graceful degradation when NinjaOne is not available. Backend sync includes Entra-only fallback for non-Intune tenants, O(1) serial number indexing for device matching, and memory-optimized processing.

### Enhanced Error Messages & Permission Guidance

Structured error formatting throughout the application. The `FormattedResultText` renderer automatically detects and formats common error patterns: backend `Diagnostics:` sections are parsed into categorized items with `[Category]` chips and `CIPP Settings:` paths become clickable navigation buttons. SharePoint-specific error classification provides targeted diagnostics for token acquisition and access issues without misdirecting users to superadmin settings.

### Mailbox External Mail Restrictions

Control external email flow on a per-mailbox basis directly from the user's Exchange tab. Two independent toggles allow administrators to:

- **Block external inbound** -- sets `RequireSenderAuthenticationEnabled` so only internal (authenticated) senders can email the mailbox; external senders receive an NDR
- **Block external outbound** -- flags the mailbox via `CustomAttribute15` and auto-creates a tenant-wide transport rule that rejects messages sent to external recipients from any flagged mailbox

Each toggle includes a confirmation dialog with clear warnings about the consequences. Restrictions can be applied independently (inbound only, outbound only, or both) and reversed at any time. The current status is displayed as a visual tile on the Exchange info card alongside other mailbox settings.

### Email Troubleshooter

A unified email troubleshooting hub under Email & Exchange > Troubleshooting that combines message trace and quarantine management into a single search-diagnose-act workflow, eliminating the context-switching that previously required technicians to navigate between separate pages in different menus.

- **Unified search** -- a single search form queries both Exchange message trace and quarantine simultaneously, returning results in a tabbed interface with badge counts showing trace results and unreleased quarantine messages
- **Quick-filter presets** -- one-click chips for common searches: "Quarantined (24h)", "Failed Delivery (48h)", "All Recent (7d)" pre-fill the search form and execute immediately
- **Advanced filtering** -- collapsible advanced section with Message ID, subject, status, From/To IP, and quarantine type (Spam, Phish, Malware, High Confidence Phish) filters
- **Contextual actions on trace results** -- View Delivery Details, View in Security Explorer, Allow Sender, Block Sender, Copy Message ID, and Release from Quarantine (appears only for quarantined messages) without leaving the page
- **Contextual actions on quarantine results** -- View Message (EML preview), View Delivery Timeline, Release, Deny, Release & Allow Sender, Release & Add Allow Entry (creates a Tenant Allow/Block List entry), and Block Sender
- **Cross-tab linking** -- clicking a "Quarantined" status chip in the trace tab switches to the quarantine tab and filters to the matching message
- **Bulk quarantine operations** -- select multiple quarantine entries and release, deny, or release-and-allow in bulk with tiered confirmation guardrails (10+ and 50+ messages)
- **Delivery timeline visualization** -- an MUI Timeline-based detail panel replaces the plain table, showing color-coded delivery events (green for delivered, red for failed, amber for quarantined) with timestamps, event names, actions, and detail text
- **Partial failure resilience** -- the combined backend endpoint handles permission failures gracefully: if quarantine access is missing but trace works (or vice versa), partial results are shown with a guidance banner explaining which data source failed and how to fix it
- **Guest UPN encoding** -- sender and recipient addresses containing `#EXT#` are automatically encoded for Exchange Online API compatibility

The navigation is restructured with Troubleshooting as the first submenu under Email & Exchange, placing the most commonly used tools at the top. The standalone Quarantine Management page remains available for all-tenant bulk monitoring. Message Viewer and Mailbox Restores are relocated from Tools to Troubleshooting for better discoverability.

### Organized Navigation

Deeply nested navigation menus that group related pages together, reducing menu length and making features easier to find -- External Access with External Access Wizard and Sharing Troubleshooter; Email & Exchange Troubleshooting with Email Troubleshooter, Quarantine, Message Viewer, and Mailbox Restores; Groups with Group Templates; Users with Offboarding Wizard, Risky Users, and Guest Users; Business Voice with Phone Numbers, Call Queues, Auto Attendants, and Dial Plans; File Management with File Search, File Browser, and File Transfer; and more.

### Bulk Domain Migration

Migrate users and groups from one domain to another in bulk -- a common need when clients rebrand or consolidate domains. Available from two entry points:

- **Users page** -- select users, choose "Change Domain" from bulk actions, pick the target domain, and migrate
- **Domains page** -- click "Migrate Users to This Domain" on any verified domain, select a source domain, then pick which users and groups to migrate

The migration changes each user's UPN and primary email to the new domain while automatically preserving the old email address as an alias so inbound mail delivery is not disrupted. Groups (M365 Groups, Distribution Lists, Mail-Enabled Security Groups) are supported with an opt-in toggle. Conflict detection checks for address collisions before making changes, and per-object results report exactly which items succeeded or failed.

### Integration Templates

A template-based system for creating app registrations in client tenants, designed to streamline the setup of third-party integrations like UniFi Identity, Datto, and similar services that require Microsoft Entra app credentials.

- **Prebuilt templates** -- ships with ready-to-use templates for common integrations (UniFi Identity included) with correct API permissions pre-configured
- **Custom templates** -- create your own templates for any integration, selecting from a curated list of common Microsoft Graph permissions
- **Multi-tenant deployment** -- deploy the same app registration to multiple client tenants in a single operation with orchestrator-based parallel processing
- **Credential display** -- after deployment, credentials (Application ID, Tenant ID, Client Secret) are displayed in a table with individual copy buttons, show/hide toggle for secrets, and a "Copy All" button for bulk export
- **CSV export** -- export all deployment results including credentials for record-keeping and documentation
- **Secret expiration** -- choose secret lifetime (90 days to 2 years) during deployment; longer expirations reduce maintenance overhead
- **Built-in template protection** -- prebuilt templates show a lock icon and can be duplicated but not modified or deleted, ensuring reliable defaults
- **Automatic admin consent** -- app role assignments are created automatically, granting the configured permissions without additional manual steps in the Entra portal

Located under Tenant Administration > Applications > Integration Templates.

### Backend Enhancements

- **Stack overflow protection** in Intune policy comparison with depth-tracking recursion and O(1) index-based lookups
- **Thorough mailNickname sanitization** in group creation (M365 spec compliance: extracts local part, removes forbidden characters, enforces 64-char limit)
- **Enhanced CippEntrypoints** with function-existence validation before invocation, detailed error logging with stack traces, queue trigger support, and Premium SKU FanOut mode
- **Durable SDK 2.2.0** with fan-out/fan-in/fan-out orchestration pattern for DB cache collection
- **Channel filesFolder batch-fetch** -- Teams detail API returns per-channel SharePoint siteId/driveId via Graph batch requests, enabling direct file browsing for private/shared channels with their own SharePoint sites
- **SharePoint REST auto-elevation** -- when adding members to non-group-connected sites (Communication, classic Team), the delegated token may lack site-level permissions. The endpoint now auto-elevates the SAM user to site collection admin via CSOM `SetSiteAdmin` (app-only admin API) and retries, with a final Graph API `drive/root/invite` fallback if CSOM is unavailable. Eliminates the manual "run CPV Refresh" step for most SharePoint member operations
- **Selective user edit body** -- only sends properties that are explicitly set, preventing accidental field clearing during inline edits
- **License backfill integration** -- missing licenses show formatted names immediately with asynchronous API backfill for accurate display names
- **Power Platform Administrator** role included in GDAP role sets

---

## Technology Stack

- **Frontend:** React / Next.js 16 with Material-UI (MUI v7)
- **Backend:** PowerShell Azure Functions
- **API:** Microsoft Graph API (including eDiscovery API), SharePoint Admin API, SharePoint REST API, Teams PowerShell cmdlets (via `New-TeamsRequest`, including meeting branding policy management), Power Platform BAP API, Dataverse Web API, NinjaOne API (via CIPP extension)
- **Hosting:** Azure Static Web Apps + Azure Functions
- **Data:** React Query for caching and state management

---

## Acknowledgments

Manage365 is built on the [CIPP](https://cipp.app) open-source project created by [Kelvin Tegelaar](https://github.com/KelvinTegelaar) and the CIPP community. We are grateful for their foundational work that makes this project possible.
