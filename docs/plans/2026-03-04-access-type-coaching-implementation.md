# Access Type Coaching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add clear, consistent coaching throughout CIPP that distinguishes Guest Access (B2B Collaboration) from External Access (B2B Direct Connect), reducing user confusion.

**Architecture:** Shared data file defines the taxonomy once. A single reusable component (`CippAccessTypeGuide`) renders three variants — chip, banner, panel. Each page integrates the component with a context prop. Backend success/error messages are updated to include access type labels.

**Tech Stack:** React, Next.js, MUI (Alert, Chip, Tooltip, Card, Collapse), existing `CippRelatedSettings` and `CippRiskAlert` patterns for visual consistency.

---

### Task 1: Create Access Type Data Layer

**Files:**
- Create: `src/data/accessTypes.js`

**Step 1: Create the data file**

```javascript
import {
  PersonAdd,
  OpenInNew,
} from "@mui/icons-material";

export const ACCESS_TYPES = {
  guest: {
    key: "guest",
    label: "Guest Access",
    microsoftTerm: "B2B Collaboration",
    shortDescription:
      "External users are invited to your tenant as guest accounts. They appear in your directory and are subject to your Conditional Access policies.",
    fullDescription:
      "Guest Access (B2B Collaboration) creates a guest user object in your Entra ID directory. The guest authenticates using their home organization credentials or Email One-Time Passcode for personal accounts (Gmail, Outlook.com, etc.). Guests are subject to your Conditional Access policies and appear in your directory.",
    characteristics: [
      "Creates a guest account in your directory",
      "Subject to your Conditional Access policies",
      "Supports organizational and personal email addresses (Gmail, Outlook.com via Email OTP)",
      "Requires Entra External Collaboration settings to allow invitations",
      "Used for: Teams channels (standard & private), SharePoint sites, M365 Groups",
    ],
    settingsLinks: [
      {
        label: "External Collaboration",
        href: "/tenant/administration/cross-tenant-access/external-collaboration",
      },
      {
        label: "Cross-Tenant Access (B2B Collaboration)",
        href: "/tenant/administration/cross-tenant-access/policy",
      },
      {
        label: "Teams Guest Access",
        href: "/teams-share/teams/teams-settings",
      },
    ],
    chipColor: "info",
  },
  external: {
    key: "external",
    label: "External Access",
    microsoftTerm: "B2B Direct Connect",
    shortDescription:
      "External users access shared channels directly from their own tenant. No guest account is created — they have no directory footprint.",
    fullDescription:
      "External Access (B2B Direct Connect) allows users from other M365 organizations to participate in Teams shared channels without being added to your directory. They authenticate in their home tenant and access resources directly. No guest object is created.",
    characteristics: [
      "No guest account created — no directory footprint in your tenant",
      "NOT subject to your Conditional Access policies (unless inbound trust is configured)",
      "Requires a work or school account — personal emails (Gmail, etc.) are NOT supported",
      "Requires cross-tenant access policies configured on BOTH tenants",
      "Used for: Teams shared channels only",
    ],
    settingsLinks: [
      {
        label: "Cross-Tenant Access (B2B Direct Connect)",
        href: "/tenant/administration/cross-tenant-access/policy",
      },
      {
        label: "Teams Federation",
        href: "/teams-share/teams/teams-settings",
      },
    ],
    chipColor: "warning",
  },
};

export const ACCESS_TYPE_CONTEXTS = {
  teamsSharedChannel: {
    primary: "external",
    secondary: "guest",
    note: "Shared channels use External Access (B2B Direct Connect). Only work or school accounts from other M365 organizations can be added. Personal email addresses like Gmail are not supported. Existing guest users in your directory can also be added.",
  },
  teamsPrivateChannel: {
    primary: "guest",
    note: "Private channels use Guest Access (B2B Collaboration). External email addresses are invited as guest accounts. Both organizational and personal emails (Gmail, Outlook.com, etc.) are supported — personal emails authenticate via Email One-Time Passcode.",
  },
  teamsStandardChannel: {
    primary: "guest",
    note: "Standard channels use Guest Access (B2B Collaboration). External users must be invited as guests and added to the parent Team.",
  },
  sharepoint: {
    primary: "guest",
    note: "SharePoint uses Guest Access (B2B Collaboration). External users are invited as guest accounts and added to the site. Sharing links ('Anyone' links) bypass the guest invitation flow entirely.",
  },
  userManagement: {
    primary: "guest",
    note: "Guest accounts shown here were created via B2B Collaboration invitations. External Access (B2B Direct Connect) users do not appear in your directory.",
  },
  crossTenantAccess: {
    showBoth: true,
    note: "Cross-tenant access policies control both Guest Access (B2B Collaboration) and External Access (B2B Direct Connect). These are separate settings layers that can be configured independently.",
  },
  externalCollaboration: {
    primary: "guest",
    note: "External Collaboration settings control Guest Access (B2B Collaboration) only — who can invite guests, which domains are allowed, and what permissions guests have. These settings do not affect External Access (B2B Direct Connect) for shared channels, which is controlled by cross-tenant access policies.",
  },
  teamsGuestSettings: {
    primary: "guest",
    note: "These settings control whether guest users (B2B Collaboration) can use Teams. Shared channel access for external users (B2B Direct Connect) is controlled separately by cross-tenant access policies.",
  },
};
```

