import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { CippTablePage } from "../../../components/CippComponents/CippTablePage.jsx";
import {
  Button,
  Paper,
  Avatar,
  Typography,
  Chip,
  Divider,
  useTheme,
  LinearProgress,
  Tooltip,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  Add,
  AddToPhotos,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  NoAccounts,
  Delete,
  Language,
  Storage,
  Folder,
  CalendarToday,
  Person,
  Hub,
  Group,
  Campaign,
  Article,
  Warning,
  CheckCircle,
  OpenInNew,
  Info,
  Refresh,
  TrendingDown,
  Description,
  FolderShared,
  Lock,
  Share,
  DataUsage,
  QueryStats,
  Groups,
} from "@mui/icons-material";
import Link from "next/link";
import { CippDataTable } from "../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../hooks/use-settings";
import { getCippFormatting } from "../../../utils/get-cipp-formatting";
import { useMemo, useCallback } from "react";

// Helper function to get site type icon and color
const getSiteTypeInfo = (template) => {
  const templateMap = {
    "Communication Site": { icon: <Campaign />, color: "primary", label: "Communication Site" },
    "Group": { icon: <Group />, color: "info", label: "Group-Connected Site" },
    "Team Site": { icon: <FolderShared />, color: "secondary", label: "Classic Site" },
    "STS": { icon: <FolderShared />, color: "secondary", label: "Classic Site" },
  };

  for (const [key, value] of Object.entries(templateMap)) {
    if (template?.includes(key)) return value;
  }
  return { icon: <Language />, color: "default", label: template || "Site" };
};

// Helper to calculate storage percentage
const getStoragePercentage = (used, allocated) => {
  if (!allocated || allocated === 0) return 0;
  return Math.min(100, Math.round((used / allocated) * 100));
};

// Helper to get storage status color
const getStorageStatusColor = (percentage) => {
  if (percentage >= 90) return "error";
  if (percentage >= 75) return "warning";
  return "success";
};

// Helper to check if site is inactive (no activity in 90 days)
const isInactiveSite = (lastActivityDate) => {
  if (!lastActivityDate) return true;
  const lastActivity = new Date(lastActivityDate);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  return lastActivity < ninetyDaysAgo;
};

// Storage progress bar component
const StorageProgressBar = ({ used, allocated, showLabel = true }) => {
  const percentage = getStoragePercentage(used, allocated);
  const color = getStorageStatusColor(percentage);

  return (
    <Tooltip title={`${used} GB used of ${allocated} GB allocated (${percentage}%)`}>
      <Box sx={{ width: "100%", minWidth: 100 }}>
        {showLabel && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {used} GB
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {percentage}%
            </Typography>
          </Stack>
        )}
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.15),
          }}
        />
      </Box>
    </Tooltip>
  );
};

