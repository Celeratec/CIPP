import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import {
  Paper,
  Avatar,
  Typography,
  Chip,
  Divider,
  useTheme,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  PersonAdd,
  PersonRemove,
  LocationOn,
  Phone,
  Person,
  CheckCircle,
  Warning,
  Flag,
  Wifi,
  CalendarToday,
  Info,
  PhoneEnabled,
  PhoneDisabled,
  SyncAlt,
} from "@mui/icons-material";
import { useSettings } from "../../../../hooks/use-settings";
import { useMemo, useCallback } from "react";

// Helper to safely extract a display string from AssignedTo (may be string or object)
const getAssignedToDisplay = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.displayName || value.userPrincipalName || value.id || "";
  }
  return String(value);
};

const Page = () => {
  const pageTitle = "Teams Business Voice";
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const actions = useMemo(
    () => [
      {
        label: "Assign User",
        type: "POST",
        icon: <PersonAdd />,
        url: "/api/ExecTeamsVoicePhoneNumberAssignment",
        data: {
          PhoneNumber: "TelephoneNumber",
          PhoneNumberType: "NumberType",
          locationOnly: false,
        },
        fields: [
          {
            type: "autoComplete",
            name: "input",
            label: "Select User",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/listUsers",
              labelField: (input) => `${input.displayName} (${input.userPrincipalName})`,
              valueField: "userPrincipalName",
            },
          },
        ],
        confirmText: "Select the User to assign the phone number '[TelephoneNumber]' to.",
        category: "edit",
      },
      {
        label: "Unassign User",
        type: "POST",
        icon: <PersonRemove />,
        url: "/api/ExecRemoveTeamsVoicePhoneNumberAssignment",
        data: {
          PhoneNumber: "TelephoneNumber",
          AssignedTo: "AssignedTo",
          PhoneNumberType: "NumberType",
        },
        confirmText:
          "Are you sure you want to remove the assignment for '[TelephoneNumber]' from '[AssignedTo]'?",
        category: "edit",
      },
      {
        label: "Set Emergency Location",
        type: "POST",
        icon: <LocationOn />,
        url: "/api/ExecTeamsVoicePhoneNumberAssignment",
        data: {
          PhoneNumber: "TelephoneNumber",
          locationOnly: true,
        },
        fields: [
          {
            type: "autoComplete",
            name: "input",
            label: "Emergency Location",
            api: {
              url: "/api/ListTeamsLisLocation",
              labelField: "Description",
              valueField: "LocationId",
            },
          },
        ],
        confirmText: "Select the Emergency Location for '[TelephoneNumber]'.",
        category: "security",
      },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        filterName: "Assigned Numbers",
        value: [{ id: "AssignmentStatus", value: "Assigned" }],
        type: "column",
      },
      {
        filterName: "Unassigned Numbers",
        value: [{ id: "AssignmentStatus", value: "Unassigned" }],
        type: "column",
      },
      {
        filterName: "Operator Connect",
        value: [{ id: "IsOperatorConnect", value: "true" }],
        type: "column",
      },
      {
        filterName: "User Assignment Capable",
        value: [{ id: "AcquiredCapabilities", value: "UserAssignment" }],
        type: "column",
      },
    ],
    []
  );

  const cardConfig = useMemo(
    () => ({
      title: "TelephoneNumber",
      subtitle: "AssignedTo",
      avatar: {
        field: "TelephoneNumber",
        icon: (item) =>
          item.AssignmentStatus === "Assigned" ? (
            <PhoneEnabled />
          ) : (
            <PhoneDisabled />
          ),
      },
      badges: [
        {
          field: "AssignmentStatus",
          conditions: {
            Assigned: {
              label: "Assigned",
              color: "success",
              icon: <CheckCircle fontSize="small" />,
            },
            Unassigned: {
              label: "Unassigned",
              color: "warning",
              icon: <Warning fontSize="small" />,
            },
          },
          iconOnly: true,
        },
        {
          field: "IsOperatorConnect",
          conditions: {
            true: {
              label: "Operator Connect",
              color: "info",
              icon: <SyncAlt fontSize="small" />,
            },
          },
          transform: (value) => (value === true || value === "True" || value === "true" ? "true" : null),
          iconOnly: true,
        },
      ],
      extraFields: [
        {
          field: "AssignedTo",
          icon: <Person />,
          label: "Assigned To",
          formatter: (value) => getAssignedToDisplay(value) || "Unassigned",
        },
      ],
      desktopFields: [
        { field: "NumberType", icon: <Phone />, label: "Type" },
        { field: "IsoCountryCode", icon: <Flag />, label: "Country" },
      ],
      cardGridProps: {
        xs: 12,
        sm: 6,
        md: 4,
        lg: 3,
      },
    }),
    []
  );

  const offCanvasChildren = useCallback(
    (row) => {
      const isAssigned = row.AssignmentStatus === "Assigned";
      const isOperatorConnect = row.IsOperatorConnect === true || row.IsOperatorConnect === "True" || row.IsOperatorConnect === "true";

      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(
                isAssigned ? theme.palette.success.main : theme.palette.warning.main,
                0.15
              )} 0%, ${alpha(
                isAssigned ? theme.palette.success.main : theme.palette.warning.main,
                0.05
              )} 100%)`,
              borderLeft: `4px solid ${isAssigned ? theme.palette.success.main : theme.palette.warning.main}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(
                    isAssigned ? theme.palette.success.main : theme.palette.warning.main,
                    0.15
                  ),
                  color: isAssigned ? theme.palette.success.main : theme.palette.warning.main,
                  width: 56,
                  height: 56,
                }}
              >
                {isAssigned ? <PhoneEnabled sx={{ fontSize: 28 }} /> : <PhoneDisabled sx={{ fontSize: 28 }} />}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {row.TelephoneNumber}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    label={isAssigned ? "Assigned" : "Unassigned"}
                    size="small"
                    color={isAssigned ? "success" : "warning"}
                    variant="outlined"
                  />
                  {isOperatorConnect && (
                    <Chip
                      icon={<SyncAlt fontSize="small" />}
                      label="Operator Connect"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Assignment Info */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Assignment
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={row.AssignmentStatus || "Unknown"}
                  size="small"
                  color={isAssigned ? "success" : "warning"}
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Assigned To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {getAssignedToDisplay(row.AssignedTo) || "—"}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Number Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.NumberType || "—"}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Capabilities */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Capabilities
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Acquired Capabilities
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Tooltip title={row.AcquiredCapabilities || "—"}>
                    <span>{row.AcquiredCapabilities || "—"}</span>
                  </Tooltip>
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Activation State
                </Typography>
                <Chip
                  label={row.ActivationState || "Unknown"}
                  size="small"
                  color={
                    row.ActivationState === "Activated"
                      ? "success"
                      : row.ActivationState === "AssignmentPending"
                      ? "info"
                      : "default"
                  }
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Location */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Location
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Country Code
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.IsoCountryCode || "—"}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Place Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.PlaceName || "—"}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Additional Details */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Additional Details
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Operator Connect
                </Typography>
                <Chip
                  label={isOperatorConnect ? "Yes" : "No"}
                  size="small"
                  color={isOperatorConnect ? "info" : "default"}
                  variant="outlined"
                />
              </Stack>
              {row.AcquisitionDate && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Acquisition Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(row.AcquisitionDate).toLocaleDateString()}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        </Stack>
      );
    },
    [theme]
  );

  const offCanvas = useMemo(
    () => ({
      actions: actions,
      children: offCanvasChildren,
      size: "lg",
    }),
    [actions, offCanvasChildren]
  );

  const simpleColumns = useMemo(
    () =>
      isMobile
        ? ["TelephoneNumber", "AssignedTo", "AssignmentStatus"]
        : [
            "TelephoneNumber",
            "AssignedTo",
            "AssignmentStatus",
            "NumberType",
            "AcquiredCapabilities",
            "IsoCountryCode",
            "PlaceName",
            "ActivationState",
            "IsOperatorConnect",
            "AcquisitionDate",
          ],
    [isMobile]
  );

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListTeamsVoice"
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      filters={filters}
      cardConfig={cardConfig}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