**Step 2: Commit**

```bash
git add src/data/accessTypes.js
git commit -m "feat: add access type taxonomy data layer for guest vs external coaching"
```

---

### Task 2: Create CippAccessTypeGuide Component

**Files:**
- Create: `src/components/CippComponents/CippAccessTypeGuide.jsx`

**Step 1: Create the component with all three variants**

```jsx
import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { ExpandMore, ExpandLess, OpenInNew, InfoOutlined } from "@mui/icons-material";
import Link from "next/link";
import { ACCESS_TYPES, ACCESS_TYPE_CONTEXTS } from "../../data/accessTypes";

const SettingsLinks = ({ links }) => {
  if (!links?.length) return null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} passHref legacyBehavior>
          <Button
            component="a"
            size="small"
            variant="outlined"
            endIcon={<OpenInNew fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            {link.label}
          </Button>
        </Link>
      ))}
    </Stack>
  );
};

const AccessTypeColumn = ({ typeKey, highlighted }) => {
  const t = ACCESS_TYPES[typeKey];
  if (!t) return null;
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 1,
        border: "1px solid",
        borderColor: highlighted ? `${t.chipColor}.main` : "divider",
        bgcolor: highlighted ? (theme) => theme.palette[t.chipColor]?.main + "08" : "transparent",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Chip
          label={t.label}
          size="small"
          color={t.chipColor}
          variant={highlighted ? "filled" : "outlined"}
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {t.microsoftTerm}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t.shortDescription}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {t.characteristics.map((item, i) => (
          <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5, fontSize: "0.8rem" }}>
            {item}
          </Typography>
        ))}
      </Box>
      <SettingsLinks links={t.settingsLinks} />
    </Box>
  );
};

const ChipVariant = ({ type }) => {
  const t = ACCESS_TYPES[type];
  if (!t) return null;
  return (
    <Tooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t.label} ({t.microsoftTerm})
          </Typography>
          <Typography variant="body2">{t.shortDescription}</Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Chip
        icon={<InfoOutlined sx={{ fontSize: 14 }} />}
        label={t.label}
        size="small"
        color={t.chipColor}
        variant="outlined"
        sx={{ height: 22, fontSize: "0.7rem", "& .MuiChip-label": { px: 0.5 } }}
      />
    </Tooltip>
  );
};

const BannerVariant = ({ type, context, showSettingsLinks }) => {
  const t = ACCESS_TYPES[type];
  const ctx = context ? ACCESS_TYPE_CONTEXTS[context] : null;
  if (!t) return null;

  const description = ctx?.note || t.fullDescription;
  const severity = t.chipColor === "warning" ? "warning" : "info";

  return (
    <Alert severity={severity} variant="outlined" sx={{ mb: 2 }}>
      <AlertTitle>
        {t.label} ({t.microsoftTerm})
      </AlertTitle>
      <Typography variant="body2">{description}</Typography>
      {showSettingsLinks && <SettingsLinks links={t.settingsLinks} />}
    </Alert>
  );
};

const PanelVariant = ({ context, showSettingsLinks }) => {
  const [expanded, setExpanded] = useState(false);
  const ctx = context ? ACCESS_TYPE_CONTEXTS[context] : null;

  const typesToShow = ctx?.showBoth
    ? ["guest", "external"]
    : ctx?.secondary
      ? [ctx.primary, ctx.secondary]
      : ctx?.primary
        ? [ctx.primary, ctx.primary === "guest" ? "external" : "guest"]
        : ["guest", "external"];

  const primaryType = ctx?.primary || null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfoOutlined fontSize="small" color="info" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Understanding Access Types: Guest Access vs External Access
          </Typography>
        </Stack>
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>
      <Collapse in={expanded} unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {ctx?.note && (
            <Alert severity="info" variant="standard" sx={{ mb: 2 }}>
              <Typography variant="body2">{ctx.note}</Typography>
            </Alert>
          )}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {typesToShow.map((typeKey) => (
              <AccessTypeColumn
                key={typeKey}
                typeKey={typeKey}
                highlighted={primaryType === typeKey || ctx?.showBoth}
              />
            ))}
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

/**
 * Reusable access type coaching component with three rendering modes.
 *
 * @param {"guest"|"external"} type - Which access type (for chip/banner variants)
 * @param {"chip"|"banner"|"panel"} variant - Rendering mode
 * @param {string} [context] - Context key from ACCESS_TYPE_CONTEXTS
 * @param {boolean} [showSettingsLinks=true] - Whether to show navigation links to settings pages
 */
const CippAccessTypeGuide = ({ type, variant = "chip", context, showSettingsLinks = true }) => {
  switch (variant) {
    case "chip":
      return <ChipVariant type={type} />;
    case "banner":
      return <BannerVariant type={type} context={context} showSettingsLinks={showSettingsLinks} />;
    case "panel":
      return <PanelVariant context={context} showSettingsLinks={showSettingsLinks} />;
    default:
      return null;
  }
};

export default CippAccessTypeGuide;
```

