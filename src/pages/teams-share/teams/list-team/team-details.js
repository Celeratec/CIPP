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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Container } from "@mui/system";
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
  Archive,
  Unarchive,
  Delete,
  ArrowBack,
  Lock,
  LockOpen,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { useSettings } from "../../../../hooks/use-settings";
import { ApiGetCall } from "../../../../api/ApiCall";
import { CippHead } from "../../../../components/CippComponents/CippHead";

const BooleanIndicator = ({ value, trueLabel, falseLabel }) => {
  const isTrue = value === true || value === "true" || value === "True";
  return (
    <Chip
      icon={isTrue ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
      label={isTrue ? (trueLabel || "Yes") : (falseLabel || "No")}
      size="small"
      color={isTrue ? "success" : "default"}
      variant="outlined"
      sx={{ height: 24, fontSize: "0.75rem" }}
    />
  );
};

const SettingsSection = ({ title, icon, settings }) => {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={0.75}>
        {settings.map(({ label, value }, idx) => (
          <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {typeof value === "boolean" ? (
              <BooleanIndicator value={value} />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {value ?? "N/A"}
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

const Page = () => {
  const router = useRouter();
  const { teamId, name } = router.query;
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  const teamDetails = ApiGetCall({
    url: "/api/ListTeams",
    data: {
      type: "Team",
      ID: teamId,
      tenantFilter: tenantFilter,
    },
    queryKey: `TeamDetails-${teamId}`,
    waiting: !!(teamId && tenantFilter),
  });

  const data = teamDetails?.data?.[0];
  const teamInfo = data?.TeamInfo?.[0];
  const channels = data?.ChannelInfo || [];
  const members = data?.Members || [];
  const owners = data?.Owners || [];
  const installedApps = data?.InstalledApps || [];

  const isArchived = teamInfo?.isArchived === true;
  const isPublic = teamInfo?.visibility === "public" || teamInfo?.visibility === "Public";
  const teamName = data?.Name || name || "Team Details";

  // Format apps data for the table
  const appsData = installedApps
    .filter((app) => app.teamsAppDefinition)
    .map((app) => ({
      displayName: app.teamsAppDefinition?.displayName || "Unknown App",
      version: app.teamsAppDefinition?.version || "N/A",
      description: app.teamsAppDefinition?.shortDescription || "",
      publishingState: app.teamsAppDefinition?.publishingState || "N/A",
    }));

  // Member actions
  const memberActions = [
    {
      label: "Remove Member",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecTeamMember",
      data: {
        TeamID: `!${teamId}`,
        DisplayName: `!${teamName}`,
        Action: "!Remove",
        MembershipID: "id",
      },
      confirmText: "Are you sure you want to remove this member from the team?",
      category: "danger",
    },
    {
      label: "Promote to Owner",
      type: "POST",
      icon: <SupervisorAccount />,
      url: "/api/ExecTeamMember",
      data: {
        TeamID: `!${teamId}`,
        DisplayName: `!${teamName}`,
        Action: "!SetRole",
        Role: "!owner",
        MembershipID: "id",
      },
      confirmText: "Promote this member to an owner of the team? Owners can manage settings and membership.",
      category: "security",
    },
  ];

  const ownerActions = [
    {
      label: "Demote to Member",
      type: "POST",
      icon: <Person />,
      url: "/api/ExecTeamMember",
      data: {
        TeamID: `!${teamId}`,
        DisplayName: `!${teamName}`,
        Action: "!SetRole",
        Role: "!member",
        MembershipID: "id",
      },
      confirmText: "Demote this owner to a regular member? They will lose the ability to manage team settings.",
      category: "edit",
    },
    {
      label: "Remove from Team",
      type: "POST",
      icon: <PersonRemove />,
      url: "/api/ExecTeamMember",
      data: {
        TeamID: `!${teamId}`,
        DisplayName: `!${teamName}`,
        Action: "!Remove",
        MembershipID: "id",
      },
      confirmText: "Are you sure you want to remove this owner from the team? Ensure at least one owner remains.",
      color: "error",
      category: "danger",
    },
  ];

  if (teamDetails.isLoading) {
    return (
      <>
        <CippHead title={`${teamName} - Details`} />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button
              component={Link}
              href="/teams-share/teams/list-team"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: "flex-start" }}
            >
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

  if (teamDetails.isError || !data) {
    return (
      <>
        <CippHead title={`${teamName} - Details`} />
        <Container maxWidth={false}>
          <Stack spacing={2} sx={{ py: 4 }}>
            <Button
              component={Link}
              href="/teams-share/teams/list-team"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: "flex-start" }}
            >
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
        <Stack spacing={3} sx={{ py: 4 }}>
          {/* Back Button */}
          <Button
            component={Link}
            href="/teams-share/teams/list-team"
            startIcon={<ArrowBack />}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to Teams
          </Button>

          {/* Hero Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
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
            <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
              <Avatar
                sx={{
                  bgcolor: alpha(
                    isPublic ? theme.palette.success.main : theme.palette.warning.main,
                    0.15
                  ),
                  color: isPublic ? theme.palette.success.main : theme.palette.warning.main,
                  width: 64,
                  height: 64,
                }}
              >
                <Groups sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {teamName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={isPublic ? <Public fontSize="small" /> : <PublicOff fontSize="small" />}
                    label={isPublic ? "Public" : "Private"}
                    size="small"
                    color={isPublic ? "success" : "warning"}
                    variant="outlined"
                  />
                  {isArchived && (
                    <Chip
                      icon={<Inventory fontSize="small" />}
                      label="Archived"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  <Chip label={`${owners.length} Owners`} size="small" variant="outlined" />
                  <Chip label={`${members.length} Members`} size="small" variant="outlined" />
                  <Chip label={`${channels.length} Channels`} size="small" variant="outlined" />
                  <Chip label={`${appsData.length} Apps`} size="small" variant="outlined" />
                </Stack>
                {teamInfo?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {teamInfo.description}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>

          {/* Quick Stats */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="space-around" flexWrap="wrap" useFlexGap>
              <Box sx={{ textAlign: "center", minWidth: 80 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {owners.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Owners
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center", minWidth: 80 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "info.main" }}>
                  {members.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Members
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center", minWidth: 80 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>
                  {channels.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Channels
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center", minWidth: 80 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {appsData.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Installed Apps
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Owners Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SupervisorAccount color="warning" />
                <span>Owners ({owners.length})</span>
              </Stack>
            </Typography>
            <CippDataTable
              title="Owners"
              data={owners}
              simpleColumns={["displayName", "email"]}
              actions={ownerActions}
              queryKey={`team-owners-${teamId}`}
            />
          </Box>

          {/* Members Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person color="info" />
                <span>Members ({members.length})</span>
              </Stack>
            </Typography>
            <CippDataTable
              title="Members"
              data={members}
              simpleColumns={["displayName", "email"]}
              actions={memberActions}
              queryKey={`team-members-${teamId}`}
            />
          </Box>

          {/* Channels Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Forum color="success" />
                <span>Channels ({channels.length})</span>
              </Stack>
            </Typography>
            <CippDataTable
              title="Channels"
              data={channels}
              simpleColumns={["displayName", "description", "membershipType"]}
              queryKey={`team-channels-${teamId}`}
            />
          </Box>

          {/* Installed Apps Table */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Apps color="primary" />
                <span>Installed Apps ({appsData.length})</span>
              </Stack>
            </Typography>
            <CippDataTable
              title="Installed Apps"
              data={appsData}
              simpleColumns={["displayName", "version", "description", "publishingState"]}
              queryKey={`team-apps-${teamId}`}
            />
          </Box>

          {/* Team Settings */}
          {teamInfo && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Settings color="action" />
                  <span>Team Settings</span>
                </Stack>
              </Typography>
              <Stack spacing={2}>
                {teamInfo.memberSettings && (
                  <SettingsSection
                    title="Member Permissions"
                    icon={<Person fontSize="small" color="info" />}
                    settings={[
                      { label: "Create/Update Channels", value: teamInfo.memberSettings.allowCreateUpdateChannels },
                      { label: "Delete Channels", value: teamInfo.memberSettings.allowDeleteChannels },
                      { label: "Add/Remove Apps", value: teamInfo.memberSettings.allowAddRemoveApps },
                      { label: "Create Private Channels", value: teamInfo.memberSettings.allowCreatePrivateChannels },
                      { label: "Create/Update/Remove Tabs", value: teamInfo.memberSettings.allowCreateUpdateRemoveTabs },
                      { label: "Create/Update/Remove Connectors", value: teamInfo.memberSettings.allowCreateUpdateRemoveConnectors },
                    ]}
                  />
                )}

                {teamInfo.guestSettings && (
                  <SettingsSection
                    title="Guest Permissions"
                    icon={<Person fontSize="small" color="warning" />}
                    settings={[
                      { label: "Create/Update Channels", value: teamInfo.guestSettings.allowCreateUpdateChannels },
                      { label: "Delete Channels", value: teamInfo.guestSettings.allowDeleteChannels },
                    ]}
                  />
                )}

                {teamInfo.messagingSettings && (
                  <SettingsSection
                    title="Messaging"
                    icon={<Forum fontSize="small" color="success" />}
                    settings={[
                      { label: "Users Edit Messages", value: teamInfo.messagingSettings.allowUserEditMessages },
                      { label: "Users Delete Messages", value: teamInfo.messagingSettings.allowUserDeleteMessages },
                      { label: "Owners Delete Messages", value: teamInfo.messagingSettings.allowOwnerDeleteMessages },
                      { label: "Team Mentions", value: teamInfo.messagingSettings.allowTeamMentions },
                      { label: "Channel Mentions", value: teamInfo.messagingSettings.allowChannelMentions },
                    ]}
                  />
                )}

                {teamInfo.funSettings && (
                  <SettingsSection
                    title="Fun Settings"
                    icon={<Apps fontSize="small" color="primary" />}
                    settings={[
                      { label: "Giphy", value: teamInfo.funSettings.allowGiphy },
                      { label: "Giphy Content Rating", value: teamInfo.funSettings.giphyContentRating },
                      { label: "Stickers & Memes", value: teamInfo.funSettings.allowStickersAndMemes },
                      { label: "Custom Memes", value: teamInfo.funSettings.allowCustomMemes },
                    ]}
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
