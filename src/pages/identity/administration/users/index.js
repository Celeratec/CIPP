import { CippTablePage } from "/src/components/CippComponents/CippTablePage.jsx";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useSettings } from "/src/hooks/use-settings.js";
import { ApiGetCall } from "/src/api/ApiCall";
import { PermissionButton } from "../../../../utils/permissions";
import { CippInviteGuestDrawer } from "/src/components/CippComponents/CippInviteGuestDrawer.jsx";
import { CippBulkUserDrawer } from "/src/components/CippComponents/CippBulkUserDrawer.jsx";
import { CippAddUserDrawer } from "/src/components/CippComponents/CippAddUserDrawer.jsx";
import { CippApiLogsDrawer } from "/src/components/CippComponents/CippApiLogsDrawer.jsx";
import { useCippUserActions } from "/src/components/CippComponents/CippUserActions";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import {
  Email,
  Phone,
  Business,
  LocationOn,
  Badge,
  Work,
  WorkspacePremium,
  Group,
  PersonAddAlt1,
  RemoveCircleOutline,
} from "@mui/icons-material";

const Page = () => {
  const router = useRouter();
  const pageTitle = "Users";
  const tenant = useSettings().currentTenant;
  const cardButtonPermissions = ["Identity.User.ReadWrite"];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userActions = useCippUserActions();

  const mailboxRequest = ApiGetCall({
    url: "/api/ListMailboxes",
    queryKey: `ListMailboxes-${tenant}`,
    waiting: !!tenant && tenant !== "AllTenants",
  });

  const sharedMailboxSet = useMemo(() => {
    const raw =
      mailboxRequest.data?.Results ||
      mailboxRequest.data?.results ||
      mailboxRequest.data?.value ||
      mailboxRequest.data ||
      [];
    const list = Array.isArray(raw) ? raw : [];
    const shared = list.filter((item) => item?.recipientTypeDetails === "SharedMailbox");
    return new Set(
      shared
        .map((item) =>
          (
            item?.UPN ||
            item?.primarySmtpAddress ||
            item?.userPrincipalName ||
            item?.mail ||
            ""
          ).toLowerCase()
        )
        .filter(Boolean)
    );
  }, [mailboxRequest.data]);

  const isSharedMailbox = useCallback(
    (item) => {
      if (!sharedMailboxSet.size) return false;
      const key = (item?.userPrincipalName || item?.mail || "").toLowerCase();
      return !!key && sharedMailboxSet.has(key);
    },
    [sharedMailboxSet]
  );


  // Custom sort: Licensed users first (alphabetically by surname), then unlicensed (alphabetically by surname)
  const userSortFn = (a, b) => {
    const aLicensed = a.assignedLicenses && a.assignedLicenses.length > 0;
    const bLicensed = b.assignedLicenses && b.assignedLicenses.length > 0;
    
    // Licensed users come first
    if (aLicensed && !bLicensed) return -1;
    if (!aLicensed && bLicensed) return 1;
    
    // Within same license status, sort by surname then givenName
    const aSurname = (a.surname || a.displayName || "").toLowerCase();
    const bSurname = (b.surname || b.displayName || "").toLowerCase();
    
    if (aSurname !== bSurname) {
      return aSurname.localeCompare(bSurname);
    }
    
    // If surnames are the same, sort by given name
    const aGiven = (a.givenName || "").toLowerCase();
    const bGiven = (b.givenName || "").toLowerCase();
    return aGiven.localeCompare(bGiven);
  };

  // Navigate to user detail page on card click
  const handleCardClick = (user) => {
    router.push(`/identity/administration/users/user?userId=${user.id}`);
  };

  // Card view configuration with comprehensive user info
  const cardConfig = {
    title: "displayName",
    avatar: {
      field: "displayName",
      photoField: false,
    },
    sortFn: userSortFn,
    badges: [
      {
        field: "accountEnabled",
        tooltip: "Account Status",
        conditions: {
          true: { icon: "check", color: "success" },
          false: { icon: "cancel", color: "error" },
          Yes: { icon: "check", color: "success" },
          No: { icon: "cancel", color: "error" },
        },
      },
      {
        field: "assignedLicenses",
        tooltip: "License Status",
        iconOnly: true,
        conditions: {
          licensed: { label: "Licensed", color: "primary", icon: <WorkspacePremium fontSize="small" /> },
          unlicensed: { label: "Unlicensed", color: "error", icon: <WorkspacePremium fontSize="small" /> },
        },
        transform: (value) => (value && value.length > 0 ? "licensed" : "unlicensed"),
      },
      {
        field: "userType",
        tooltip: "Guest User",
        iconOnly: true,
        conditions: {
          Guest: { label: "Guest", color: "secondary", icon: <PersonAddAlt1 fontSize="small" /> },
        },
      },
      {
        field: "mail",
        tooltip: "Mail Enabled",
        iconOnly: true,
        conditions: {
          enabled: { label: "Mail enabled", color: "success", icon: <Email fontSize="small" /> },
          disabled: { label: "Not mail enabled", color: "error", icon: <Email fontSize="small" /> },
        },
        transform: (value, item) =>
          value || (item?.proxyAddresses && item.proxyAddresses.length > 0) ? "enabled" : "disabled",
      },
      {
        field: "userPrincipalName",
        tooltip: "Shared Mailbox",
        iconOnly: true,
        conditions: {
          SharedMailbox: { label: "Shared", color: "secondary", icon: <Group fontSize="small" /> },
        },
        transform: (_value, item) => (isSharedMailbox(item) ? "SharedMailbox" : null),
      },
    ],
    // Fields shown on both mobile and desktop
    extraFields: [
      { field: "companyName", icon: <Badge /> },
      { field: "jobTitle", icon: <Work /> },
      { field: "department", icon: <Business /> },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "mail", label: "Email", icon: <Email />, linkType: "email" },
      { field: "mobilePhone", label: "Mobile", icon: <Phone />, linkType: "tel" },
      { field: "officeLocation", label: "Office", icon: <LocationOn /> },
    ],
    extraFieldsMax: 3,
    desktopFieldsLayout: "column",
    desktopFieldsMax: 4,
    // Mobile quick actions: 7 buttons, omit "View User" (card click opens it)
    mobileQuickActions: [
      "Reset Password",
      "Create Temporary Access Password",
      "Re-require MFA registration",
      "Set Per-User MFA",
      "Revoke all user sessions",
      "Manage Licenses",
      "Add to Group",
    ],
    maxQuickActions: 8,
    cardGridProps: {
      md: 6,
      lg: 4,
    },
  };

  const filters = [
    {
      filterName: "Account Enabled",
      value: [{ id: "accountEnabled", value: "Yes" }],
      type: "column",
    },
    {
      filterName: "Account Disabled",
      value: [{ id: "accountEnabled", value: "No" }],
      type: "column",
    },
    {
      filterName: "Guest Accounts",
      value: [{ id: "userType", value: "Guest" }],
      type: "column",
    },
    {
      filterName: "Members Only",
      value: [{ id: "userType", value: "Member" }],
      type: "column",
    },
  ];

  // Show fewer columns on mobile, more on desktop (for table view)
  const simpleColumns = isMobile 
    ? ["displayName", "accountEnabled"]
    : ["displayName", "userPrincipalName", "mail", "accountEnabled"];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListGraphRequest"
      cardButton={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <CippAddUserDrawer
            requiredPermissions={cardButtonPermissions}
            PermissionButton={PermissionButton}
          />
          <CippBulkUserDrawer
            requiredPermissions={cardButtonPermissions}
            PermissionButton={PermissionButton}
          />
          <CippInviteGuestDrawer
            requiredPermissions={cardButtonPermissions}
            PermissionButton={PermissionButton}
          />
          <CippApiLogsDrawer
            apiFilter="(?<!Scheduler_)User"
            buttonText="View Logs"
            title="User Logs"
            PermissionButton={PermissionButton}
            tenantFilter={tenant}
          />
        </Box>
      }
      apiData={{
        Endpoint: "users",
        manualPagination: true,
        $select:
          "id,accountEnabled,businessPhones,city,createdDateTime,companyName,country,department,displayName,faxNumber,givenName,isResourceAccount,jobTitle,mail,mailNickname,mobilePhone,officeLocation,otherMails,postalCode,preferredDataLocation,preferredLanguage,proxyAddresses,showInAddressList,state,streetAddress,surname,usageLocation,userPrincipalName,userType,assignedLicenses,licenseAssignmentStates,onPremisesSyncEnabled,OnPremisesImmutableId,onPremisesLastSyncDateTime,onPremisesDistinguishedName",
        $count: true,
        $orderby: "displayName",
        $top: 999,
      }}
      apiDataKey="Results"
      actions={userActions}
      offCanvasOnRowClick={false}
      onCardClick={handleCardClick}
      simpleColumns={simpleColumns}
      filters={filters}
      cardConfig={cardConfig}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