**Step 2: Commit**

```bash
git add src/components/CippComponents/CippAccessTypeGuide.jsx
git commit -m "feat: add CippAccessTypeGuide component with chip, banner, and panel variants"
```

---

### Task 3: Integrate into Teams Detail Page

**Files:**
- Modify: `src/pages/teams-share/teams/list-team/team-details.js`

This is the highest-impact surface. Four changes:

**Step 1: Add import**

At the top of the file, add:
```javascript
import CippAccessTypeGuide from "../../../../components/CippComponents/CippAccessTypeGuide";
```

**Step 2: Replace guest chips on owner rows (around line 1059-1068)**

Replace the hardcoded guest `<Chip>` in the Owners table Cell renderer with:
```jsx
{isGuest && (
  <CippAccessTypeGuide type="guest" variant="chip" />
)}
```

**Step 3: Replace guest chips on member rows (around line 1121-1129)**

Same replacement in the Members table Cell renderer:
```jsx
{isGuest && (
  <CippAccessTypeGuide type="guest" variant="chip" />
)}
```

**Step 4: Update the Add Channel Member section (around lines 333-401)**

Replace the `getConfirmText()` function and `addChannelMemberApi.confirmText` with a `confirmContent` approach. If `CippApiDialog` only accepts a string for `confirmText`, keep the string but make it access-type-aware. Otherwise, update the confirm text strings:

For the `getConfirmText()` function (lines 380-388):
```javascript
const getConfirmText = () => {
  if (isSharedChannel) {
    return `Add a user or external member to the '${channel.displayName}' shared channel. This uses External Access (B2B Direct Connect) — external users access the channel from their own tenant, no guest account is created. Only work or school accounts are supported; personal emails (Gmail, etc.) cannot be added to shared channels.`;
  }
  if (isPrivateChannel) {
    return `Add a user or external guest to the '${channel.displayName}' private channel. This uses Guest Access (B2B Collaboration) — external email addresses will be invited as guest accounts in the tenant. Both organizational and personal emails (Gmail, Outlook.com) are supported.`;
  }
  return `Add a user to the '${channel.displayName}' channel.`;
};
```

