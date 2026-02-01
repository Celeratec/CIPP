import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { useSettings } from "../../../../hooks/use-settings.js";
import { ApiGetCall } from "../../../../api/ApiCall";
import { PermissionButton } from "../../../../utils/permissions";
import { CippInviteGuestDrawer } from "../../../../components/CippComponents/CippInviteGuestDrawer.jsx";
import { CippBulkUserDrawer } from "../../../../components/CippComponents/CippBulkUserDrawer.jsx";
import { CippAddUserDrawer } from "../../../../components/CippComponents/CippAddUserDrawer.jsx";
import { CippApiLogsDrawer } from "../../../../components/CippComponents/CippApiLogsDrawer.jsx";
import { useCippUserActions } from "../../../../components/CippComponents/CippUserActions";
import { 
  Box, 
  Tooltip, 
  useMediaQuery, 
  useTheme,
  Paper,
  Avatar,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Stack } from "@mui/system";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import {
  Email,
  Phone,
  Smartphone,
  Business,
  LocationOn,
  Badge,
  Work,
  WorkspacePremium,
  Group,
  PersonAddAlt1,
  RemoveCircleOutline,
  Person,
  CheckCircle,
  Cancel,
  Sync,
  CalendarToday,
  Info as InfoIcon,
  VerifiedUser,
  Warning,
} from "@mui/icons-material";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import CippUserAvatar from "../../../../components/CippComponents/CippUserAvatar";

