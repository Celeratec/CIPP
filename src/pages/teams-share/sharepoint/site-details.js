import { Layout as DashboardLayout } from "../../../layouts/index.js";
import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Divider,
  useTheme,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Container, Grid } from "@mui/system";
import {
  Language,
  Campaign,
  Group,
  FolderShared,
  Person,
  Storage,
  Folder,
  CalendarToday,
  Description,
  OpenInNew,
  ArrowBack,
  Warning,
  TrendingDown,
  CheckCircle,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  NoAccounts,
  Lock,
  Share,
  DataUsage,
  QueryStats,
  Delete,
  Hub,
  Groups,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { CippDataTable } from "../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../hooks/use-settings";
import { ApiGetCall } from "../../../api/ApiCall";
import { CippHead } from "../../../components/CippComponents/CippHead";
import { CippApiDialog } from "../../../components/CippComponents/CippApiDialog";
import { useDialog } from "../../../hooks/use-dialog";
import { getCippFormatting } from "../../../utils/get-cipp-formatting";

// Helpers
const getSiteTypeInfo = (template) => {
  const templateMap = {
    "Communication Site": { icon: <Campaign />, color: "primary", label: "Communication Site" },
    Group: { icon: <Group />, color: "info", label: "Group-Connected Site" },
    "Team Site": { icon: <FolderShared />, color: "secondary", label: "Classic Site" },
    STS: { icon: <FolderShared />, color: "secondary", label: "Classic Site" },
  };
  for (const [key, value] of Object.entries(templateMap)) {
    if (template?.includes(key)) return value;
  }
  return { icon: <Language />, color: "default", label: template || "Site" };
};

const getStoragePercentage = (used, allocated) => {
  if (!allocated || allocated === 0) return 0;
  return Math.min(100, Math.round((used / allocated) * 100));
};

const getStorageStatusColor = (pct) => {
  if (pct >= 90) return "error";
  if (pct >= 75) return "warning";
  return "success";
};

const isInactiveSite = (lastActivityDate) => {
  if (!lastActivityDate) return true;
  const d = new Date(lastActivityDate);
  const ago = new Date();
  ago.setDate(ago.getDate() - 90);
  return d < ago;
};

const StatBox = ({ value, label, color = "primary", sub }) => (
  <Box sx={{ textAlign: "center", px: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {sub && (
      <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
        {sub}
      </Typography>
    )}
  </Box>
);

const InfoRow = ({ label, value, children }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {children || (
      <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: "60%", textAlign: "right" }} noWrap>
        {value ?? "—"}
      </Typography>
    )}
  </Stack>
);

const Page = () => {
  const router = useRouter();
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  // We receive the site data as query params from the list page
  const {
    siteId,
    displayName: qName,
    webUrl: qUrl,
    rootWebTemplate: qTemplate,
    ownerPrincipalName: qOwner,
    ownerDisplayName: qOwnerDisplay,
    storageUsedInGigabytes: qUsed,
    storageAllocatedInGigabytes: qAllocated,
    fileCount: qFiles,
    lastActivityDate: qLastActivity,
    createdDateTime: qCreated,
    reportRefreshDate: qRefresh,
  } = router.query;

  const displayName = qName || "Site Details";
  const webUrl = qUrl || "";
  const rootWebTemplate = qTemplate || "";
  const ownerPrincipalName = qOwner || "";
  const ownerDisplayName = qOwnerDisplay || qOwner || "";
  const storageUsed = parseFloat(qUsed) || 0;
  const storageAllocated = parseFloat(qAllocated) || 0;
  const fileCount = parseInt(qFiles) || 0;
  const lastActivityDate = qLastActivity || "";
  const createdDateTime = qCreated || "";
  const reportRefreshDate = qRefresh || "";

  const typeInfo = getSiteTypeInfo(rootWebTemplate);
  const storagePct = getStoragePercentage(storageUsed, storageAllocated);
  const storageColor = getStorageStatusColor(storagePct);
  const inactive = isInactiveSite(lastActivityDate);

  // Add Member dialog
  const addMemberDialog = useDialog();
  const addMemberApi = {
    url: "/api/ExecSetSharePointMember",
    type: "POST",
    data: {
      groupId: ownerPrincipalName,
      add: true,
      URL: webUrl,
      SharePointType: rootWebTemplate,
    },
    confirmText: "Select a user to add as a member to this site.",
    relatedQueryKeys: [`site-members-${siteId}`],
  };

  // Add Admin dialog
  const addAdminDialog = useDialog();
  const addAdminApi = {
    url: "/api/ExecSharePointPerms",
    type: "POST",
    data: {
      UPN: ownerPrincipalName,
      RemovePermission: false,
      URL: webUrl,
    },
    confirmText: "Select a user to add as a Site Admin.",
    relatedQueryKeys: [`site-members-${siteId}`],
  };

  // Resolve associated team for group-connected sites
  const isGroupConnected = rootWebTemplate?.includes("Group");
  const groupLookup = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: "groups",
      $filter: `mail eq '${ownerPrincipalName}'`,
      $select: "id,displayName,resourceProvisioningOptions",
      $count: true,
      tenantFilter: tenantFilter,
    },
    queryKey: `site-group-lookup-${siteId}`,
    waiting: !!(isGroupConnected && ownerPrincipalName && tenantFilter && siteId),
  });
  const associatedGroup = groupLookup?.data?.Results?.[0];
  const isTeamEnabled =
    associatedGroup?.resourceProvisioningOptions?.includes("Team") ?? false;
  const associatedTeamId = isTeamEnabled ? associatedGroup.id : null;
  const associatedTeamName = isTeamEnabled ? associatedGroup.displayName : null;

  // Create Team from Group dialog
  const createTeamDialog = useDialog();
  const createTeamApi = {
    url: "/api/ExecTeamFromGroup",
    type: "POST",
    data: {
      SiteId: siteId,
      DisplayName: displayName,
    },
    confirmText:
      "Create a Microsoft Team for this site? This will team-enable the existing Microsoft 365 Group, preserving the current site, membership, and content. Full Team provisioning may take a few minutes.",
  };

  const userPickerField = [
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
        addedField: { id: "id" },
        showRefresh: true,
      },
      validators: { validate: (v) => (!v ? "Please select a user" : true) },
    },
  ];

  // Member table actions
  const memberActions = [
    {
      label: "Remove Member",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecSetSharePointMember",
      data: {
        groupId: `!${ownerPrincipalName}`,
        add: "!false",
        URL: `!${webUrl}`,
        SharePointType: `!${rootWebTemplate}`,
        user: "fields.EMail",
      },
      confirmText: "Remove this user from the site?",
      category: "danger",
    },
  ];

  // Wait for router to be ready before checking params
  if (!router.isReady) {
    return (
      <>
        <CippHead title="Site Details" />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button component={Link} href="/teams-share/sharepoint" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
              Back to Sites
            </Button>
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          </Stack>
        </Container>
      </>
    );
  }

  if (!siteId) {
    return (
      <>
        <CippHead title="Site Details" />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button component={Link} href="/teams-share/sharepoint" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
              Back to Sites
            </Button>
            <Alert severity="error">No site ID provided. Please navigate here from the SharePoint Sites list.</Alert>
          </Stack>
        </Container>
      </>
    );
  }

  return (
    <>
      <CippHead title={`${displayName} - Site Details`} />
      <Container maxWidth={false}>
        <Stack spacing={2} sx={{ py: 3 }}>
          {/* Back */}
          <Button component={Link} href="/teams-share/sharepoint" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
            Back to Sites
          </Button>

          {/* Hero + Stats row */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  height: "100%",
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                    0.12
                  )} 0%, ${alpha(
                    theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                    0.04
                  )} 100%)`,
                  borderLeft: `4px solid ${theme.palette[typeInfo.color]?.main || theme.palette.primary.main}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette[typeInfo.color]?.main || theme.palette.primary.main, 0.15),
                      color: theme.palette[typeInfo.color]?.main || theme.palette.primary.main,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {typeInfo.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                      {displayName}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip label={typeInfo.label} size="small" color={typeInfo.color} variant="outlined" />
                      {inactive && (
                        <Chip icon={<TrendingDown fontSize="small" />} label="Inactive (90+ days)" size="small" color="warning" variant="outlined" />
                      )}
                      {storagePct >= 90 && (
                        <Chip icon={<Warning fontSize="small" />} label="Storage Critical" size="small" color="error" variant="outlined" />
                      )}
                      {webUrl && (
                        <Chip
                          icon={<OpenInNew sx={{ fontSize: 14 }} />}
                          label="Open Site"
                          size="small"
                          color="primary"
                          variant="outlined"
                          component="a"
                          href={webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                        />
                      )}
                      {isGroupConnected && isTeamEnabled && associatedTeamId && (
                        <Chip
                          icon={<Groups sx={{ fontSize: 14 }} />}
                          label="View Team"
                          size="small"
                          color="info"
                          variant="outlined"
                          clickable
                          onClick={() =>
                            router.push(
                              `/teams-share/teams/list-team/team-details?teamId=${encodeURIComponent(associatedTeamId)}&name=${encodeURIComponent(associatedTeamName || displayName)}`
                            )
                          }
                        />
                      )}
                      {isGroupConnected && !isTeamEnabled && !groupLookup.isLoading && (
                        <Chip
                          icon={<Groups sx={{ fontSize: 14 }} />}
                          label="Create Team"
                          size="small"
                          color="info"
                          variant="outlined"
                          clickable
                          onClick={() => createTeamDialog.handleOpen()}
                        />
                      )}
                    </Stack>
                    {ownerDisplayName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Owned by {ownerDisplayName}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stack direction="row" spacing={0} divider={<Divider orientation="vertical" flexItem />} justifyContent="space-around" sx={{ width: "100%" }}>
                  <StatBox value={fileCount.toLocaleString()} label="Files" color="primary" />
                  <StatBox value={`${storageUsed}`} label="GB Used" color={storageColor} sub={`of ${storageAllocated} GB`} />
                  <StatBox value={`${storagePct}%`} label="Storage" color={storageColor} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Site Info + Storage side by side */}
          <Grid container spacing={2}>
            {/* Site Information */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Language sx={{ fontSize: 16 }} color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Site Information
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <InfoRow label="Site Name" value={displayName} />
                  <InfoRow label="Template" value={rootWebTemplate} />
                  <InfoRow label="Owner" value={ownerDisplayName || ownerPrincipalName} />
                  {createdDateTime && <InfoRow label="Created" value={getCippFormatting(createdDateTime, "createdDateTime")} />}
                  <InfoRow label="Last Activity" value={lastActivityDate || "Unknown"}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {inactive && (
                        <Tooltip title="No activity in 90+ days">
                          <Warning sx={{ fontSize: 14 }} color="warning" />
                        </Tooltip>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {lastActivityDate || "Unknown"}
                      </Typography>
                    </Stack>
                  </InfoRow>
                  {reportRefreshDate && <InfoRow label="Report Date" value={reportRefreshDate} />}
                  {webUrl && (
                    <InfoRow label="URL">
                      <Typography
                        component="a"
                        href={webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                          maxWidth: "60%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          textAlign: "right",
                        }}
                      >
                        {webUrl}
                      </Typography>
                    </InfoRow>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Storage */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Storage sx={{ fontSize: 16 }} color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Storage
                  </Typography>
                </Stack>
                <Box sx={{ mb: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {storageUsed} GB used
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {storagePct}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={storagePct}
                    color={storageColor}
                    sx={{ height: 8, borderRadius: 4, bgcolor: (t) => alpha(t.palette.grey[500], 0.15) }}
                  />
                </Box>
                <Stack spacing={0.5}>
                  <InfoRow label="Allocated" value={`${storageAllocated} GB`} />
                  <InfoRow label="Used" value={`${storageUsed} GB`} />
                  <InfoRow label="Available" value={`${(storageAllocated - storageUsed).toFixed(2)} GB`} />
                  <InfoRow label="File Count" value={fileCount.toLocaleString()} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Members - full width */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person sx={{ fontSize: 16 }} color="info" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Site Members
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<PersonAdd />} onClick={() => addMemberDialog.handleOpen()}>
                  Member
                </Button>
                <Button size="small" startIcon={<AdminPanelSettings />} onClick={() => addAdminDialog.handleOpen()}>
                  Admin
                </Button>
              </Stack>
            </Stack>
            <Box sx={{ px: 0 }}>
              <CippDataTable
                title="Site Members"
                queryKey={`site-members-${siteId}`}
                api={{
                  url: "/api/ListGraphRequest",
                  data: {
                    Endpoint: `/sites/${siteId}/lists/User%20Information%20List/items`,
                    AsApp: "true",
                    $expand: "fields",
                    $filter: "fields/ContentType eq 'Person'",
                    tenantFilter: tenantFilter,
                  },
                  dataKey: "Results",
                  dataFilter: (data) =>
                    data.filter((item) => {
                      const email = item.fields?.EMail;
                      const title = (item.fields?.Title || "").toLowerCase();
                      const excluded = ["system account", "sharepoint app", "nt service", "everyone"];
                      const isSys = excluded.some((ex) => title.includes(ex) || title.startsWith("nt "));
                      return email && !isSys;
                    }),
                }}
                columns={[
                  {
                    id: "fields.Title",
                    header: "Name",
                    accessorFn: (row) => row.fields?.Title || "",
                    size: 200,
                    Cell: ({ row }) => {
                      const isAdmin = row.original.fields?.IsSiteAdmin;
                      return (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ fontWeight: isAdmin ? 600 : 400 }}>
                            {row.original.fields?.Title || "—"}
                          </Typography>
                          {isAdmin && (
                            <Chip
                              icon={<AdminPanelSettings sx={{ fontSize: 14 }} />}
                              label="Admin"
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ height: 22, fontSize: "0.7rem", "& .MuiChip-label": { px: 0.5 } }}
                            />
                          )}
                        </Stack>
                      );
                    },
                  },
                  {
                    id: "fields.EMail",
                    header: "Email",
                    accessorFn: (row) => row.fields?.EMail || "",
                    size: 220,
                  },
                  {
                    id: "createdBy",
                    header: "Created By",
                    accessorFn: (row) => row.createdBy?.user?.displayName || "",
                    size: 160,
                  },
                  {
                    id: "createdDateTime",
                    header: "Created",
                    accessorFn: (row) => row.createdDateTime || "",
                    size: 140,
                    Cell: ({ cell }) => {
                      const val = cell.getValue();
                      if (!val) return "—";
                      return new Date(val).toLocaleDateString();
                    },
                  },
                  {
                    id: "lastModifiedBy",
                    header: "Modified By",
                    accessorFn: (row) => row.lastModifiedBy?.user?.displayName || "",
                    size: 160,
                  },
                  {
                    id: "lastModifiedDateTime",
                    header: "Modified",
                    accessorFn: (row) => row.lastModifiedDateTime || "",
                    size: 140,
                    Cell: ({ cell }) => {
                      const val = cell.getValue();
                      if (!val) return "—";
                      return new Date(val).toLocaleDateString();
                    },
                  },
                ]}
                actions={memberActions}
                noCard
                hideTitle
                maxHeightOffset="500px"
              />
            </Box>
          </Paper>
        </Stack>
      </Container>

      {/* Dialogs */}
      <CippApiDialog createDialog={addMemberDialog} title="Add Site Member" fields={userPickerField} api={addMemberApi} row={{}} relatedQueryKeys={[`site-members-${siteId}`]} />
      <CippApiDialog createDialog={addAdminDialog} title="Add Site Admin" fields={userPickerField} api={addAdminApi} row={{}} relatedQueryKeys={[`site-members-${siteId}`]} />
      {isGroupConnected && (
        <CippApiDialog createDialog={createTeamDialog} title="Create Team from Site" fields={[]} api={createTeamApi} row={{}} />
      )}
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