**Step 5: Add panel to channel member section**

In the `ChannelMembersSection` component, before the channel members table, add a panel when the channel is shared or private. Find where the channel member table is rendered and add above it:

```jsx
{(channel.membershipType === "shared" || channel.membershipType === "private") && (
  <Box sx={{ px: 2, pt: 1 }}>
    <CippAccessTypeGuide
      variant="panel"
      context={channel.membershipType === "shared" ? "teamsSharedChannel" : "teamsPrivateChannel"}
    />
  </Box>
)}
```

**Step 6: Commit**

```bash
git add src/pages/teams-share/teams/list-team/team-details.js
git commit -m "feat: add access type coaching to Teams detail page (chips, banners, panels)"
```

---

### Task 4: Integrate into Guest Invite Components

**Files:**
- Modify: `src/components/CippComponents/CippGuestInviteDialog.jsx`
- Modify: `src/components/CippComponents/CippInviteGuestDrawer.jsx`
- Modify: `src/components/CippComponents/CippBulkInviteGuestDrawer.jsx`

**Step 1: CippGuestInviteDialog — add import and banner**

Add import at top:
```javascript
import CippAccessTypeGuide from "./CippAccessTypeGuide";
```

After the dialog subtitle text (around line 404-408 where the description is), add:
```jsx
<CippAccessTypeGuide
  type="guest"
  variant="banner"
  context={isTeamsMode ? "teamsStandardChannel" : "sharepoint"}
  showSettingsLinks={false}
/>
```

**Step 2: CippInviteGuestDrawer — add import and banner**

Add import at top:
```javascript
import CippAccessTypeGuide from "./CippAccessTypeGuide";
```

Inside the `<CippOffCanvas>`, before the `<Grid container>` (around line 108), add:
```jsx
<Box sx={{ mb: 2 }}>
  <CippAccessTypeGuide
    type="guest"
    variant="banner"
    context="userManagement"
    showSettingsLinks={false}
  />
</Box>
```

**Step 3: CippBulkInviteGuestDrawer — add import and banner**

Same pattern. Add import at top:
```javascript
import CippAccessTypeGuide from "./CippAccessTypeGuide";
```

Inside the `<CippOffCanvas>`, before the `<Grid container>` (around line 176), add:
```jsx
<Box sx={{ mb: 2 }}>
  <CippAccessTypeGuide
    type="guest"
    variant="banner"
    context="userManagement"
    showSettingsLinks={false}
  />
</Box>
```

**Step 4: Commit**

```bash
git add src/components/CippComponents/CippGuestInviteDialog.jsx src/components/CippComponents/CippInviteGuestDrawer.jsx src/components/CippComponents/CippBulkInviteGuestDrawer.jsx
git commit -m "feat: add guest access coaching banners to invite dialogs"
```

---

### Task 5: Integrate into SharePoint Site Detail Page

**Files:**
- Modify: `src/pages/teams-share/sharepoint/site-details.js`

**Step 1: Add import**

```javascript
import CippAccessTypeGuide from "../../../components/CippComponents/CippAccessTypeGuide";
```

**Step 2: Replace guest chips on member rows (around line 593-601)**

Replace the hardcoded `<Chip>` for guest users with:
```jsx
{isGuest && (
  <CippAccessTypeGuide type="guest" variant="chip" />
)}
```

**Step 3: Commit**

```bash
git add src/pages/teams-share/sharepoint/site-details.js
git commit -m "feat: add access type coaching chips to SharePoint site detail page"
```

---

### Task 6: Integrate into User Management Page

**Files:**
- Modify: `src/pages/identity/administration/users/index.js`

**Step 1: Update the userType chip indicator (around line 452-459)**

The current chip config uses a simple `conditions` object:
```javascript
{
  field: "userType",
  tooltip: "Guest User",
  iconOnly: true,
  conditions: {
    Guest: { label: "Guest", color: "secondary", icon: <PersonAddAlt1 fontSize="small" /> },
  },
}
```

