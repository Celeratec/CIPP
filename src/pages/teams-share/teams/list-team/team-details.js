import { Layout as DashboardLayout } from "../../../../layouts/index.js";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Container, Grid } from "@mui/system";
import {
  Groups,
  Public,
  PublicOff,
  Inventory,
  Person,
  Forum,
  Apps,
  Settings,
  PersonAdd,
  PersonRemove,
  SupervisorAccount,
  ArrowBack,
  OpenInNew,
  Language,
  FolderShared,
  CheckCircle,
  Cancel,
  Warning,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../../hooks/use-settings";
import { ApiGetCall, ApiPostCall } from "../../../../api/ApiCall";
import { CippHead } from "../../../../components/CippComponents/CippHead";
import { CippApiDialog } from "../../../../components/CippComponents/CippApiDialog";
import { useDialog } from "../../../../hooks/use-dialog";
import { showToast } from "../../../../store/toasts";

// Risk metadata for settings that could reduce security or cause data loss
const settingsRiskInfo = {
  allowDeleteChannels: {
    risk: "high",
    warning: "Allowing members to delete channels can result in permanent data loss. All messages, files, and tabs within deleted channels will be removed.",
  },
  allowAddRemoveApps: {
    risk: "medium",
    warning: "Apps can access team data including messages and files. Allowing members to add apps could expose sensitive information to third-party services.",
  },
  allowCreateUpdateRemoveConnectors: {
    risk: "medium",
    warning: "Connectors can send team data to external services. Allowing members to manage connectors could result in data being shared outside your organization.",
  },
  allowCreateUpdateChannels_guest: {
    risk: "medium",
    warning: "This allows guest users (external to your organization) to create and modify channels in this team.",
  },
  allowDeleteChannels_guest: {
    risk: "high",
    warning: "Allowing guest users to delete channels is a significant data loss risk. External users could remove channels containing sensitive organizational data.",
  },
  allowUserDeleteMessages: {
    risk: "medium",
    warning: "Allowing users to delete their own messages may impact compliance and audit trails. Deleted messages cannot be recovered by end users.",
  },
};

const SettingsSection = ({ title, icon, settings, onSettingClick, loadingField, onGiphyChange, giphyLoading }) => {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        {settings.map(({ label, value, field, type }, idx) => {
          if (type === "giphyRating") {
            return (
              <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Select
                  size="small"
                  value={value || "moderate"}
                  disabled={giphyLoading}
                  onChange={(e) => onGiphyChange(e.target.value)}
                  sx={{ minWidth: 120, height: 26, fontSize: "0.75rem" }}
                >
                  <MenuItem value="strict">Strict</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="noRestriction">No Restriction</MenuItem>
                </Select>
              </Stack>
            );
          }
          if (typeof value === "boolean" && field) {
            const isEnabled = value === true;
            const riskInfo = settingsRiskInfo[field];
            const isLoading = loadingField === field;
            return (
              <Tooltip
                key={idx}
                title={`${label} — Click to ${isEnabled ? "disable" : "enable"}`}
                arrow
                placement="left"
              >
                <Chip
                  label={label}
                  icon={
                    isLoading ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : isEnabled ? (
                      <CheckCircle fontSize="small" />
                    ) : (
                      <Cancel fontSize="small" />
                    )
                  }
                  color={isEnabled ? "success" : "default"}
                  variant={isEnabled ? "filled" : "outlined"}
                  size="small"
                  disabled={isLoading}
                  onClick={() => onSettingClick(field, !isEnabled, label, riskInfo)}
                  sx={{
                    fontWeight: 500,
                    justifyContent: "flex-start",
                    cursor: "pointer",
                    "&:hover": {
                      opacity: 0.85,
                      transform: "scale(1.01)",
                    },
                    transition: "all 0.15s ease-in-out",
                    ...(isEnabled && {
                      bgcolor: alpha(theme.palette.success.main, 0.85),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.success.main, 0.7),
                        transform: "scale(1.01)",
                      },
                    }),
                  }}
                />
              </Tooltip>
            );
          }
          return (
            <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {value ?? "N/A"}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

const StatBox = ({ value, label, color }) => (
  <Box sx={{ textAlign: "center", px: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: `${color}.main`, lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const Page = () => {
  const router = useRouter();
  const { teamId, name } = router.query;
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  const teamDetails = ApiGetCall({
    url: "/api/ListTeams",
    data: { type: "Team", ID: teamId, tenantFilter },
    queryKey: `TeamDetails-${teamId}`,
    waiting: !!(teamId && tenantFilter),
  });

  const data = teamDetails?.data?.[0];
  const teamInfo = data?.TeamInfo?.[0];
  const channels = data?.ChannelInfo || [];
  const members = data?.Members || [];
  const owners = data?.Owners || [];
  const installedApps = data?.InstalledApps || [];
  const sharePointUrl = data?.SharePointUrl || null;
  const sharePointSiteId = data?.SharePointSiteId || null;
  const sharePointName = data?.SharePointName || null;
  const sharePointCreated = data?.SharePointCreated || null;

  const isArchived = teamInfo?.isArchived === true;
  const isPublic = teamInfo?.visibility === "public" || teamInfo?.visibility === "Public";
  const teamName = data?.Name || name || "Team Details";

  // Dialogs
  const addMemberDialog = useDialog();
  const addOwnerDialog = useDialog();

  const userPickerField = [
    {
      type: "autoComplete",
      name: "UserID",
      label: "Select User",
      multiple: false,
      creatable: false,
      api: {
        url: "/api/ListGraphRequest",
        data: {
          Endpoint: "users",
          $filter: "accountEnabled eq true",
          $top: 999,
          $count: true,
          $orderby: "displayName",
          $select: "id,displayName,userPrincipalName",
        },
        dataKey: "Results",
        labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
        valueField: "id",
      },
      validators: {
        validate: (value) => (!value ? "Please select a user" : true),
      },
    },
  ];

  const addMemberApi = {
    url: "/api/ExecTeamMember",
    type: "POST",
    data: { TeamID: teamId, DisplayName: teamName, Action: "Add", Role: "member" },
    confirmText: "Select a user to add as a member to this team.",
    relatedQueryKeys: [`TeamDetails-${teamId}`],
  };

  const addOwnerApi = {
    url: "/api/ExecTeamMember",
    type: "POST",
    data: { TeamID: teamId, DisplayName: teamName, Action: "Add", Role: "owner" },
    confirmText: "Select a user to add as an owner. Owners can manage team settings and membership.",
    relatedQueryKeys: [`TeamDetails-${teamId}`],
  };

  const appsData = installedApps
    .filter((app) => app.teamsAppDefinition)
    .map((app) => ({
      displayName: app.teamsAppDefinition?.displayName || "Unknown App",
      version: app.teamsAppDefinition?.version || "N/A",
      description: app.teamsAppDefinition?.shortDescription || "",
      publishingState: app.teamsAppDefinition?.publishingState || "N/A",
    }));

  const memberActions = [
    {
      label: "Remove Member",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecTeamMember",
      data: { TeamID: `!${teamId}`, DisplayName: `!${teamName}`, Action: "!Remove", MembershipID: "id" },
      confirmText: "Are you sure you want to remove this member from the team?",
      category: "danger",
    },
    {
      label: "Promote to Owner",
      type: "POST",
      icon: <SupervisorAccount />,
      url: "/api/ExecTeamMember",
      data: { TeamID: `!${teamId}`, DisplayName: `!${teamName}`, Action: "!SetRole", Role: "!owner", MembershipID: "id" },
      confirmText: "Promote this member to an owner?",
      category: "security",
    },
  ];

  const ownerActions = [
    {
      label: "Demote to Member",
      type: "POST",
      icon: <Person />,
      url: "/api/ExecTeamMember",
      data: { TeamID: `!${teamId}`, DisplayName: `!${teamName}`, Action: "!SetRole", Role: "!member", MembershipID: "id" },
      confirmText: "Demote this owner to a regular member?",
      category: "edit",
    },
    {
      label: "Remove from Team",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecTeamMember",
      data: { TeamID: `!${teamId}`, DisplayName: `!${teamName}`, Action: "!Remove", MembershipID: "id" },
      confirmText: "Remove this owner? Ensure at least one owner remains.",
      color: "error",
      category: "danger",
    },
  ];

  // Settings toggle logic
  const dispatch = useDispatch();
  const [loadingField, setLoadingField] = useState(null);
  const [settingsDialog, setSettingsDialog] = useState({ open: false, field: null, newValue: false, label: "", riskInfo: null });
  const settingsMutation = ApiPostCall({ relatedQueryKeys: [`TeamDetails-${teamId}`] });

  const executeSettingChange = useCallback(
    (field, newValue) => {
      setLoadingField(field);
      settingsMutation.mutate(
        {
          url: "/api/ExecTeamSettings",
          data: {
            TeamID: teamId,
            DisplayName: teamName,
            TenantFilter: tenantFilter,
            [field]: newValue,
          },
        },
        {
          onSuccess: (res) => {
            const msg = res?.data?.Results || "Setting updated successfully";
            dispatch(showToast({ message: msg, title: "Team Settings" }));
            setLoadingField(null);
          },
          onError: (err) => {
            const msg = err?.response?.data?.Results || err?.message || "Failed to update setting";
            dispatch(showToast({ message: msg, title: "Team Settings", toastError: { message: msg } }));
            setLoadingField(null);
          },
        }
      );
    },
    [teamId, teamName, tenantFilter, settingsMutation, dispatch]
  );

  const handleSettingClick = useCallback(
    (field, newValue, label, riskInfo) => {
      // If enabling a risky setting, show confirmation dialog
      if (newValue === true && riskInfo) {
        setSettingsDialog({ open: true, field, newValue, label, riskInfo });
      } else {
        // Safe change — execute immediately
        executeSettingChange(field, newValue);
      }
    },
    [executeSettingChange]
  );

  const handleSettingsDialogConfirm = useCallback(() => {
    const { field, newValue } = settingsDialog;
    setSettingsDialog((prev) => ({ ...prev, open: false }));
    executeSettingChange(field, newValue);
  }, [settingsDialog, executeSettingChange]);

  const handleSettingsDialogClose = useCallback(() => {
    setSettingsDialog({ open: false, field: null, newValue: false, label: "", riskInfo: null });
  }, []);

  const handleGiphyChange = useCallback(
    (newRating) => {
      setLoadingField("giphyContentRating");
      settingsMutation.mutate(
        {
          url: "/api/ExecTeamSettings",
          data: {
            TeamID: teamId,
            DisplayName: teamName,
            TenantFilter: tenantFilter,
            giphyContentRating: newRating,
          },
        },
        {
          onSuccess: (res) => {
            const msg = res?.data?.Results || "Giphy rating updated successfully";
            dispatch(showToast({ message: msg, title: "Team Settings" }));
            setLoadingField(null);
          },
          onError: (err) => {
            const msg = err?.response?.data?.Results || err?.message || "Failed to update giphy rating";
            dispatch(showToast({ message: msg, title: "Team Settings", toastError: { message: msg } }));
            setLoadingField(null);
          },
        }
      );
    },
    [teamId, teamName, tenantFilter, settingsMutation, dispatch]
  );

  // Loading state — also wait for router.isReady so query params are available
  if (!router.isReady || teamDetails.isLoading) {
    return (
      <>
        <CippHead title={`${teamName} - Details`} />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button component={Link} href="/teams-share/teams/list-team" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
              Back to Teams
            </Button>
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          </Stack>
        </Container>
      </>
    );
  }

  // Error state
  if (teamDetails.isError || !data) {
    return (
      <>
        <CippHead title={`${teamName} - Details`} />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button component={Link} href="/teams-share/teams/list-team" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
              Back to Teams
            </Button>
            <Alert severity="error">
              Failed to load team details. The team may not exist or you may not have permission to view it.
            </Alert>
          </Stack>
        </Container>
      </>
    );
  }

  return (
    <>
      <CippHead title={`${teamName} - Details`} />
      <Container maxWidth={false}>
        <Stack spacing={2} sx={{ py: 3 }}>
          {/* Back Button */}
          <Button component={Link} href="/teams-share/teams/list-team" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
            Back to Teams
          </Button>

          {/* Hero + Stats row */}
          <Grid container spacing={2}>
            {/* Hero */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  height: "100%",
                  background: `linear-gradient(135deg, ${alpha(
                    isPublic ? theme.palette.success.main : theme.palette.warning.main,
                    0.12
                  )} 0%, ${alpha(
                    isPublic ? theme.palette.success.main : theme.palette.warning.main,
                    0.04
                  )} 100%)`,
                  borderLeft: `4px solid ${isPublic ? theme.palette.success.main : theme.palette.warning.main}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(
                        isPublic ? theme.palette.success.main : theme.palette.warning.main,
                        0.15
                      ),
                      color: isPublic ? theme.palette.success.main : theme.palette.warning.main,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <Groups sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.25 }}>
                      {teamName}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        icon={isPublic ? <Public fontSize="small" /> : <PublicOff fontSize="small" />}
                        label={isPublic ? "Public" : "Private"}
                        size="small"
                        color={isPublic ? "success" : "warning"}
                        variant="outlined"
                      />
                      {isArchived && (
                        <Chip icon={<Inventory fontSize="small" />} label="Archived" size="small" color="error" variant="outlined" />
                      )}
                      {sharePointSiteId && sharePointUrl && (
                        <Chip
                          icon={<FolderShared fontSize="small" />}
                          label="View SharePoint Site"
                          size="small"
                          color="primary"
                          variant="outlined"
                          clickable
                          onClick={() =>
                            router.push(
                              `/teams-share/sharepoint/site-details?siteId=${encodeURIComponent(sharePointSiteId)}&displayName=${encodeURIComponent(sharePointName || teamName)}&webUrl=${encodeURIComponent(sharePointUrl)}&rootWebTemplate=Group&createdDateTime=${encodeURIComponent(sharePointCreated || "")}`
                            )
                          }
                        />
                      )}
                      {sharePointUrl && (
                        <Chip
                          icon={<OpenInNew sx={{ fontSize: 14 }} />}
                          label="Open in SharePoint"
                          size="small"
                          color="default"
                          variant="outlined"
                          component="a"
                          href={sharePointUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                        />
                      )}
                    </Stack>
                    {teamInfo?.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {teamInfo.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Stats */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stack direction="row" spacing={0} divider={<Divider orientation="vertical" flexItem />} justifyContent="space-around" sx={{ width: "100%" }}>
                  <StatBox value={owners.length} label="Owners" color="primary" />
                  <StatBox value={members.length} label="Members" color="info" />
                  <StatBox value={channels.length} label="Channels" color="success" />
                  <StatBox value={appsData.length} label="Apps" color="warning" />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Owners + Members side by side */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SupervisorAccount fontSize="small" color="warning" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Owners ({owners.length})
                    </Typography>
                  </Stack>
                  <Button size="small" startIcon={<PersonAdd />} onClick={() => addOwnerDialog.handleOpen()}>
                    Add
                  </Button>
                </Stack>
                <Box sx={{ px: 0 }}>
                  <CippDataTable
                    title="Owners"
                    data={owners}
                    simpleColumns={["displayName", "email"]}
                    actions={ownerActions}
                    queryKey={`team-owners-${teamId}`}
                    noCard
                    hideTitle
                    maxHeightOffset="600px"
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Person fontSize="small" color="info" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Members ({members.length})
                    </Typography>
                  </Stack>
                  <Button size="small" startIcon={<PersonAdd />} onClick={() => addMemberDialog.handleOpen()}>
                    Add
                  </Button>
                </Stack>
                <Box sx={{ px: 0 }}>
                  <CippDataTable
                    title="Members"
                    data={members}
                    simpleColumns={["displayName", "email"]}
                    actions={memberActions}
                    queryKey={`team-members-${teamId}`}
                    noCard
                    hideTitle
                    maxHeightOffset="600px"
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Channels + Apps side by side */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
                  <Forum fontSize="small" color="success" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Channels ({channels.length})
                  </Typography>
                </Stack>
                <Box sx={{ px: 0 }}>
                  <CippDataTable
                    title="Channels"
                    data={channels}
                    simpleColumns={["displayName", "description", "membershipType"]}
                    queryKey={`team-channels-${teamId}`}
                    noCard
                    hideTitle
                    maxHeightOffset="600px"
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>
                  <Apps fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Installed Apps ({appsData.length})
                  </Typography>
                </Stack>
                <Box sx={{ px: 0 }}>
                  <CippDataTable
                    title="Installed Apps"
                    data={appsData}
                    simpleColumns={["displayName", "version", "publishingState"]}
                    queryKey={`team-apps-${teamId}`}
                    noCard
                    hideTitle
                    maxHeightOffset="600px"
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Settings: 2x2 grid */}
          {teamInfo && (
            <>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Settings fontSize="small" color="action" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Team Settings
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {teamInfo.memberSettings && (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SettingsSection
                      title="Member Permissions"
                      icon={<Person sx={{ fontSize: 14 }} color="info" />}
                      onSettingClick={handleSettingClick}
                      loadingField={loadingField}
                      settings={[
                        { label: "Create/Update Channels", value: teamInfo.memberSettings.allowCreateUpdateChannels, field: "allowCreateUpdateChannels" },
                        { label: "Delete Channels", value: teamInfo.memberSettings.allowDeleteChannels, field: "allowDeleteChannels" },
                        { label: "Add/Remove Apps", value: teamInfo.memberSettings.allowAddRemoveApps, field: "allowAddRemoveApps" },
                        { label: "Create Private Channels", value: teamInfo.memberSettings.allowCreatePrivateChannels, field: "allowCreatePrivateChannels" },
                        { label: "Create/Update/Remove Tabs", value: teamInfo.memberSettings.allowCreateUpdateRemoveTabs, field: "allowCreateUpdateRemoveTabs" },
                        { label: "Create/Update/Remove Connectors", value: teamInfo.memberSettings.allowCreateUpdateRemoveConnectors, field: "allowCreateUpdateRemoveConnectors" },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.guestSettings && (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SettingsSection
                      title="Guest Permissions"
                      icon={<Person sx={{ fontSize: 14 }} color="warning" />}
                      onSettingClick={handleSettingClick}
                      loadingField={loadingField}
                      settings={[
                        { label: "Create/Update Channels", value: teamInfo.guestSettings.allowCreateUpdateChannels, field: "allowCreateUpdateChannels_guest" },
                        { label: "Delete Channels", value: teamInfo.guestSettings.allowDeleteChannels, field: "allowDeleteChannels_guest" },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.messagingSettings && (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SettingsSection
                      title="Messaging"
                      icon={<Forum sx={{ fontSize: 14 }} color="success" />}
                      onSettingClick={handleSettingClick}
                      loadingField={loadingField}
                      settings={[
                        { label: "Users Edit Messages", value: teamInfo.messagingSettings.allowUserEditMessages, field: "allowUserEditMessages" },
                        { label: "Users Delete Messages", value: teamInfo.messagingSettings.allowUserDeleteMessages, field: "allowUserDeleteMessages" },
                        { label: "Owners Delete Messages", value: teamInfo.messagingSettings.allowOwnerDeleteMessages, field: "allowOwnerDeleteMessages" },
                        { label: "Team Mentions", value: teamInfo.messagingSettings.allowTeamMentions, field: "allowTeamMentions" },
                        { label: "Channel Mentions", value: teamInfo.messagingSettings.allowChannelMentions, field: "allowChannelMentions" },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.funSettings && (
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <SettingsSection
                      title="Fun Settings"
                      icon={<Apps sx={{ fontSize: 14 }} color="primary" />}
                      onSettingClick={handleSettingClick}
                      loadingField={loadingField}
                      onGiphyChange={handleGiphyChange}
                      giphyLoading={loadingField === "giphyContentRating"}
                      settings={[
                        { label: "Giphy", value: teamInfo.funSettings.allowGiphy, field: "allowGiphy" },
                        { label: "Giphy Rating", value: teamInfo.funSettings.giphyContentRating, type: "giphyRating" },
                        { label: "Stickers & Memes", value: teamInfo.funSettings.allowStickersAndMemes, field: "allowStickersAndMemes" },
                        { label: "Custom Memes", value: teamInfo.funSettings.allowCustomMemes, field: "allowCustomMemes" },
                      ]}
                    />
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Stack>
      </Container>

      {/* Dialogs */}
      <CippApiDialog createDialog={addMemberDialog} title="Add Member" fields={userPickerField} api={addMemberApi} row={{}} relatedQueryKeys={[`TeamDetails-${teamId}`]} />
      <CippApiDialog createDialog={addOwnerDialog} title="Add Owner" fields={userPickerField} api={addOwnerApi} row={{}} relatedQueryKeys={[`TeamDetails-${teamId}`]} />

      {/* Settings Confirmation Dialog */}
      <Dialog open={settingsDialog.open} onClose={handleSettingsDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: settingsDialog.riskInfo?.risk === "high" ? "error.main" : "warning.main" }}>
          {settingsDialog.riskInfo?.risk === "high" ? "Security Warning" : "Confirm Setting Change"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to enable <strong>{settingsDialog.label}</strong> for this team?
            </Typography>
            <Alert
              severity={settingsDialog.riskInfo?.risk === "high" ? "error" : "warning"}
              icon={<Warning />}
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {settingsDialog.riskInfo?.risk === "high" ? "High Risk — Not Recommended" : "Proceed with Caution"}
              </Typography>
              <Typography variant="body2">
                {settingsDialog.riskInfo?.warning}
              </Typography>
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsDialogClose}>Cancel</Button>
          <Button
            onClick={handleSettingsDialogConfirm}
            color={settingsDialog.riskInfo?.risk === "high" ? "error" : "warning"}
            variant="contained"
          >
            {settingsDialog.riskInfo?.risk === "high" ? "Enable Anyway" : "Enable"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
