import { CippTablePage } from "/src/components/CippComponents/CippTablePage.jsx";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useSettings } from "/src/hooks/use-settings.js";
import { PermissionButton } from "../../../../utils/permissions";
import { CippInviteGuestDrawer } from "/src/components/CippComponents/CippInviteGuestDrawer.jsx";
import { CippBulkUserDrawer } from "/src/components/CippComponents/CippBulkUserDrawer.jsx";
import { CippAddUserDrawer } from "/src/components/CippComponents/CippAddUserDrawer.jsx";
import { CippApiLogsDrawer } from "/src/components/CippComponents/CippApiLogsDrawer.jsx";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import {
  Email,
  Phone,
  Business,
  LocationOn,
  Badge,
  Work,
  Edit,
  CloudDone,
  LockReset,
  LockPerson,
  PhonelinkSetup,
  Password,
} from "@mui/icons-material";
import { EyeIcon } from "@heroicons/react/24/outline";

const Page = () => {
  const router = useRouter();
  const pageTitle = "Users";
  const tenant = useSettings().currentTenant;
  const cardButtonPermissions = ["Identity.User.ReadWrite"];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Quick actions for cards - most useful actions organized logically
  // Order: View/Edit first, then common tasks, then security actions
  const cardQuickActions = [
    // View & Edit
    {
      label: "View User",
      link: "/identity/administration/users/user?userId=[id]",
      icon: <EyeIcon />,
      color: "info",
      category: "view",
      quickAction: true,
    },
    {
      label: "Edit User",
      link: "/identity/administration/users/user/edit?userId=[id]",
      icon: <Edit />,
      color: "success",
      category: "edit",
      quickAction: true,
    },
    // Common Tasks
    {
      label: "Manage Licenses",
      type: "POST",
      url: "/api/ExecBulkLicense",
      icon: <CloudDone />,
      data: { userIds: "id" },
      multiPost: true,
      fields: [
        {
          type: "radio",
          name: "LicenseOperation",
          label: "License Operation",
          options: [
            { label: "Add Licenses", value: "Add" },
            { label: "Remove Licenses", value: "Remove" },
            { label: "Replace Licenses", value: "Replace" },
          ],
          validators: { required: "Please select a license operation" },
        },
        {
          type: "switch",
          name: "RemoveAllLicenses",
          label: "Remove All Existing Licenses",
        },
        {
          type: "autoComplete",
          name: "Licenses",
          label: "Select Licenses",
          multiple: true,
          creatable: false,
          api: {
            url: "/api/ListLicenses",
            labelField: (option) => option?.skuPartNumber || option?.skuId,
            valueField: "skuId",
            queryKey: `licenses-${tenant}`,
          },
        },
      ],
      confirmText: "Manage licenses for [displayName]",
      category: "edit",
      quickAction: true,
    },
    // Security Actions
    {
      label: "Reset Password",
      type: "POST",
      icon: <LockReset />,
      url: "/api/ExecResetPass",
      data: { ID: "userPrincipalName", displayName: "displayName" },
      fields: [
        {
          type: "switch",
          name: "MustChange",
          label: "Must Change Password at Next Logon",
        },
      ],
      confirmText: "Reset password for [displayName]?",
      category: "security",
      quickAction: true,
    },
    {
      label: "Set Per-User MFA",
      type: "POST",
      icon: <LockPerson />,
      url: "/api/ExecPerUserMFA",
      data: { userId: "id", userPrincipalName: "userPrincipalName" },
      fields: [
        {
          type: "autoComplete",
          name: "State",
          label: "MFA State",
          options: [
            { label: "Enforced", value: "Enforced" },
            { label: "Enabled", value: "Enabled" },
            { label: "Disabled", value: "Disabled" },
          ],
          multiple: false,
          creatable: false,
          validators: { required: "Please select an MFA state" },
        },
      ],
      confirmText: "Set MFA state for [displayName]",
      category: "security",
      quickAction: true,
    },
    {
      label: "Re-require MFA Registration",
      type: "POST",
      icon: <PhonelinkSetup />,
      url: "/api/ExecResetMFA",
      data: { ID: "userPrincipalName" },
      confirmText: "Re-require MFA registration for [displayName]?",
      category: "security",
      quickAction: true,
    },
    {
      label: "Create Temporary Access Password",
      type: "POST",
      icon: <Password />,
      url: "/api/ExecCreateTAP",
      data: { ID: "userPrincipalName" },
      fields: [
        {
          type: "number",
          name: "lifetimeInMinutes",
          label: "Lifetime (Minutes)",
          placeholder: "Leave blank for default",
        },
        {
          type: "switch",
          name: "isUsableOnce",
          label: "One-time use only",
        },
      ],
      confirmText: "Create TAP for [displayName]?",
      category: "security",
      quickAction: true,
    },
  ];

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
    subtitle: "userPrincipalName",
    avatar: {
      field: "displayName",
      photoField: true, // Enable profile photo display
    },
    cardHeight: 320, // Increased for quick actions
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
        conditions: {
          licensed: { label: "Licensed", color: "primary" },
          unlicensed: { label: "Unlicensed", color: "default" },
        },
        transform: (value) => (value && value.length > 0 ? "licensed" : "unlicensed"),
      },
    ],
    // Fields shown on both mobile and desktop
    extraFields: [
      { field: "jobTitle", icon: <Work /> },
      { field: "department", icon: <Business /> },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "mail", label: "Email", icon: <Email /> },
      { field: "mobilePhone", label: "Mobile", icon: <Phone /> },
      { field: "officeLocation", label: "Office", icon: <LocationOn /> },
      { field: "companyName", label: "Company", icon: <Badge /> },
    ],
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
      actions={cardQuickActions}
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