const Page = () => {
  const router = useRouter();
  const pageTitle = "Users";
  const tenant = useSettings().currentTenant;
  const cardButtonPermissions = ["Identity.User.ReadWrite"];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userActions = useCippUserActions();

  const mailboxRequest = ApiGetCall({
    url: `/api/ListMailboxes?tenantFilter=${tenant}`,
    queryKey: `ListMailboxes-${tenant}`,
    waiting: !!tenant && tenant !== "AllTenants",
  });

  // Get CAS mailbox settings to detect legacy protocols (IMAP/POP)
  const casMailboxRequest = ApiGetCall({
    url: `/api/ListCASMailboxes?tenantFilter=${tenant}`,
    queryKey: `ListCASMailboxes-${tenant}`,
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

  // Create a map of users with legacy protocols (IMAP/POP) enabled
  const legacyProtocolsMap = useMemo(() => {
    const raw =
      casMailboxRequest.data?.Results ||
      casMailboxRequest.data?.results ||
      casMailboxRequest.data?.value ||
      casMailboxRequest.data ||
      [];
    const list = Array.isArray(raw) ? raw : [];
    const map = new Map();
    list.forEach((item) => {
      if (item?.LegacyProtocolsEnabled) {
        const key = (item?.userPrincipalName || "").toLowerCase();
        if (key) {
          map.set(key, {
            imap: item?.ImapEnabled,
            pop: item?.PopEnabled,
          });
        }
      }
    });
    return map;
  }, [casMailboxRequest.data]);

  const hasLegacyProtocols = useCallback(
    (item) => {
      if (!legacyProtocolsMap.size) return null;
      const key = (item?.userPrincipalName || item?.mail || "").toLowerCase();
      return key ? legacyProtocolsMap.get(key) : null;
    },
    [legacyProtocolsMap]
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
        tooltip: "Exchange Settings",
        iconOnly: true,
        link: "/identity/administration/users/user/exchange?userId=[id]",
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
      { field: "mobilePhone", label: "Mobile", icon: <Smartphone />, linkType: "tel" },
      { 
        field: "businessPhones", 
        label: "Work", 
        icon: <Phone />, 
        linkType: "tel",
        formatter: (value) => Array.isArray(value) && value.length > 0 ? value[0] : value,
      },
      { field: "officeLocation", label: "Office", icon: <LocationOn /> },
    ],
    extraFieldsMax: 3,
    desktopFieldsLayout: "column",
    desktopFieldsMax: 5,
    // Mobile quick actions: 7 buttons
    mobileQuickActions: [
      "Reset Password",
      "Create Temporary Access Password",
      "Re-require MFA registration",
      "Set Per-User MFA",
      "Manage Licenses",
      "Add to Group",
      "Edit User",
    ],
    maxQuickActions: 8,
    cardGridProps: {
      md: 6,
      lg: 4,
    },
    // Custom content to show legacy protocol warnings
    customContent: (item) => {
      const legacyInfo = hasLegacyProtocols(item);
      if (!legacyInfo) return null;
      
      const protocols = [];
      if (legacyInfo.imap) protocols.push("IMAP");
      if (legacyInfo.pop) protocols.push("POP");
      
      if (protocols.length === 0) return null;
      
      return (
        <Tooltip title={`Insecure protocols enabled: ${protocols.join(" & ")}. These legacy protocols may bypass MFA protections. Click to view Exchange settings.`}>
          <Box
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/identity/administration/users/user/exchange?userId=${item.id}`);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
              border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              cursor: "pointer",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2),
              },
            }}
          >
            <Warning sx={{ fontSize: 14, color: "warning.main" }} />
            <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 500 }}>
              {protocols.join(" & ")} enabled
            </Typography>
          </Box>
        </Tooltip>
      );
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

  // Off-canvas panel configuration for user details flyout
  const offCanvas = {
    title: "User Details",
    size: "md",
    actions: userActions,
    children: (row) => {
      const isEnabled = row.accountEnabled;
      const isGuest = row.userType === "Guest";
      const hasLicenses = row.assignedLicenses && row.assignedLicenses.length > 0;
      const statusColor = isEnabled ? theme.palette.success.main : theme.palette.error.main;
      
      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(statusColor, 0.15)} 0%, ${alpha(statusColor, 0.05)} 100%)`,
              borderLeft: `4px solid ${statusColor}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <CippUserAvatar
                userId={row.id}
                tenantFilter={tenant}
                displayName={row.displayName}
                size={56}
                enablePhoto={true}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {row.displayName || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {row.userPrincipalName}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Status Badges */}
          <Box>
            <Typography 
              variant="overline" 
              color="text.secondary" 
              sx={{ fontWeight: 600, letterSpacing: 1, mb: 1.5, display: "block" }}
            >
              Account Status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignItems: "center" }}>
              <Chip
                icon={isEnabled ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                label={isEnabled ? "Enabled" : "Disabled"}
                color={isEnabled ? "success" : "error"}
                variant="filled"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={isGuest ? <PersonAddAlt1 fontSize="small" /> : <Person fontSize="small" />}
                label={isGuest ? "Guest" : "Member"}
                color={isGuest ? "warning" : "primary"}
                variant="outlined"
                size="small"
              />
              {hasLicenses && (
                <Chip
                  icon={<VerifiedUser fontSize="small" />}
                  label="Licensed"
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
              {row.onPremisesSyncEnabled && (
                <Chip
                  icon={<Sync fontSize="small" />}
                  label="Synced"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Contact Information */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Email fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Contact Information
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {row.mail && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {row.mail}
                  </Typography>
                </Stack>
              )}
              {row.mobilePhone && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Mobile</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.mobilePhone}
                  </Typography>
                </Stack>
              )}
              {row.businessPhones && row.businessPhones.length > 0 && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Business Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {Array.isArray(row.businessPhones) ? row.businessPhones[0] : row.businessPhones}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Organization */}
          {(row.jobTitle || row.department || row.companyName || row.officeLocation) && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Business fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Organization
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {row.jobTitle && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Job Title</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.jobTitle}
                      </Typography>
                    </Stack>
                  )}
                  {row.department && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.department}
                      </Typography>
                    </Stack>
                  )}
                  {row.companyName && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Company</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.companyName}
                      </Typography>
                    </Stack>
                  )}
                  {row.officeLocation && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Office</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.officeLocation}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {/* Location */}
          {(row.city || row.state || row.country) && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Location
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {(row.streetAddress || row.city || row.state || row.postalCode) && (
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                        {[row.streetAddress, row.city, row.state, row.postalCode].filter(Boolean).join(", ")}
                      </Typography>
                    </Stack>
                  )}
                  {row.country && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Country</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.country}
                      </Typography>
                    </Stack>
                  )}
                  {row.usageLocation && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Usage Location</Typography>
                      <Chip label={row.usageLocation} size="small" variant="outlined" />
                    </Stack>
                  )}
                </Stack>
              </Box>
            </>
          )}

          {/* Licensing */}
          {hasLicenses && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <WorkspacePremium fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Licenses ({row.assignedLicenses.length})
                  </Typography>
                </Stack>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {getCippFormatting(row.assignedLicenses, "assignedLicenses")}
                  </Typography>
                </Paper>
              </Box>
            </>
          )}

          <Divider />

          {/* Metadata */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Account Details
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {row.createdDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.createdDateTime, "createdDateTime")}
                  </Typography>
                </Stack>
              )}
              {row.onPremisesLastSyncDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Last Synced</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.onPremisesLastSyncDateTime, "onPremisesLastSyncDateTime")}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">User ID</Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: "monospace",
                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.5,
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.id}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      );
    },
  };

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListGraphRequest"
      cardButton={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {isMobile ? (
            <Tooltip title="Add User" enterTouchDelay={0} leaveTouchDelay={3000}>
              <span>
                <CippAddUserDrawer
                  requiredPermissions={cardButtonPermissions}
                  PermissionButton={PermissionButton}
                  buttonText=""
                  buttonProps={{ size: "small", sx: { minWidth: 40, px: 1 }, "aria-label": "Add User" }}
                />
              </span>
            </Tooltip>
          ) : (
            <CippAddUserDrawer
              requiredPermissions={cardButtonPermissions}
              PermissionButton={PermissionButton}
            />
          )}
          {!isMobile && (
            <CippBulkUserDrawer
              requiredPermissions={cardButtonPermissions}
              PermissionButton={PermissionButton}
            />
          )}
          {isMobile ? (
            <Tooltip title="Invite Guest" enterTouchDelay={0} leaveTouchDelay={3000}>
              <span>
                <CippInviteGuestDrawer
                  requiredPermissions={cardButtonPermissions}
                  PermissionButton={PermissionButton}
                  buttonText=""
                  buttonProps={{
                    size: "small",
                    sx: { minWidth: 40, px: 1 },
                    "aria-label": "Invite Guest",
                  }}
                />
              </span>
            </Tooltip>
          ) : (
            <CippInviteGuestDrawer
              requiredPermissions={cardButtonPermissions}
              PermissionButton={PermissionButton}
            />
          )}
          {isMobile ? (
            <Tooltip title="View Logs" enterTouchDelay={0} leaveTouchDelay={3000}>
              <span>
                <CippApiLogsDrawer
                  apiFilter="(?<!Scheduler_)User"
                  buttonText=""
                  title="User Logs"
                  PermissionButton={PermissionButton}
                  tenantFilter={tenant}
                  size="small"
                  sx={{ minWidth: 40, px: 1 }}
                  aria-label="View Logs"
                />
              </span>
            </Tooltip>
          ) : (
            <CippApiLogsDrawer
              apiFilter="(?<!Scheduler_)User"
              buttonText="View Logs"
              title="User Logs"
              PermissionButton={PermissionButton}
              tenantFilter={tenant}
            />
          )}
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
      offCanvas={offCanvas}
      offCanvasOnRowClick={false}
      onCardClick={handleCardClick}
      simpleColumns={simpleColumns}
      filters={filters}
      tenantInTitle={!isMobile}
      cardConfig={cardConfig}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