Change the tooltip to include coaching:
```javascript
{
  field: "userType",
  tooltip: "Guest Account (B2B Collaboration) — this user was invited to the tenant as a guest. External Access (B2B Direct Connect) users do not appear in the directory.",
  iconOnly: true,
  conditions: {
    Guest: { label: "Guest", color: "secondary", icon: <PersonAddAlt1 fontSize="small" /> },
  },
}
```

**Step 2: Commit**

```bash
git add src/pages/identity/administration/users/index.js
git commit -m "feat: add access type coaching tooltip to user management guest indicator"
```

---

### Task 7: Integrate into Cross-Tenant Access Pages

**Files:**
- Modify: `src/pages/tenant/administration/cross-tenant-access/index.js`
- Modify: `src/pages/tenant/administration/cross-tenant-access/external-collaboration.js`

**Step 1: Cross-Tenant Access index — add import and panel**

Add import:
```javascript
import CippAccessTypeGuide from "../../../../components/CippComponents/CippAccessTypeGuide";
```

After the page subtitle (around line 293), add:
```jsx
<CippAccessTypeGuide variant="panel" context="crossTenantAccess" />
```

**Step 2: External Collaboration — add import and banner**

Add import:
```javascript
import CippAccessTypeGuide from "../../../../components/CippComponents/CippAccessTypeGuide";
```

After the `<CippApiResults>` (around line 283), before the fetching check, add:
```jsx
<CippAccessTypeGuide
  type="guest"
  variant="banner"
  context="externalCollaboration"
/>
```

**Step 3: Commit**

```bash
git add src/pages/tenant/administration/cross-tenant-access/index.js src/pages/tenant/administration/cross-tenant-access/external-collaboration.js
git commit -m "feat: add access type coaching to cross-tenant access pages"
```

---

### Task 8: Integrate into Teams Settings Page

**Files:**
- Modify: `src/pages/teams-share/teams/teams-settings.js`

**Step 1: Add import**

```javascript
import CippAccessTypeGuide from "../../../components/CippComponents/CippAccessTypeGuide";
```

**Step 2: Add banner to Guest & Cloud Storage tab**

In the Guest & Cloud Storage tab content (Tab index 1), at the top of that tab panel's content, add:
```jsx
<CippAccessTypeGuide
  type="guest"
  variant="banner"
  context="teamsGuestSettings"
/>
```

**Step 3: Commit**

```bash
git add src/pages/teams-share/teams/teams-settings.js
git commit -m "feat: add guest access coaching banner to Teams settings page"
```

---

### Task 9: Update Standards helpText

**Files:**
- Modify: `src/data/standards.json`

**Step 1: Update GuestInvite helpText (line 1123)**

From:
```
"This setting controls who can invite guests to your directory to collaborate on resources secured by your company, such as SharePoint sites or Azure resources."
```
To:
```
"This setting controls who can invite guests to your directory to collaborate on resources secured by your company, such as SharePoint sites or Azure resources. This applies to Guest Access (B2B Collaboration) only. External Access (B2B Direct Connect) for Teams shared channels is controlled by cross-tenant access policies."
```

**Step 2: Update TeamsGuestAccess helpText (line 4805)**

From:
```
"Allow guest users access to teams."
```
To:
```
"Allow guest users access to teams. This controls Guest Access (B2B Collaboration) in Teams. Shared channel access for external users (B2B Direct Connect) is controlled separately by cross-tenant access policies."
```

**Step 3: Update ExternalMFATrusted helpText (line 805)**

From:
```
"Sets the state of the Cross-tenant access setting to trust external MFA. This allows guest users to use their home tenant MFA to access your tenant."
```
To:
```
"Sets the state of the Cross-tenant access setting to trust external MFA. This allows guest users to use their home tenant MFA to access your tenant. Applies to Guest Access (B2B Collaboration) users. External Access (B2B Direct Connect) users authenticate entirely in their home tenant."
```

**Step 4: Update SPAzureB2B helpText (line 4187)**

From:
```
"Ensure SharePoint and OneDrive integration with Azure AD B2B is enabled"
```
To:
```
"Ensure SharePoint and OneDrive integration with Azure AD B2B is enabled. This enables Guest Access (B2B Collaboration) for SharePoint and OneDrive, allowing external users to be invited as guests."
```

