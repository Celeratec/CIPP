<p align="center">
  <img src="public/Main%20logo%20-CMYK.png" alt="Manage365 Logo" height="80">
</p>

<h1 align="center">Manage365</h1>

<p align="center">
  An enhanced Microsoft 365 multi-tenant management portal based on the <a href="https://cipp.app">CIPP</a> open-source project.
</p>

---

> **Last synced with upstream:** February 2026 (CIPP v10.1.1 / CIPP-API v10.1.1)
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
- User administration (create, edit, delete, offboard with orchestrator-based batch processing)
- Bulk guest invitation
- Risky users monitoring
- Group management with templates and group detail page
- Device management (Entra ID devices with NinjaOne enrichment, cross-linked to Intune)
- Per-user device view with hardware details and NinjaOne agent status
- Role management and JIT Admin
- Reports: MFA, inactive users, sign-in logs, Entra Connect, risk detections, BEC remediation

### Tenant Administration
- Multi-tenant management and configuration
- Upgraded tenant onboarding experience with type selection
- Alert configuration and audit logs (group membership change, Defender severity filtering, inactive users)
- Secure Score monitoring
- Application management and consent requests
- GDAP relationship management with GDAP trace
- Standards alignment and drift detection (including device registration local admin controls)
- Best Practice Analyser and Domains Analyser (with DKIM selector rotation)
- Conditional Access policy management, templates, and vacation mode
- Licence reporting and management with granular control
- Feature flags
- Reusable settings standards with templates
- Configuration backup with preview drawer and JSON viewer
- Log retention settings

### Security & Compliance
- Incident and alert management (including MDO alerts)
- Defender status, deployment, and TVM vulnerabilities
- Defender alerts with severity filtering
- Device compliance reporting
- Customer Lockbox

### Endpoint Management
- Application management and deployment queue (including Win32/custom apps)
- Managed device administration with NinjaOne hardware enrichment (CPU, RAM, agent status)
- Device detail page
- DEP sync
- Autopilot device management, profiles, and status pages
- Configuration and compliance policies with templates
- Intune reusable settings deployment and templates
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
- Reports: mailbox statistics, activity, CAS settings, permissions, calendar permissions, anti-phishing, malware filters, safe attachments, GAL
- Queue tracking for report generation

### Tools
- Graph Explorer with simple filter UI
- Universal Search v2 with user and group search
- Application approval workflow
- Tenant and IP lookup
- Domain health checks
- Message trace, mailbox restores, message viewer
- Dark web breach lookups (tenant and individual)
- Template library and community repositories
- Task scheduler

### Settings & Administration
- Application settings and integrations
- SAM service principal lock configuration
- Setup wizard and onboarding
- Logbook and diagnostics
- Custom data / directory extensions
- Super admin tools (tenant mode, exchange cmdlets, timers, table maintenance)

---

## Features Unique to Manage365

The following capabilities have been developed specifically for Manage365 and are not available in upstream CIPP as of the date shown above.

### Visual Card Views & Modern UI

CIPP uses table-only views for listing data. Manage365 adds card view alternatives across every major list page -- Users, Groups, Teams, Mailboxes, Contacts, Devices, Applications, SharePoint Sites, OneDrive, and more. Cards surface key status badges, metadata, and up to 8 quick-action buttons directly on each item, so common tasks are one click away without opening a detail page. Standardized card widths, meaningful icons (OS-aware device icons, entity-type icons), and consistent badge design provide a polished, scannable interface.

### Mobile-Responsive Design

Comprehensive mobile responsiveness throughout the application: responsive data tables that adapt to screen size, mobile-friendly toolbars with compact controls, sticky wizard step buttons, a mobile tenant selector in the top navigation, and card views optimized for touch. The entire interface is usable on tablets and phones without horizontal scrolling.

### Enhanced Detail Pages

Manage365 extends upstream's detail pages with significantly richer, purpose-built interfaces for key entities:

- **SharePoint Sites** -- storage monitoring, member and administrator management (including non-group-connected sites), guest invitation with domain restriction diagnostics and one-click quick-fix, cross-linking to Teams, and Create Team from Site
- **Teams** -- member/owner management, channel management (including private/shared channel members), app management, interactive toggle-chip settings for member permissions, guest permissions, messaging, and fun settings, plus guest invitation with Teams-specific diagnostics
- **Groups** -- hero overview by group type, member/owner/contact management, editable properties, interactive toggle-chip settings, dynamic membership rule display, and on-premises sync awareness (extends upstream's group page)
- **Mailboxes** -- mailbox type identification, aliases, archive and litigation hold status, and direct link to Exchange settings
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

### OneDrive File Browser & Cross-Drive Transfer

- **File browser** for any user's OneDrive -- navigate folders, download, rename, move, copy, delete files, and create folders without leaving the portal
- **Cross-drive transfer wizard** -- move or copy files between OneDrive accounts and SharePoint sites with a visual file picker and destination browser

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
- **Teams Tenant Settings** -- federation and external access, guest access, cloud storage providers, meeting policy, and messaging policy, organized in a tabbed interface with per-section save

### Cross-Service Context Clues

External access in Microsoft 365 is controlled by multiple independent settings layers (Cross-Tenant Access, Entra External Collaboration, SharePoint Sharing, Teams Federation) -- any one of which can block access. Manage365 adds contextual banners and cross-links throughout these settings pages so administrators can quickly identify which layer is causing an issue and navigate directly to it.

### Risk Coaching & Settings Safety

An inline risk coaching system that alerts administrators to potentially dangerous settings as they make changes. Over 30 risk rules across External Collaboration, Cross-Tenant Policy, SharePoint Sharing, Teams Settings, Offboarding Wizard, Transport Rules, and Alert Configuration highlight dangerous options, recommend safer alternatives, and require explicit confirmation before saving high-risk configurations. B2B direct connect settings include dedicated risk coaching that explains the security model -- direct connect users have no directory footprint and are not subject to Conditional Access unless inbound trust is configured -- and recommends partner-specific policies over opening the default.

### Guest Invitation & Channel Member Diagnostics

Invite external guests directly from SharePoint site and Teams detail pages. Add external members to shared channels via B2B direct connect. If an operation fails, the system automatically diagnoses the root cause -- checking cross-tenant access policies (B2B direct connect inbound/outbound), B2B domain restrictions, Teams guest access settings, Entra external collaboration settings, and SharePoint permissions -- and provides categorized, structured guidance with direct links to the relevant CIPP settings page. Microsoft internal error codes (e.g., "xTap") are translated to human-readable descriptions.

### Dynamics 365 Management

Read-only visibility into Power Platform / Dynamics 365 environments, users, security roles, business units, and solutions -- providing insight without needing the Power Platform Admin Center.

### NinjaOne Device Enrichment

When NinjaOne integration is configured, device views across the application are automatically enriched with hardware data (CPU, RAM, OS, agent status, last contact). Works across MEM Devices, Entra Devices, and per-user device views, with graceful degradation when NinjaOne is not available. Backend sync includes Entra-only fallback for non-Intune tenants, O(1) serial number indexing for device matching, and memory-optimized processing.

### Enhanced Error Messages & Permission Guidance

Structured error formatting throughout the application. The `FormattedResultText` renderer automatically detects and formats common error patterns: backend `Diagnostics:` sections are parsed into categorized items with `[Category]` chips and `CIPP Settings:` paths become clickable navigation buttons. SharePoint-specific error classification provides targeted diagnostics for token acquisition and access issues without misdirecting users to superadmin settings.

### Organized Navigation

Deeply nested navigation menus that group related pages together, reducing menu length and making features easier to find -- Groups with Group Templates, Users with Offboarding Wizard and Risky Users, Business Voice with Phone Numbers, Call Queues, Auto Attendants, and Dial Plans, and more.

### Backend Enhancements

- **Stack overflow protection** in Intune policy comparison with depth-tracking recursion
- **Thorough mailNickname sanitization** in group creation (M365 spec compliance: extracts local part, removes forbidden characters, enforces 64-char limit)
- **Enhanced CippEntrypoints** with function-existence validation before invocation and detailed error logging with stack traces
- **Power Platform Administrator** role included in GDAP role sets

---

## Technology Stack

- **Frontend:** React / Next.js 16 with Material-UI (MUI v7)
- **Backend:** PowerShell Azure Functions
- **API:** Microsoft Graph API, SharePoint Admin API, SharePoint REST API, Teams PowerShell cmdlets (via `New-TeamsRequest`), Power Platform BAP API, Dataverse Web API, NinjaOne API (via CIPP extension)
- **Hosting:** Azure Static Web Apps + Azure Functions
- **Data:** React Query for caching and state management

---

## Acknowledgments

Manage365 is built on the [CIPP](https://cipp.app) open-source project created by [Kelvin Tegelaar](https://github.com/KelvinTegelaar) and the CIPP community. We are grateful for their foundational work that makes this project possible.