const Page = () => {
  const pageTitle = "SharePoint Sites";
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const actions = useMemo(
    () => [
      {
        label: "View Details",
        type: "link",
        icon: <Info />,
        link: "/teams-share/sharepoint/site-details?siteId=[siteId]&displayName=[displayName]&webUrl=[webUrl]&rootWebTemplate=[rootWebTemplate]&ownerPrincipalName=[ownerPrincipalName]&ownerDisplayName=[ownerDisplayName]&storageUsedInGigabytes=[storageUsedInGigabytes]&storageAllocatedInGigabytes=[storageAllocatedInGigabytes]&fileCount=[fileCount]&lastActivityDate=[lastActivityDate]&createdDateTime=[createdDateTime]&reportRefreshDate=[reportRefreshDate]",
        category: "view",
        quickAction: true,
      },
      {
        label: "Open Site",
        type: "link",
        icon: <Language />,
        link: "[webUrl]",
        external: true,
        category: "view",
        quickAction: true,
      },
      {
        label: "Add Member",
        type: "POST",
        icon: <PersonAdd />,
        url: "/api/ExecSetSharePointMember",
        data: {
          groupId: "ownerPrincipalName",
          add: true,
          URL: "webUrl",
          SharePointType: "rootWebTemplate",
        },
        confirmText: "Select the User to add as a member.",
        fields: [
          {
            type: "autoComplete",
            name: "user",
            label: "Select User",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "users",
                $select: "id,displayName,userPrincipalName",
                $top: 999,
                $count: true,
              },
              queryKey: "ListUsersAutoComplete",
              dataKey: "Results",
              labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
              valueField: "userPrincipalName",
              addedField: {
                id: "id",
              },
              showRefresh: true,
            },
          },
        ],
        multiPost: false,
        category: "edit",
        quickAction: true,
      },
      {
        label: "Remove Member",
        type: "POST",
        icon: <PersonRemove />,
        url: "/api/ExecSetSharePointMember",
        data: {
          groupId: "ownerPrincipalName",
          add: false,
          URL: "webUrl",
          SharePointType: "rootWebTemplate",
        },
        confirmText: "Select the User to remove as a member from this site.",
        category: "edit",
        fields: [
          {
            type: "autoComplete",
            name: "user",
            label: "Select User",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "sites/[siteId]/lists/User%20Information%20List/items",
                AsApp: "true",
                $expand: "fields",
                $filter: "fields/ContentType eq 'Person'",
              },
              queryKey: "ListSiteMembersAutoComplete",
              dataKey: "Results",
              labelField: (item) =>
                `${item.fields?.Title || "Unknown"} (${item.fields?.EMail || "No email"})`,
              valueField: (item) => item.fields?.EMail || item.fields?.UserName,
              showRefresh: true,
              dataFilter: (data) =>
                data.filter((item) => {
                  const email = item.fields?.EMail;
                  const title = (item.fields?.Title || "").toLowerCase();
                  const excludedTitles = ["system account", "sharepoint app", "nt service", "everyone"];
                  const isSystemAccount = excludedTitles.some((ex) => title.includes(ex) || title.startsWith("nt "));
                  return email && !isSystemAccount;
                }),
            },
          },
        ],
        multiPost: false,
        quickAction: true,
      },
      {
        label: "Add Site Admin",
        type: "POST",
        icon: <AdminPanelSettings />,
        url: "/api/ExecSharePointPerms",
        data: {
          UPN: "ownerPrincipalName",
          RemovePermission: false,
          URL: "webUrl",
        },
        confirmText: "Select the User to add to the Site Admins permissions",
        fields: [
          {
            type: "autoComplete",
            name: "user",
            label: "Select User",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "users",
                $select: "id,displayName,userPrincipalName",
                $top: 999,
                $count: true,
              },
              queryKey: "ListUsersAutoComplete",
              dataKey: "Results",
              labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
              valueField: "userPrincipalName",
              addedField: {
                id: "id",
              },
              showRefresh: true,
            },
          },
        ],
        multiPost: false,
        category: "security",
        quickAction: true,
      },
      {
        label: "Remove Site Admin",
        type: "POST",
        icon: <NoAccounts />,
        url: "/api/ExecSharePointPerms",
        data: {
          UPN: "ownerPrincipalName",
          RemovePermission: true,
          URL: "webUrl",
        },
        confirmText: "Select the Site Admin to remove from this site.",
        fields: [
          {
            type: "autoComplete",
            name: "user",
            label: "Select Site Admin",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "sites/[siteId]/lists/User%20Information%20List/items",
                AsApp: "true",
                $expand: "fields",
                $filter: "fields/ContentType eq 'Person'",
              },
              queryKey: "ListSiteAdminsAutoComplete",
              dataKey: "Results",
              labelField: (item) =>
                `${item.fields?.Title || "Unknown"} (${item.fields?.EMail || "No email"})`,
              valueField: (item) => item.fields?.EMail || item.fields?.UserName,
              showRefresh: true,
              // Filter for site admins client-side (IsSiteAdmin is not indexed in SharePoint)
              dataFilter: (data) =>
                data.filter((item) => {
                  const email = item.fields?.EMail;
                  const title = (item.fields?.Title || "").toLowerCase();
                  const isSiteAdmin = item.fields?.IsSiteAdmin === true || item.fields?.IsSiteAdmin === "1" || item.fields?.IsSiteAdmin === 1;
                  const excludedTitles = ["system account", "sharepoint app", "nt service", "everyone"];
                  const isSystemAccount = excludedTitles.some((ex) => title.includes(ex) || title.startsWith("nt "));
                  return email && isSiteAdmin && !isSystemAccount;
                }),
            },
          },
        ],
        multiPost: false,
        category: "security",
        quickAction: true,
      },
      {
        label: "Lock / Unlock Site",
        type: "POST",
        icon: <Lock />,
        url: "/api/ExecSetSiteProperty",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Set the lock state for '[displayName]'. 'Read Only' prevents edits, 'No Access' blocks all users, and 'Unlock' restores normal access.",
        fields: [
          {
            type: "autoComplete",
            name: "LockState",
            label: "Lock State",
            multiple: false,
            creatable: false,
            options: [
              { label: "Unlock (normal access)", value: "Unlock" },
              { label: "Read Only", value: "ReadOnly" },
              { label: "No Access", value: "NoAccess" },
            ],
            required: true,
          },
        ],
        multiPost: false,
        category: "security",
        quickAction: true,
      },
      {
        label: "Set Sharing Policy",
        type: "POST",
        icon: <Share />,
        url: "/api/ExecSetSiteProperty",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Set the external sharing policy for '[displayName]'. This controls who can access content shared from this site.",
        fields: [
          {
            type: "autoComplete",
            name: "SharingCapability",
            label: "Sharing Policy",
            multiple: false,
            creatable: false,
            options: [
              { label: "Disabled (no external sharing)", value: 0 },
              { label: "Existing external users only", value: 3 },
              { label: "New and existing external users (sign-in required)", value: 1 },
              { label: "Anyone (including anonymous guest links)", value: 2 },
            ],
            required: true,
          },
        ],
        multiPost: false,
        category: "security",
        quickAction: true,
      },
      {
        label: "Set Storage Quota",
        type: "POST",
        icon: <DataUsage />,
        url: "/api/ExecSetSiteProperty",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Set the storage quota for '[displayName]'. Values are in GB. The warning level triggers a notification to site admins.",
        fields: [
          {
            type: "textField",
            name: "StorageMaximumLevelGB",
            label: "Maximum Storage (GB)",
            required: true,
          },
          {
            type: "textField",
            name: "StorageWarningLevelGB",
            label: "Warning Level (GB, optional — defaults to 90% of max)",
          },
        ],
        multiPost: false,
        category: "edit",
        quickAction: true,
      },
      {
        label: "Get Live Storage",
        type: "POST",
        icon: <QueryStats />,
        url: "/api/ListSiteLiveStorage",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Fetch real-time storage data for '[displayName]' directly from the SharePoint Admin API. This bypasses the usage reports cache and returns current values.",
        multiPost: false,
        category: "view",
        quickAction: true,
      },
      {
        label: "Create Team from Site",
        type: "POST",
        icon: <Groups />,
        url: "/api/ExecTeamFromGroup",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Create a Microsoft Team for '[displayName]'? This will team-enable the existing Microsoft 365 Group behind this site, preserving the current site, membership, and content. Full Team provisioning may take a few minutes.",
        multiPost: false,
        condition: (row) => row.rootWebTemplate?.includes("Group"),
        category: "edit",
        quickAction: true,
      },
      {
        label: "Delete Site",
        type: "POST",
        icon: <Delete />,
        url: "/api/DeleteSharepointSite",
        data: {
          SiteId: "siteId",
          DisplayName: "displayName",
        },
        confirmText:
          "Are you sure you want to delete this SharePoint site? This action cannot be undone. The site will be moved to the recycle bin for 93 days before permanent deletion. Deletion runs in the background—for large sites it may take several minutes; you can continue using the app.",
        color: "error",
        multiPost: false,
        category: "danger",
        quickAction: true,
      },
    ],
    []
  );

  // Quick filters for common scenarios
  const filters = useMemo(
    () => [
      {
        filterName: "High Storage (>75%)",
        value: [{ id: "storageStatus", value: "high" }],
        type: "column",
      },
      {
        filterName: "Critical Storage (>90%)",
        value: [{ id: "storageStatus", value: "critical" }],
        type: "column",
      },
      {
        filterName: "Inactive Sites (90+ days)",
        value: [{ id: "activityStatus", value: "inactive" }],
        type: "column",
      },
      {
        filterName: "Communication Sites",
        value: [{ id: "rootWebTemplate", value: "Communication" }],
        type: "column",
      },
      {
        filterName: "Group-Connected Sites",
        value: [{ id: "rootWebTemplate", value: "Group" }],
        type: "column",
      },
      {
        filterName: "Large Sites (>10 GB)",
        value: [{ id: "sizeCategory", value: "large" }],
        type: "column",
      },
    ],
    []
  );

  // Card view configuration
  const cardConfig = useMemo(
    () => ({
      title: "displayName",
      avatar: {
        field: "rootWebTemplate",
        customRender: (value) => {
          const typeInfo = getSiteTypeInfo(value);
          return (
            <Avatar
              sx={{
                bgcolor: (theme) => alpha(theme.palette[typeInfo.color]?.main || theme.palette.grey[500], 0.15),
                color: (theme) => theme.palette[typeInfo.color]?.main || theme.palette.grey[500],
              }}
            >
              {typeInfo.icon}
            </Avatar>
          );
        },
      },
      badges: [
        {
          field: "storageStatus",
          conditions: {
            critical: { icon: "warning", color: "error", label: "Storage Critical (>90%)" },
            high: { icon: "warning", color: "warning", label: "Storage High (>75%)" },
            normal: { icon: "check", color: "success", label: "Storage OK" },
          },
          transform: (value, item) => {
            const pct = getStoragePercentage(item.storageUsedInGigabytes, item.storageAllocatedInGigabytes);
            if (pct >= 90) return "critical";
            if (pct >= 75) return "high";
            return "normal";
          },
          iconOnly: true,
        },
        {
          field: "activityStatus",
          conditions: {
            inactive: { icon: <TrendingDown fontSize="small" />, color: "warning", label: "Inactive (90+ days)" },
          },
          transform: (value, item) => (isInactiveSite(item.lastActivityDate) ? "inactive" : null),
          iconOnly: true,
        },
      ],
      extraFields: [
        { field: "ownerPrincipalName", icon: <Person />, label: "Owner" },
        {
          field: "storageUsedInGigabytes",
          icon: <Storage />,
          label: "Storage",
          customRender: (value, item) => (
            <StorageProgressBar
              used={item.storageUsedInGigabytes || 0}
              allocated={item.storageAllocatedInGigabytes || 1}
              showLabel={false}
            />
          ),
        },
      ],
      desktopFields: [
        {
          field: "fileCount",
          icon: <Description />,
          label: "Files",
          formatter: (value) => (value ? value.toLocaleString() : "0"),
        },
        { field: "lastActivityDate", icon: <CalendarToday />, label: "Last Active" },
      ],
      cardGridProps: {
        md: 6,
        lg: 4,
      },
      mobileQuickActions: ["View Details", "Open Site", "Add Member"],
    }),
    []
  );

  // Off-canvas panel renderer
  const offCanvasChildren = useCallback(
    (row) => {
      const typeInfo = getSiteTypeInfo(row.rootWebTemplate);
      const storagePercentage = getStoragePercentage(
        row.storageUsedInGigabytes,
        row.storageAllocatedInGigabytes
      );
      const storageColor = getStorageStatusColor(storagePercentage);
      const inactive = isInactiveSite(row.lastActivityDate);

      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                0.15
              )} 0%, ${alpha(
                theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                0.05
              )} 100%)`,
              borderLeft: `4px solid ${theme.palette[typeInfo.color]?.main || theme.palette.primary.main}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(
                    theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                    0.15
                  ),
                  color: theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                  width: 56,
                  height: 56,
                }}
              >
                {typeInfo.icon}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {row.displayName || "Unknown Site"}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    label={typeInfo.label}
                    size="small"
                    color={typeInfo.color}
                    variant="outlined"
                  />
                  {inactive && (
                    <Chip
                      icon={<TrendingDown fontSize="small" />}
                      label="Inactive"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Quick Stats */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="space-around">
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {row.fileCount?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Files
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: `${storageColor}.main` }}
                >
                  {storagePercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Storage Used
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {row.storageUsedInGigabytes || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  GB Used
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Storage Details */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Storage fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Storage Details
              </Typography>
            </Stack>
            <Box sx={{ mb: 2 }}>
              <StorageProgressBar
                used={row.storageUsedInGigabytes || 0}
                allocated={row.storageAllocatedInGigabytes || 1}
              />
            </Box>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Storage Allocated
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.storageAllocatedInGigabytes} GB
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Storage Available
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {((row.storageAllocatedInGigabytes || 0) - (row.storageUsedInGigabytes || 0)).toFixed(2)} GB
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Owner & Activity */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Owner & Activity
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {row.ownerPrincipalName && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Owner
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {row.ownerDisplayName || row.ownerPrincipalName}
                  </Typography>
                </Stack>
              )}
              {row.createdDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.createdDateTime, "createdDateTime")}
                  </Typography>
                </Stack>
              )}
              {row.lastActivityDate && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Last Activity
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {inactive && (
                      <Tooltip title="No activity in over 90 days">
                        <Warning fontSize="small" color="warning" />
                      </Tooltip>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getCippFormatting(row.lastActivityDate, "lastActivityDate")}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* URL */}
          {row.webUrl && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Site URL
                  </Typography>
                  <Tooltip title="Open site in new tab">
                    <IconButton
                      size="small"
                      component="a"
                      href={row.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography
                  component="a"
                  href={row.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    wordBreak: "break-all",
                  }}
                >
                  {row.webUrl}
                </Typography>
              </Box>
            </>
          )}

          <Divider />

          {/* Site Members Table */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Site Members
            </Typography>
            <CippDataTable
              title="Site Members"
              queryKey={`site-members-${row.siteId}`}
              api={{
                url: "/api/ListGraphRequest",
                data: {
                  Endpoint: `/sites/${row.siteId}/lists/User%20Information%20List/items`,
                  AsApp: "true",
                  $expand: "fields",
                  $filter: "fields/ContentType eq 'Person'",
                  tenantFilter: tenantFilter,
                },
                dataKey: "Results",
                // Filter out system accounts and entries without email on the client side
                dataFilter: (data) =>
                  data.filter((item) => {
                    const email = item.fields?.EMail;
                    const title = item.fields?.Title?.toLowerCase() || "";
                    // Exclude system accounts and entries without email
                    const excludedTitles = [
                      "system account",
                      "sharepoint app",
                      "nt service",
                      "everyone",
                      "everyone except external users",
                    ];
                    const isSystemAccount = excludedTitles.some(
                      (excluded) => title.includes(excluded) || title.startsWith("nt ")
                    );
                    return email && !isSystemAccount;
                  }),
              }}
              simpleColumns={["fields.Title", "fields.EMail", "fields.IsSiteAdmin"]}
            />
          </Box>
        </Stack>
      );
    },
    [theme, tenantFilter]
  );

  const offCanvas = useMemo(
    () => ({
      actions: actions,
      children: offCanvasChildren,
      size: "lg",
    }),
    [actions, offCanvasChildren]
  );

  // Responsive columns
  const simpleColumns = useMemo(
    () =>
      isMobile
        ? ["displayName", "storageUsedInGigabytes", "lastActivityDate"]
        : [
            "displayName",
            "rootWebTemplate",
            "ownerPrincipalName",
            "lastActivityDate",
            "fileCount",
            "storageUsedInGigabytes",
            "storageAllocatedInGigabytes",
            "webUrl",
          ],
    [isMobile]
  );

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListSites?type=SharePointSiteUsage"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      filters={filters}
      cardConfig={cardConfig}
      dataFreshnessField="reportRefreshDate"
      cardButton={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button component={Link} href="/teams-share/sharepoint/add-site" startIcon={<Add />}>
            {isMobile ? "" : "Add Site"}
          </Button>
          {!isMobile && (
            <Button
              component={Link}
              href="/teams-share/sharepoint/bulk-add-site"
              startIcon={<AddToPhotos />}
            >
              Bulk Add Sites
            </Button>
          )}
        </Box>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
