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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Container } from "@mui/system";
import Grid from "@mui/material/Grid";
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
  CheckCircle,
  Cancel,
  OpenInNew,
  Language,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../../hooks/use-settings";
import { ApiGetCall } from "../../../../api/ApiCall";
import { CippHead } from "../../../../components/CippComponents/CippHead";
import { CippApiDialog } from "../../../../components/CippComponents/CippApiDialog";
import { useDialog } from "../../../../hooks/use-dialog";

const BooleanIndicator = ({ value }) => {
  const isTrue = value === true || value === "true" || value === "True";
  return (
    <Chip
      icon={isTrue ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
      label={isTrue ? "Yes" : "No"}
      size="small"
      color={isTrue ? "success" : "default"}
      variant="outlined"
      sx={{ height: 22, fontSize: "0.7rem" }}
    />
  );
};

const SettingsSection = ({ title, icon, settings }) => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: "100%" }}>
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Typography>
    </Stack>
    <Stack spacing={0.25}>
      {settings.map(({ label, value }, idx) => (
        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          {typeof value === "boolean" ? (
            <BooleanIndicator value={value} />
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {value ?? "N/A"}
            </Typography>
          )}
        </Stack>
      ))}
    </Stack>
  </Paper>
);

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

  // Loading state
  if (teamDetails.isLoading) {
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
            <Grid item xs={12} lg={8}>
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
                      {sharePointUrl && (
                        <Chip
                          icon={<Language fontSize="small" />}
                          label="SharePoint Site"
                          size="small"
                          color="primary"
                          variant="outlined"
                          component="a"
                          href={sharePointUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          deleteIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                          onDelete={() => window.open(sharePointUrl, "_blank")}
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
            <Grid item xs={12} lg={4}>
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

          {/* Main content: 2-column grid */}
          <Grid container spacing={2}>
            {/* Left column: Owners + Members */}
            <Grid item xs={12} lg={6}>
              <Stack spacing={2}>
                {/* Owners */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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

                {/* Members */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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
              </Stack>
            </Grid>

            {/* Right column: Channels + Apps */}
            <Grid item xs={12} lg={6}>
              <Stack spacing={2}>
                {/* Channels */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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

                {/* Installed Apps */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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
              </Stack>
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
                  <Grid item xs={12} sm={6} lg={3}>
                    <SettingsSection
                      title="Member Permissions"
                      icon={<Person sx={{ fontSize: 14 }} color="info" />}
                      settings={[
                        { label: "Create/Update Channels", value: teamInfo.memberSettings.allowCreateUpdateChannels },
                        { label: "Delete Channels", value: teamInfo.memberSettings.allowDeleteChannels },
                        { label: "Add/Remove Apps", value: teamInfo.memberSettings.allowAddRemoveApps },
                        { label: "Create Private Channels", value: teamInfo.memberSettings.allowCreatePrivateChannels },
                        { label: "Create/Update/Remove Tabs", value: teamInfo.memberSettings.allowCreateUpdateRemoveTabs },
                        { label: "Create/Update/Remove Connectors", value: teamInfo.memberSettings.allowCreateUpdateRemoveConnectors },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.guestSettings && (
                  <Grid item xs={12} sm={6} lg={3}>
                    <SettingsSection
                      title="Guest Permissions"
                      icon={<Person sx={{ fontSize: 14 }} color="warning" />}
                      settings={[
                        { label: "Create/Update Channels", value: teamInfo.guestSettings.allowCreateUpdateChannels },
                        { label: "Delete Channels", value: teamInfo.guestSettings.allowDeleteChannels },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.messagingSettings && (
                  <Grid item xs={12} sm={6} lg={3}>
                    <SettingsSection
                      title="Messaging"
                      icon={<Forum sx={{ fontSize: 14 }} color="success" />}
                      settings={[
                        { label: "Users Edit Messages", value: teamInfo.messagingSettings.allowUserEditMessages },
                        { label: "Users Delete Messages", value: teamInfo.messagingSettings.allowUserDeleteMessages },
                        { label: "Owners Delete Messages", value: teamInfo.messagingSettings.allowOwnerDeleteMessages },
                        { label: "Team Mentions", value: teamInfo.messagingSettings.allowTeamMentions },
                        { label: "Channel Mentions", value: teamInfo.messagingSettings.allowChannelMentions },
                      ]}
                    />
                  </Grid>
                )}
                {teamInfo.funSettings && (
                  <Grid item xs={12} sm={6} lg={3}>
                    <SettingsSection
                      title="Fun Settings"
                      icon={<Apps sx={{ fontSize: 14 }} color="primary" />}
                      settings={[
                        { label: "Giphy", value: teamInfo.funSettings.allowGiphy },
                        { label: "Giphy Rating", value: teamInfo.funSettings.giphyContentRating },
                        { label: "Stickers & Memes", value: teamInfo.funSettings.allowStickersAndMemes },
                        { label: "Custom Memes", value: teamInfo.funSettings.allowCustomMemes },
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
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
