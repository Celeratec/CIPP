import { CippTablePage } from "/src/components/CippComponents/CippTablePage.jsx";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useSettings } from "/src/hooks/use-settings.js";
import { PermissionButton } from "../../../../utils/permissions";
import { useCippUserActions } from "/src/components/CippComponents/CippUserActions.jsx";
import { CippInviteGuestDrawer } from "/src/components/CippComponents/CippInviteGuestDrawer.jsx";
import { CippBulkUserDrawer } from "/src/components/CippComponents/CippBulkUserDrawer.jsx";
import { CippAddUserDrawer } from "/src/components/CippComponents/CippAddUserDrawer.jsx";
import { CippApiLogsDrawer } from "/src/components/CippComponents/CippApiLogsDrawer.jsx";
import { Box, useMediaQuery, useTheme } from "@mui/material";

const Page = () => {
  const userActions = useCippUserActions();
  const pageTitle = "Users";
  const tenant = useSettings().currentTenant;
  const cardButtonPermissions = ["Identity.User.ReadWrite"];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Mobile card view configuration
  const mobileCardConfig = {
    title: "displayName",
    subtitle: "userPrincipalName",
    avatar: {
      field: "displayName",
    },
    badges: [
      {
        field: "accountEnabled",
        conditions: {
          true: { icon: "check", color: "success" },
          false: { icon: "cancel", color: "error" },
          Yes: { icon: "check", color: "success" },
          No: { icon: "cancel", color: "error" },
        },
      },
    ],
    extraFields: [
      { field: "jobTitle" },
      { field: "department" },
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
  ];

  const offCanvas = {
    extendedInfoFields: [
      "userPrincipalName", // UPN
      "displayName", // Display Name
      "mail", // Mail
      "accountEnabled", // Account Status
      "userType", // User Type
      "givenName", // Given Name
      "surname", // Surname
      "jobTitle", // Job Title
      "department", // Department
      "companyName", // Company
      "officeLocation", // Office
      "city", // City
      "country", // Country
      "businessPhones", // Business Phone
      "mobilePhone", // Mobile Phone
      "assignedLicenses", // Licenses
      "proxyAddresses", // Proxy Addresses
      "otherMails", // Alternate Email Addresses
      "createdDateTime", // Created Date (UTC)
      "onPremisesSyncEnabled", // AD Sync Enabled
      "onPremisesLastSyncDateTime", // OnPrem Last Sync
      "onPremisesDistinguishedName", // OnPrem DN
      "id", // Unique ID
    ],
    actions: userActions,
    size: "md", // Medium width for more detail space
  };

  // Show fewer columns on mobile, more on desktop
  // Users can always click a row to see full details in the off-canvas
  const simpleColumns = isMobile 
    ? ["displayName", "accountEnabled"] // Minimal on mobile
    : ["displayName", "userPrincipalName", "mail", "accountEnabled"]; // Essential on desktop

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
          "id,accountEnabled,businessPhones,city,createdDateTime,companyName,country,department,displayName,faxNumber,givenName,isResourceAccount,jobTitle,mail,mailNickname,mobilePhone,officeLocation,otherMails,postalCode,preferredDataLocation,preferredLanguage,proxyAddresses,showInAddressList,state,streetAddress,surname,usageLocation,userPrincipalName,userType,assignedLicenses,onPremisesSyncEnabled,OnPremisesImmutableId,onPremisesLastSyncDateTime,onPremisesDistinguishedName",
        $count: true,
        $orderby: "displayName",
        $top: 999,
      }}
      apiDataKey="Results"
      actions={userActions}
      offCanvas={offCanvas}
      offCanvasOnRowClick={true}
      simpleColumns={simpleColumns}
      filters={filters}
      mobileCardConfig={mobileCardConfig}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
