import { 
  Button, 
  Tooltip, 
  IconButton, 
  useMediaQuery, 
  useTheme,
  Paper,
  Avatar,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";
import {
  Visibility,
  VisibilityOff,
  GroupAdd,
  Edit,
  LockOpen,
  Lock,
  GroupSharp,
  CloudSync,
  People,
  Security,
  Email,
  DynamicFeed,
  Public,
  PublicOff,
  Info as InfoIcon,
  Settings,
  CalendarToday,
  Sync,
  Badge,
} from "@mui/icons-material";
import { useState } from "react";
import { useSettings } from "../../../../hooks/use-settings";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import { getInitials, stringToColor } from "../../../../utils/get-initials";

const Page = () => {
  const pageTitle = "Groups";
  const [showMembers, setShowMembers] = useState(false);
  const { currentTenant } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMembersToggle = () => {
    setShowMembers(!showMembers);
  };

  // Card view configuration (works for both mobile and desktop)
  const cardConfig = {
    title: "displayName",
    subtitle: "mail",
    avatar: {
      field: "displayName",
    },
    badges: [
      {
        field: "calculatedGroupType",
        conditions: {
          // Microsoft 365 groups
          m365: { label: "Microsoft 365 Group", color: "primary", icon: <GroupSharp fontSize="small" /> },
          M365: { label: "Microsoft 365 Group", color: "primary", icon: <GroupSharp fontSize="small" /> },
          // Regular Security groups (no mail)
          generic: { label: "Security Group", color: "warning", icon: <Security fontSize="small" /> },
          Generic: { label: "Security Group", color: "warning", icon: <Security fontSize="small" /> },
          // Mail-Enabled Security groups
          security: { label: "Mail-Enabled Security Group", color: "warning", icon: <Security fontSize="small" /> },
          Security: { label: "Mail-Enabled Security Group", color: "warning", icon: <Security fontSize="small" /> },
          // Distribution Lists
          distributionList: { label: "Distribution List", color: "default", icon: <Email fontSize="small" /> },
          DistributionList: { label: "Distribution List", color: "default", icon: <Email fontSize="small" /> },
          distribution: { label: "Distribution List", color: "default", icon: <Email fontSize="small" /> },
          Distribution: { label: "Distribution List", color: "default", icon: <Email fontSize="small" /> },
        },
      },
      {
        field: "dynamicGroupBool",
        conditions: {
          true: { label: "Dynamic Membership - Members auto-assigned by rules", color: "info", icon: <DynamicFeed fontSize="small" /> },
        },
      },
      {
        field: "visibility",
        iconOnly: true,
        conditions: {
          Public: { label: "Public - Anyone can join", icon: <Public fontSize="small" sx={{ display: "block" }} />, color: "success" },
          public: { label: "Public - Anyone can join", icon: <Public fontSize="small" sx={{ display: "block" }} />, color: "success" },
          Private: { label: "Private - Invite only", icon: <PublicOff fontSize="small" sx={{ display: "block" }} />, color: "warning" },
          private: { label: "Private - Invite only", icon: <PublicOff fontSize="small" sx={{ display: "block" }} />, color: "warning" },
        },
      },
    ],
    extraFields: [
      { field: "description", maxLines: 2 },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "mailNickname", label: "Mail Nickname" },
      { field: "visibility", label: "Visibility" },
      { field: "membershipRule", label: "Membership Rule" },
      { field: "onPremisesSyncEnabled", label: "On-Prem Sync" },
    ],
    // Quick actions on cards
    maxQuickActions: 8,
    // Mobile quick actions: 7 buttons (no delete on mobile)
    mobileQuickActions: [
      "View Members",
      "Edit Group",
      "Set Global Address List Visibility",
      "Only allow messages from people inside the organisation",
      "Allow messages from people inside and outside the organisation",
      "Create template based on group",
      "Create Team from Group",
    ],
    // Grid sizing for consistent card widths
    cardGridProps: {
      xs: 12,
      sm: 6,
      md: 4,
      lg: 3,
    },
  };
  const actions = [
    {
      label: "View Members",
      link: "/identity/administration/groups/edit?groupId=[id]&groupType=[groupType]",
      multiPost: false,
      icon: <People />,
      color: "info",
      quickAction: true,
      category: "view",
    },
    {
      label: "Edit Group",
      link: "/identity/administration/groups/edit?groupId=[id]&groupType=[groupType]",
      multiPost: false,
      icon: <Edit />,
      color: "success",
      quickAction: true,
      category: "edit",
    },
    {
      label: "Set Global Address List Visibility",
      type: "POST",
      url: "/api/ExecGroupsHideFromGAL",
      icon: <Visibility />,
      data: {
        ID: "mail",
        GroupType: "groupType",
      },
      fields: [
        {
          type: "radio",
          name: "HidefromGAL",
          label: "Global Address List Visibility",
          options: [
            { label: "Hidden", value: true },
            { label: "Shown", value: false },
          ],
          validators: { required: "Please select a visibility option" },
        },
      ],
      confirmText:
        "Are you sure you want to hide this group from the global address list? Remember this will not work if the group is AD Synched.",
      multiPost: false,
      quickAction: true,
      category: "edit",
    },
    {
      label: "Only allow messages from people inside the organisation",
      type: "POST",
      url: "/api/ExecGroupsDeliveryManagement",
      icon: <Lock />,
      data: {
        ID: "mail",
        GroupType: "groupType",
        OnlyAllowInternal: true,
      },
      confirmText:
        "Are you sure you want to only allow messages from people inside the organisation? Remember this will not work if the group is AD Synched.",
      multiPost: false,
      quickAction: true,
      category: "security",
    },
    {
      label: "Allow messages from people inside and outside the organisation",
      type: "POST",
      icon: <LockOpen />,
      url: "/api/ExecGroupsDeliveryManagement",
      data: {
        ID: "mail",
        GroupType: "groupType",
        OnlyAllowInternal: false,
      },
      confirmText:
        "Are you sure you want to allow messages from people inside and outside the organisation? Remember this will not work if the group is AD Synched.",
      multiPost: false,
      quickAction: true,
      category: "security",
    },
    {
      label: "Set Source of Authority",
      type: "POST",
      url: "/api/ExecSetCloudManaged",
      icon: <CloudSync />,
      data: {
        ID: "id",
        displayName: "displayName",
        type: "!Group",
      },
      fields: [
        {
          type: "radio",
          name: "isCloudManaged",
          label: "Source of Authority",
          options: [
            { label: "Cloud Managed", value: true },
            { label: "On-Premises Managed", value: false },
          ],
          validators: { required: "Please select a source of authority" },
        },
      ],
      confirmText:
        "Are you sure you want to change the source of authority for '[displayName]'? Setting it to On-Premises Managed will take until the next sync cycle to show the change.",
      multiPost: false,
      category: "manage",
    },
    {
      label: "Create template based on group",
      type: "POST",
      url: "/api/AddGroupTemplate",
      icon: <GroupSharp />,
      data: {
        displayName: "displayName",
        description: "description",
        groupType: "calculatedGroupType",
        membershipRules: "membershipRule",
        allowExternal: "allowExternal",
        username: "mailNickname",
      },
      confirmText: "Are you sure you want to create a template based on this group?",
      multiPost: false,
      quickAction: true,
      category: "edit",
    },
    {
      label: "Create Team from Group",
      type: "POST",
      url: "/api/AddGroupTeam",
      icon: <GroupAdd />,
      data: {
        GroupId: "id",
      },
      confirmText:
        "Are you sure you want to create a Team from this group? Note: The group must be at least 15 minutes old for this to work.",
      multiPost: false,
      quickAction: true,
      defaultvalues: {
        TeamSettings: {
          memberSettings: {
            allowCreatePrivateChannels: false,
            allowCreateUpdateChannels: true,
            allowDeleteChannels: false,
            allowAddRemoveApps: false,
            allowCreateUpdateRemoveTabs: false,
            allowCreateUpdateRemoveConnectors: false,
          },
          messagingSettings: {
            allowUserEditMessages: true,
            allowUserDeleteMessages: true,
            allowOwnerDeleteMessages: false,
            allowTeamMentions: false,
            allowChannelMentions: false,
          },
          funSettings: {
            allowGiphy: true,
            giphyContentRating: "strict",
            allowStickersAndMemes: false,
            allowCustomMemes: false,
          },
        },
      },
      fields: [
        {
          type: "heading",
          name: "memberSettingsHeading",
          label: "Member Settings",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowCreatePrivateChannels",
          label: "Allow members to create private channels",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowCreateUpdateChannels",
          label: "Allow members to create and update channels",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowDeleteChannels",
          label: "Allow members to delete channels",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowAddRemoveApps",
          label: "Allow members to add and remove apps",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowCreateUpdateRemoveTabs",
          label: "Allow members to create, update and remove tabs",
        },
        {
          type: "switch",
          name: "TeamSettings.memberSettings.allowCreateUpdateRemoveConnectors",
          label: "Allow members to create, update and remove connectors",
        },
        {
          type: "heading",
          name: "messagingSettingsHeading",
          label: "Messaging Settings",
        },
        {
          type: "switch",
          name: "TeamSettings.messagingSettings.allowUserEditMessages",
          label: "Allow users to edit their messages",
        },
        {
          type: "switch",
          name: "TeamSettings.messagingSettings.allowUserDeleteMessages",
          label: "Allow users to delete their messages",
        },
        {
          type: "switch",
          name: "TeamSettings.messagingSettings.allowOwnerDeleteMessages",
          label: "Allow owners to delete messages",
        },
        {
          type: "switch",
          name: "TeamSettings.messagingSettings.allowTeamMentions",
          label: "Allow @team mentions",
        },
        {
          type: "switch",
          name: "TeamSettings.messagingSettings.allowChannelMentions",
          label: "Allow @channel mentions",
        },
        {
          type: "heading",
          name: "funSettingsHeading",
          label: "Fun Settings",
        },
        {
          type: "switch",
          name: "TeamSettings.funSettings.allowGiphy",
          label: "Allow Giphy",
        },
        {
          type: "select",
          name: "TeamSettings.funSettings.giphyContentRating",
          label: "Giphy content rating",
          options: [
            { value: "strict", label: "Strict" },
            { value: "moderate", label: "Moderate" },
          ],
        },
        {
          type: "switch",
          name: "TeamSettings.funSettings.allowStickersAndMemes",
          label: "Allow stickers and memes",
        },
        {
          type: "switch",
          name: "TeamSettings.funSettings.allowCustomMemes",
          label: "Allow custom memes",
        },
      ],
      condition: (row) => row?.calculatedGroupType === "m365",
      category: "edit",
    },
    {
      label: "Delete Group",
      type: "POST",
      url: "/api/ExecGroupsDelete",
      icon: <TrashIcon />,
      data: {
        ID: "id",
        GroupType: "groupType",
        DisplayName: "displayName",
      },
      confirmText: "Are you sure you want to delete this group.",
      multiPost: false,
      quickAction: true,
      color: "error",
      category: "danger",
    },
  ];
  // Helper function to get group type info for styling
  const getGroupTypeInfo = (row) => {
    const groupType = String(row?.calculatedGroupType || row?.groupType || "").toLowerCase();
    if (groupType.includes("m365") || groupType.includes("unified") || groupType.includes("microsoft")) {
      return { label: "Microsoft 365", color: theme.palette.primary.main, icon: <GroupSharp fontSize="small" /> };
    }
    if (groupType.includes("distribution")) {
      return { label: "Distribution List", color: theme.palette.info.main, icon: <Email fontSize="small" /> };
    }
    if (groupType.includes("security") && row?.mailEnabled) {
      return { label: "Mail-Enabled Security", color: theme.palette.warning.main, icon: <Security fontSize="small" /> };
    }
    if (groupType.includes("security") || groupType.includes("generic")) {
      return { label: "Security Group", color: theme.palette.warning.main, icon: <Security fontSize="small" /> };
    }
    return { label: "Group", color: theme.palette.grey[600], icon: <People fontSize="small" /> };
  };

  const offCanvas = {
    title: "Group Details",
    size: "md",
    actions: actions,
    children: (row) => {
      const groupTypeInfo = getGroupTypeInfo(row);
      const isDynamic = row?.membershipRule || row?.groupTypes?.includes("DynamicMembership");
      
      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(groupTypeInfo.color, 0.15)} 0%, ${alpha(groupTypeInfo.color, 0.05)} 100%)`,
              borderLeft: `4px solid ${groupTypeInfo.color}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: stringToColor(row.displayName || "G"),
                  width: 56,
                  height: 56,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}
              >
                {getInitials(row.displayName || "Group")}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {row.displayName || "Unknown Group"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {row.mail || row.mailNickname || "No email"}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Group Type & Status */}
          <Box>
            <Typography 
              variant="overline" 
              color="text.secondary" 
              sx={{ fontWeight: 600, letterSpacing: 1, mb: 1.5, display: "block" }}
            >
              Group Type & Status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={groupTypeInfo.icon}
                label={groupTypeInfo.label}
                sx={{ 
                  fontWeight: 600, 
                  bgcolor: alpha(groupTypeInfo.color, 0.1),
                  color: groupTypeInfo.color,
                  borderColor: groupTypeInfo.color,
                }}
                variant="outlined"
              />
              {isDynamic && (
                <Chip
                  icon={<DynamicFeed fontSize="small" />}
                  label="Dynamic"
                  color="info"
                  variant="filled"
                  size="small"
                />
              )}
              {row.visibility && (
                <Chip
                  icon={row.visibility === "Public" ? <Public fontSize="small" /> : <PublicOff fontSize="small" />}
                  label={row.visibility}
                  color={row.visibility === "Public" ? "success" : "warning"}
                  variant="outlined"
                  size="small"
                />
              )}
              {row.teamsEnabled && (
                <Chip
                  label="Teams Enabled"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Description */}
          {row.description && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
              </Stack>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {row.description}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Dynamic Membership Rule */}
          {row.membershipRule && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <DynamicFeed fontSize="small" color="action" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Membership Rule
                </Typography>
              </Stack>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: "monospace", 
                    fontSize: "0.8rem",
                    wordBreak: "break-all",
                  }}
                >
                  {row.membershipRule}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Settings */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Settings fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Settings
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Mail Enabled</Typography>
                <Chip 
                  label={row.mailEnabled ? "Yes" : "No"} 
                  size="small" 
                  color={row.mailEnabled ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Security Enabled</Typography>
                <Chip 
                  label={row.securityEnabled ? "Yes" : "No"} 
                  size="small" 
                  color={row.securityEnabled ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>
              {row.onPremisesSyncEnabled !== undefined && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">On-Premises Sync</Typography>
                  <Chip 
                    label={row.onPremisesSyncEnabled ? "Synced" : "Cloud Only"} 
                    size="small" 
                    color={row.onPremisesSyncEnabled ? "info" : "default"}
                    variant="outlined"
                    icon={row.onPremisesSyncEnabled ? <Sync fontSize="small" /> : undefined}
                  />
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Metadata */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <CalendarToday fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Details
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
              {row.onPremisesSamAccountName && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">SAM Account Name</Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: "monospace",
                      bgcolor: alpha(theme.palette.text.primary, 0.05),
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                    }}
                  >
                    {row.onPremisesSamAccountName}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Group ID</Typography>
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
      tenantInTitle={!isMobile}
      cardButton={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {isMobile ? (
            <Tooltip title={showMembers ? "Hide Members" : "Show Members"} enterTouchDelay={0} leaveTouchDelay={3000}>
              <IconButton
                size="small"
                onClick={handleMembersToggle}
                color={showMembers ? "primary" : "default"}
                sx={{ minWidth: 40 }}
                aria-label={showMembers ? "Hide Members" : "Show Members"}
              >
                <People />
              </IconButton>
            </Tooltip>
          ) : (
            <Button onClick={handleMembersToggle} startIcon={<People />}>
              {showMembers ? "Hide Members" : "Show Members"}
            </Button>
          )}
          {isMobile ? (
            <Tooltip title="Add Group" enterTouchDelay={0} leaveTouchDelay={3000}>
              <IconButton
                component={Link}
                href="groups/add"
                size="small"
                sx={{ minWidth: 40 }}
                aria-label="Add Group"
              >
                <GroupAdd />
              </IconButton>
            </Tooltip>
          ) : (
            <Button component={Link} href="groups/add" startIcon={<GroupAdd />}>
              Add Group
            </Button>
          )}
        </Box>
      }
      apiUrl="/api/ListGroups"
      apiData={{ expandMembers: showMembers }}
      queryKey={
        showMembers
          ? `groups-with-members-${currentTenant}`
          : `groups-without-members-${currentTenant}`
      }
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={[
        "displayName",
        "description",
        "mail",
        "mailEnabled",
        "mailNickname",
        "groupType",
        "assignedLicenses",
        "licenseProcessingState.state",
        "visibility",
        "onPremisesSamAccountName",
        "membershipRule",
        "onPremisesSyncEnabled",
      ]}
      cardConfig={cardConfig}
      offCanvasOnRowClick={true}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
