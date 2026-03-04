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
