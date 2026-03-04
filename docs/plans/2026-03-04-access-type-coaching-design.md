# Access Type Coaching Design: Guest Access vs External Access

**Date**: 2026-03-04
**Status**: Approved

## Problem

CIPP uses "guest" and "external" loosely and interchangeably throughout the UI and backend messages. Users don't understand the difference between **Guest Access** (B2B Collaboration — invitation-based, creates a directory object) and **External Access** (B2B Direct Connect — no directory footprint, shared channels only). This causes confusion when managing Teams channels, SharePoint sites, and cross-tenant policies.

## Approach

**Approach A — Shared Definitions + Reusable Component**: Define the access type taxonomy once in a shared data file, build a single reusable `CippAccessTypeGuide` component with three rendering variants (chip, banner, panel), and integrate across all relevant surfaces.

## Data Layer

**File**: `src/data/accessTypes.js`

A single source of truth defining two access types:

### Guest Access (B2B Collaboration)
- Creates a guest account in the directory
- Subject to Conditional Access policies
- Supports organizational and personal email addresses (Gmail, Outlook.com via Email OTP)
- Requires Entra External Collaboration settings to allow invitations
- Used for: Teams channels (standard & private), SharePoint sites, M365 Groups
- Settings layers: Entra External Collaboration, Cross-Tenant Access Policy (B2B Collaboration), Teams Guest Access

### External Access (B2B Direct Connect)
- No guest account — no directory footprint
- NOT subject to Conditional Access (unless inbound trust configured)
- Requires a work or school account — personal emails not supported
- Requires cross-tenant access policies on BOTH tenants
- Used for: Teams shared channels only
- Settings layers: Cross-Tenant Access Policy (B2B Direct Connect), Teams Settings (Federation)

### Context Map

Each integration point declares which access types are relevant:

| Context Key | Primary | Secondary | Notes |
|-------------|---------|-----------|-------|
| `teamsSharedChannel` | external | guest | Shared channels use direct connect; existing guests also visible |
| `teamsPrivateChannel` | guest | — | Private channels invite guests; personal emails supported |
| `teamsStandardChannel` | guest | — | Same as private |
| `sharepoint` | guest | — | SharePoint uses guest invitations only |
| `userManagement` | guest | — | Directory view shows guest accounts |
| `crossTenantAccess` | both | both | Policy page covers both types equally |

## Component Design

**File**: `src/components/CippComponents/CippAccessTypeGuide.jsx`

### Props

| Prop | Type | Description |
|------|------|-------------|
| `type` | `"guest"` \| `"external"` | Which access type (for chip/banner) |
| `variant` | `"chip"` \| `"banner"` \| `"panel"` | Rendering mode |
| `context` | string | Context key from `ACCESS_TYPE_CONTEXTS` (drives emphasis and notes) |
| `showSettingsLinks` | boolean | Whether to include navigation links (default true for panel/banner) |

### Variant: Chip
Small colored chip with tooltip. Used in pickers, member lists, table columns.
- Guest: info-colored, tooltip shows short description
- External: warning-colored, tooltip shows short description

### Variant: Banner
Slim MUI Alert (consistent with `CippRelatedSettings` and `CippRiskAlert`). Placed at the top of action dialogs and forms.
- Title: "This action uses Guest Access (B2B Collaboration)" or equivalent
- Body: context-specific explanation (e.g., personal email support for private channels)
- Optional settings links

### Variant: Panel
Collapsible card for detail pages. Shows both access types side-by-side.
- Title: "Understanding Access Types"
- Two columns with descriptions, characteristics, settings links
- Primary type for the context is visually highlighted

## Integration Plan

### Teams Detail Page (`team-details.js`)
- **Panel** at top of Channel Members section for shared/private channels
- **Banner** in Add Channel Member dialog (replaces current confirmText logic)
- **Chip** on guest member rows (replaces hardcoded `[Guest]` chip)
- **Banner** in CippGuestInviteDialog invocation

### SharePoint Site Detail Page (`site-details.js`)
- **Panel** on Members section (`context="sharepoint"`)
- **Chip** on guest member rows

### Guest Invite Components
- **`CippGuestInviteDialog.jsx`**: Banner below title explaining Guest Access; note about personal email support
- **`CippInviteGuestDrawer.jsx`**: Banner explaining access type
- **`CippBulkInviteGuestDrawer.jsx`**: Banner explaining access type

### User Management (`users/index.js`)
- **Chip** in userType column with educational tooltip

### Cross-Tenant Access Pages
- **`index.js`**: Panel showing both types side-by-side
- **`external-collaboration.js`**: Banner clarifying these settings control Guest Access only
- **`partners/partner.js`**: Chips on section headers

### Teams Settings Page (`teams-settings.js`)
- **Banner** on Guest & Cloud Storage tab

### SharePoint Sharing Settings (`sharing-settings.js`)
- **Banner** clarifying interaction with Guest Access

### Standards (`standards.json`)
Append access-type context to helpText:
- **GuestInvite**: "Controls B2B collaboration (Guest Access). Does not affect B2B direct connect (External Access) for shared channels."
- **TeamsGuestAccess**: "Required for Guest Access in Teams. Shared channels use External Access (B2B Direct Connect) controlled by cross-tenant access policies."
- **ExternalMFATrusted**: "Applies to Guest Access users authenticating via B2B collaboration."
- **SPAzureB2B**: "Enables SharePoint integration with B2B collaboration (Guest Access)."

## Backend Message Improvements

### `Invoke-ExecTeamAction.ps1` (AddChannelMember)
- Guest success: append "(Guest Access — B2B Collaboration)"
- External success: append "(External Access — B2B Direct Connect)"
- Personal email on shared channel error: add "Personal email addresses (Gmail, Outlook.com, etc.) can only be added to standard or private channels as guest users."

### `Invoke-ExecSharePointInviteGuest.ps1`
- Success: append "(Guest Access — B2B Collaboration)"

### `Invoke-AddGuest.ps1`
- Success: append "(Guest Access — B2B Collaboration)"

## Implementation Order

1. Create `src/data/accessTypes.js` (data layer)
2. Create `src/components/CippComponents/CippAccessTypeGuide.jsx` (component)
3. Integrate into Teams detail page (highest impact surface)
4. Integrate into guest invite components
5. Integrate into SharePoint site detail page
6. Integrate into user management
7. Integrate into cross-tenant access pages
8. Integrate into Teams settings and SharePoint sharing settings
9. Update standards.json helpText
10. Update backend success/error messages
