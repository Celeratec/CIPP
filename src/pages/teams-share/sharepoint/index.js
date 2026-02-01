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
} from "@mui/icons-material";
import Link from "next/link";
import { CippDataTable } from "../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../hooks/use-settings";
import { getCippFormatting } from "../../../utils/get-cipp-formatting";
import { getInitials, stringToColor } from "../../../utils/get-initials";

const Page = () => {
  const pageTitle = "SharePoint Sites";
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  const actions = [
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
    },
    {
      label: "Remove Member",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecSetSharePointMember",
      data: {
        groupId: "ownerPrincipalName",
        add: false,
        URL: "URL",
        SharePointType: "rootWebTemplate",
      },
      confirmText: "Select the User to remove as a member.",
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
      confirmText: "Select the User to remove from the Site Admins permissions",
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
    },
    {
      label: "Delete Site",
      type: "POST",
      icon: <Delete />,
      url: "/api/DeleteSharepointSite",
      data: {
        SiteId: "siteId",
      },
      confirmText: "Are you sure you want to delete this SharePoint site? This action cannot be undone.",
      color: "error",
      multiPost: false,
      category: "danger",
    },
  ];

  const offCanvas = {
    actions: actions,
    children: (row) => (
      <Stack spacing={3}>
        {/* Hero Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: stringToColor(row.displayName || "S"),
                width: 56,
                height: 56,
              }}
            >
              <Language />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                {row.displayName || "Unknown Site"}
              </Typography>
              {row.ownerPrincipalName && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  Owner: {row.ownerPrincipalName}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Site Info */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Storage fontSize="small" color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Storage & Usage
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {row.storageUsedInGigabytes !== undefined && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Storage Used</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.storageUsedInGigabytes} GB
                </Typography>
              </Stack>
            )}
            {row.storageAllocatedInGigabytes !== undefined && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Storage Allocated</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.storageAllocatedInGigabytes} GB
                </Typography>
              </Stack>
            )}
            {row.fileCount !== undefined && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">File Count</Typography>
                <Chip label={row.fileCount.toLocaleString()} size="small" variant="outlined" />
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Timeline */}
        <Divider />
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Activity
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
            {row.lastActivityDate && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Last Activity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {getCippFormatting(row.lastActivityDate, "lastActivityDate")}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* URL */}
        {row.webUrl && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Site URL
              </Typography>
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
                expand: "fields",
                tenantFilter: tenantFilter,
              },
              dataKey: "Results",
            }}
            simpleColumns={["fields.Title", "fields.EMail", "fields.IsSiteAdmin"]}
          />
        </Box>
      </Stack>
    ),
    size: "lg",
  };

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListSites?type=SharePointSiteUsage"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={[
        "displayName",
        "createdDateTime",
        "ownerPrincipalName",
        "lastActivityDate",
        "fileCount",
        "storageUsedInGigabytes",
        "storageAllocatedInGigabytes",
        "reportRefreshDate",
        "webUrl",
      ]}
      cardButton={
        <>
          <Button component={Link} href="/teams-share/sharepoint/add-site" startIcon={<Add />}>
            Add Site
          </Button>
          <Button
            component={Link}
            href="/teams-share/sharepoint/bulk-add-site"
            startIcon={<AddToPhotos />}
          >
            Bulk Add Sites
          </Button>
        </>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
