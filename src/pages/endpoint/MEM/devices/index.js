import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { useSettings } from "../../../../hooks/use-settings";
import { EyeIcon } from "@heroicons/react/24/outline";
import {
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
  Sync,
  RestartAlt,
  LocationOn,
  Password,
  PasswordOutlined,
  Key,
  Edit,
  Security,
  FindInPage,
  Shield,
  Archive,
  AutoMode,
  Recycling,
  ManageAccounts,
  Computer,
  PhoneAndroid,
  PhoneIphone,
  Laptop,
  CheckCircle,
  Cancel,
  Warning,
  Help,
  Person,
  CalendarToday,
  Info as InfoIcon,
  Business,
} from "@mui/icons-material";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import { getInitials, stringToColor } from "../../../../utils/get-initials";

const Page = () => {
  const pageTitle = "Devices";
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  // Card view configuration (works for both mobile and desktop)
  const cardConfig = {
    title: "deviceName",
    subtitle: "userPrincipalName",
    avatar: {
      field: "deviceName",
    },
    badges: [
      {
        field: "complianceState",
        conditions: {
          compliant: { icon: "check", color: "success", label: "Device is Compliant" },
          noncompliant: { icon: "cancel", color: "error", label: "Device is Non-Compliant" },
          unknown: { label: "Compliance Status Unknown", color: "default", icon: <Help fontSize="small" /> },
          inGracePeriod: { label: "In Grace Period - Compliance pending", color: "warning" },
        },
      },
    ],
    extraFields: [
      { field: "operatingSystem", icon: <Computer />, maxLines: 1 },
      { field: "model", icon: <PhoneAndroid />, maxLines: 1 },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "manufacturer", label: "Manufacturer", icon: <Business /> },
      { field: "osVersion", label: "OS Version" },
      { field: "enrolledDateTime", label: "Enrolled", icon: <CalendarToday /> },
      { field: "managedDeviceOwnerType", label: "Owner Type", icon: <Person /> },
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
      label: "View in Intune",
      link: `https://intune.microsoft.com/${tenantFilter}/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview/mdmDeviceId/[id]`,
      color: "info",
      icon: <EyeIcon />,
      target: "_blank",
      multiPost: false,
      external: true,
      category: "view",
    },
    {
      label: "Change Primary User",
      type: "POST",
      icon: <ManageAccounts />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "!users",
      },
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
            valueField: "id",
            addedField: {
              userPrincipalName: "userPrincipalName",
            },
            showRefresh: true,
          },
        },
      ],
      confirmText: "Select the User to set as the primary user for [deviceName]",
      category: "edit",
    },
    {
      label: "Rename Device",
      type: "POST",
      icon: <Edit />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "setDeviceName",
      },
      confirmText: "Enter the new name for the device",
      fields: [
        {
          type: "textField",
          name: "input",
          label: "New Device Name",
          required: true,
        },
      ],
      category: "edit",
    },
    {
      label: "Sync Device",
      type: "POST",
      icon: <Sync />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "syncDevice",
      },
      confirmText: "Are you sure you want to sync [deviceName]?",
      category: "manage",
    },
    {
      label: "Reboot Device",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "rebootNow",
      },
      confirmText: "Are you sure you want to reboot [deviceName]?",
      category: "manage",
    },
    {
      label: "Locate Device",
      type: "POST",
      icon: <LocationOn />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "locateDevice",
      },
      confirmText: "Are you sure you want to locate [deviceName]?",
      category: "manage",
    },
    {
      label: "Retrieve LAPS password",
      type: "POST",
      icon: <Password />,
      url: "/api/ExecGetLocalAdminPassword",
      data: {
        GUID: "azureADDeviceId",
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to retrieve the local admin password for [deviceName]?",
      category: "security",
    },
    {
      label: "Rotate Local Admin Password",
      type: "POST",
      icon: <PasswordOutlined />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "RotateLocalAdminPassword",
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to rotate the password for [deviceName]?",
      category: "security",
    },
    {
      label: "Retrieve BitLocker Keys",
      type: "POST",
      icon: <Key />,
      url: "/api/ExecGetRecoveryKey",
      data: {
        GUID: "azureADDeviceId",
        RecoveryKeyType: "!BitLocker",
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to retrieve the BitLocker keys for [deviceName]?",
      category: "security",
    },
    {
      label: "Retrieve FileVault Key",
      type: "POST",
      icon: <Security />,
      url: "/api/ExecGetRecoveryKey",
      data: {
        GUID: "id",
        RecoveryKeyType: "!FileVault",
      },
      condition: (row) => row.operatingSystem === "macOS",
      confirmText: "Are you sure you want to retrieve the FileVault key for [deviceName]?",
      category: "security",
    },
    {
      label: "Reset Passcode",
      type: "POST",
      category: "security",
      icon: <PasswordOutlined />,
      url: "/api/ExecDevicePasscodeAction",
      data: {
        GUID: "id",
        Action: "resetPasscode",
      },
      condition: (row) => row.operatingSystem === "Android",
      confirmText:
        "Are you sure you want to reset the passcode for [deviceName]? A new passcode will be generated and displayed.",
    },
    {
      label: "Remove Passcode",
      type: "POST",
      icon: <Password />,
      url: "/api/ExecDevicePasscodeAction",
      data: {
        GUID: "id",
        Action: "resetPasscode",
      },
      condition: (row) => row.operatingSystem === "iOS",
      confirmText:
        "Are you sure you want to remove the passcode from [deviceName]? This will remove the device passcode requirement.",
    },
    {
      label: "Windows Defender Full Scan",
      type: "POST",
      icon: <Security />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "WindowsDefenderScan",
        quickScan: false,
      },
      confirmText: "Are you sure you want to perform a full scan on [deviceName]?",
    },
    {
      label: "Windows Defender Quick Scan",
      type: "POST",
      icon: <FindInPage />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "WindowsDefenderScan",
        quickScan: true,
      },
      confirmText: "Are you sure you want to perform a quick scan on [deviceName]?",
    },
    {
      label: "Update Windows Defender",
      type: "POST",
      icon: <Shield />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "windowsDefenderUpdateSignatures",
      },
      confirmText:
        "Are you sure you want to update the Windows Defender signatures for [deviceName]?",
    },
    {
      label: "Generate logs and ship to MEM",
      type: "POST",
      icon: <Archive />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "createDeviceLogCollectionRequest",
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText:
        "Are you sure you want to generate logs for device [deviceName] and ship these to MEM?",
    },
    {
      label: "Fresh Start (Remove user data)",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepUserData: false,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to Fresh Start [deviceName]?",
    },
    {
      label: "Fresh Start (Do not remove user data)",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepUserData: true,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to Fresh Start [deviceName]?",
    },
    {
      label: "Wipe Device, keep enrollment data",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepUserData: false,
        keepEnrollmentData: true,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to wipe [deviceName], and retain enrollment data?",
    },
    {
      label: "Wipe Device, remove enrollment data",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepUserData: false,
        keepEnrollmentData: false,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to wipe [deviceName], and remove enrollment data?",
    },
    {
      label: "Wipe Device, keep enrollment data, and continue at powerloss",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepEnrollmentData: true,
        keepUserData: false,
        useProtectedWipe: true,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText:
        "Are you sure you want to wipe [deviceName]? This will retain enrollment data. Continuing at powerloss may cause boot issues if wipe is interrupted.",
    },
    {
      label: "Wipe Device, remove enrollment data, and continue at powerloss",
      type: "POST",
      icon: <RestartAlt />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "cleanWindowsDevice",
        keepEnrollmentData: false,
        keepUserData: false,
        useProtectedWipe: true,
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText:
        "Are you sure you want to wipe [deviceName]? This will also remove enrollment data. Continuing at powerloss may cause boot issues if wipe is interrupted.",
    },
    {
      label: "Autopilot Reset",
      type: "POST",
      icon: <AutoMode />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "wipe",
        keepUserData: "false",
        keepEnrollmentData: "true",
      },
      condition: (row) => row.operatingSystem === "Windows",
      confirmText: "Are you sure you want to Autopilot Reset [deviceName]?",
    },
    {
      label: "Delete device",
      type: "POST",
      icon: <Recycling />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "delete",
      },
      confirmText: "Are you sure you want to delete [deviceName]?",
    },
    {
      label: "Retire device",
      type: "POST",
      icon: <Recycling />,
      url: "/api/ExecDeviceAction",
      data: {
        GUID: "id",
        Action: "retire",
      },
      confirmText: "Are you sure you want to retire [deviceName]?",
    },
  ];

  // Helper functions for device styling
  const getOSIcon = (os) => {
    const osLower = String(os || "").toLowerCase();
    if (osLower.includes("windows")) return <Computer fontSize="small" />;
    if (osLower.includes("ios") || osLower.includes("iphone") || osLower.includes("ipad")) return <PhoneIphone fontSize="small" />;
    if (osLower.includes("android")) return <PhoneAndroid fontSize="small" />;
    if (osLower.includes("macos") || osLower.includes("mac")) return <Laptop fontSize="small" />;
    return <Computer fontSize="small" />;
  };

  const getComplianceInfo = (state) => {
    switch (String(state || "").toLowerCase()) {
      case "compliant":
        return { label: "Compliant", color: theme.palette.success.main, icon: <CheckCircle fontSize="small" /> };
      case "noncompliant":
        return { label: "Non-Compliant", color: theme.palette.error.main, icon: <Cancel fontSize="small" /> };
      case "ingraceperiod":
        return { label: "In Grace Period", color: theme.palette.warning.main, icon: <Warning fontSize="small" /> };
      default:
        return { label: "Unknown", color: theme.palette.grey[500], icon: <Help fontSize="small" /> };
    }
  };

  const offCanvas = {
    actions: actions,
    children: (row) => {
      const complianceInfo = getComplianceInfo(row.complianceState);
      const osIcon = getOSIcon(row.operatingSystem);
      
      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(complianceInfo.color, 0.15)} 0%, ${alpha(complianceInfo.color, 0.05)} 100%)`,
              borderLeft: `4px solid ${complianceInfo.color}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: stringToColor(row.deviceName || "D"),
                  width: 56,
                  height: 56,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}
              >
                {osIcon}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                  {row.deviceName || "Unknown Device"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {row.userPrincipalName || "No user assigned"}
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
              Compliance Status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={complianceInfo.icon}
                label={complianceInfo.label}
                sx={{ 
                  fontWeight: 600, 
                  bgcolor: alpha(complianceInfo.color, 0.1),
                  color: complianceInfo.color,
                  borderColor: complianceInfo.color,
                }}
                variant="outlined"
              />
              {row.managedDeviceOwnerType && (
                <Chip
                  label={row.managedDeviceOwnerType === "company" ? "Corporate" : "Personal"}
                  color={row.managedDeviceOwnerType === "company" ? "primary" : "default"}
                  variant="outlined"
                  size="small"
                />
              )}
              {row.isEncrypted && (
                <Chip
                  icon={<Security fontSize="small" />}
                  label="Encrypted"
                  color="success"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Device Information */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <InfoIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Device Information
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Operating System</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.operatingSystem}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">OS Version</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.osVersion}
                </Typography>
              </Stack>
              {row.manufacturer && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.manufacturer}
                  </Typography>
                </Stack>
              )}
              {row.model && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Model</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.model}
                  </Typography>
                </Stack>
              )}
              {row.serialNumber && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Serial Number</Typography>
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
                    {row.serialNumber}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* User & Enrollment */}
          <Divider />
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                User & Enrollment
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {row.userPrincipalName && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Primary User</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {row.userPrincipalName}
                  </Typography>
                </Stack>
              )}
              {row.deviceEnrollmentType && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Enrollment Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.deviceEnrollmentType}
                  </Typography>
                </Stack>
              )}
              {row.joinType && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Join Type</Typography>
                  <Chip label={row.joinType} size="small" variant="outlined" />
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
                Timeline
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {row.enrolledDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Enrolled</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.enrolledDateTime, "enrolledDateTime")}
                  </Typography>
                </Stack>
              )}
              {row.lastSyncDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Last Sync</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.lastSyncDateTime, "lastSyncDateTime")}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Device ID</Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: "monospace",
                    bgcolor: alpha(theme.palette.text.primary, 0.05),
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.5,
                    maxWidth: 180,
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
      apiData={{
        Endpoint: "deviceManagement/managedDevices",
      }}
      apiDataKey="Results"
      actions={actions}
      queryKey={`MEMDevices-${tenantFilter}`}
      offCanvas={offCanvas}
      simpleColumns={[
        "deviceName",
        "userPrincipalName",
        "complianceState",
        "manufacturer",
        "model",
        "operatingSystem",
        "osVersion",
        "enrolledDateTime",
        "managedDeviceOwnerType",
        "deviceEnrollmentType",
        "joinType",
      ]}
      cardConfig={cardConfig}
      offCanvasOnRowClick={true}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