**Step 5: Commit**

```bash
git add src/data/standards.json
git commit -m "feat: add access type context to guest-related standards helpText"
```

---

### Task 10: Update Backend Success and Error Messages

**Files:**
- Modify: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Teams-Sharepoint/Invoke-ExecTeamAction.ps1`
- Modify: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Teams-Sharepoint/Invoke-ExecSharePointInviteGuest.ps1`
- Modify: `CIPP-API/Modules/CIPPCore/Public/Entrypoints/HTTP Functions/Identity/Administration/Users/Invoke-AddGuest.ps1`

**Step 1: Invoke-ExecTeamAction.ps1 — update AddChannelMember messages (around line 248-254)**

From:
```powershell
$Message = if ($GuestInvited) {
    "Successfully invited guest '$OriginalInput' and added as $ChannelRole to channel '$ChannelLabel' in team '$TeamLabel'"
} elseif ($ExternalTenantId) {
    "Successfully added external user '$OriginalInput' as $ChannelRole to shared channel '$ChannelLabel' in team '$TeamLabel' via B2B direct connect"
} else {
    "Successfully added $ChannelRole to channel '$ChannelLabel' in team '$TeamLabel'"
}
```

To:
```powershell
$Message = if ($GuestInvited) {
    "Successfully invited guest '$OriginalInput' and added as $ChannelRole to channel '$ChannelLabel' in team '$TeamLabel' (Guest Access — B2B Collaboration)"
} elseif ($ExternalTenantId) {
    "Successfully added external user '$OriginalInput' as $ChannelRole to shared channel '$ChannelLabel' in team '$TeamLabel' (External Access — B2B Direct Connect)"
} else {
    "Successfully added $ChannelRole to channel '$ChannelLabel' in team '$TeamLabel'"
}
```

**Step 2: Invoke-ExecTeamAction.ps1 — update shared channel personal email error (around line 208)**

From:
```powershell
throw "The domain '$EmailDomain' does not belong to a Microsoft 365 organization. Shared channels require a work or school account."
```

To:
```powershell
throw "The domain '$EmailDomain' does not belong to a Microsoft 365 organization. Shared channels use External Access (B2B Direct Connect) which requires a work or school account. To add users with personal email addresses (Gmail, Outlook.com, etc.), use a standard or private channel instead — these use Guest Access (B2B Collaboration) which supports personal emails."
```

**Step 3: Invoke-ExecSharePointInviteGuest.ps1 — update success messages (around lines 33-35)**

From:
```powershell
$ResultMessages.Add("Invited guest $($Request.Body.displayName) ($($Request.Body.mail)) with email invite.")
```
To:
```powershell
$ResultMessages.Add("Invited guest $($Request.Body.displayName) ($($Request.Body.mail)) with email invite (Guest Access — B2B Collaboration).")
```

And:
```powershell
$ResultMessages.Add("Invited guest $($Request.Body.displayName) ($($Request.Body.mail)) without email invite (Guest Access — B2B Collaboration).")
```

**Step 4: Invoke-AddGuest.ps1 — update success messages (around lines 41-43)**

From:
```powershell
$Result = "Invited Guest $($DisplayName) with Email Invite"
```
To:
```powershell
$Result = "Invited Guest $($DisplayName) with Email Invite (Guest Access — B2B Collaboration)"
```

And:
```powershell
$Result = "Invited Guest $($DisplayName) with no Email Invite (Guest Access — B2B Collaboration)"
```

**Step 5: Commit**

```bash
cd /path/to/CIPP-API
git add Modules/CIPPCore/Public/Entrypoints/HTTP\ Functions/Teams-Sharepoint/Invoke-ExecTeamAction.ps1 Modules/CIPPCore/Public/Entrypoints/HTTP\ Functions/Teams-Sharepoint/Invoke-ExecSharePointInviteGuest.ps1 Modules/CIPPCore/Public/Entrypoints/HTTP\ Functions/Identity/Administration/Users/Invoke-AddGuest.ps1
git commit -m "feat: add access type labels to guest/external success and error messages"
```
