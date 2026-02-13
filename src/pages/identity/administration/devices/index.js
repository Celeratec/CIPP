import { useCallback, useMemo } from "react";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { ApiGetCall } from "../../../../api/ApiCall.jsx";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
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
  Visibility,
  CheckCircleOutline,
  Block,
  VpnKey,
  DeleteForever,
  Business,
  Devices,
  Schedule,
  VerifiedUser,
  Person,
  Computer,
  PhoneAndroid,
  PhoneIphone,
  Laptop,
  CheckCircle,
  Cancel,
  Warning,
  Help,
  Info as InfoIcon,
  CalendarToday,
  Dns,
  WifiOff,
  Wifi,
  Memory,
  Storage,
} from "@mui/icons-material";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import { stringToColor } from "../../../../utils/get-initials";

const Page = () => {
  const pageTitle = "Devices";
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();

  // Fetch NinjaOne enrichment data (runs in parallel with the Entra fetch)
  const ninjaDevices = ApiGetCall({
    url: "/api/ListNinjaDeviceInfo",
    data: { TenantFilter: tenantFilter },
    queryKey: `NinjaDevices-${tenantFilter}`,
    waiting: !!tenantFilter,
  });

  // Build lookup map keyed by azureADDeviceId (which is the Entra device object "id")
  const ninjaLookup = useMemo(() => {
    const map = {};
    const raw = ninjaDevices.data;
    const arr = Array.isArray(raw) ? raw : raw?.Results;
    if (arr) {
      arr.forEach((d) => {
        if (d.azureADDeviceId) map[d.azureADDeviceId] = d;
      });
    }
    return map;
  }, [ninjaDevices.data]);

  const hasNinjaData = Object.keys(ninjaLookup).length > 0;

  // Merge NinjaOne fields into each Entra device row
  const mergeNinjaData = useCallback(
    (devices) => {
      if (!hasNinjaData) return devices;
      return devices.map((device) => {
        const ninja = ninjaLookup[device.id];
        return ninja ? { ...device, ...ninja } : device;
      });
    },
    [ninjaLookup, hasNinjaData]
  );

  // Helper functions for device styling
  const getOSIcon = (os) => {
    const osLower = String(os || "").toLowerCase();
    if (osLower.includes("windows")) return <Computer fontSize="small" />;
    if (osLower.includes("ios") || osLower.includes("iphone") || osLower.includes("ipad"))
      return <PhoneIphone fontSize="small" />;
    if (osLower.includes("android")) return <PhoneAndroid fontSize="small" />;
    if (osLower.includes("macos") || osLower.includes("mac")) return <Laptop fontSize="small" />;
    return <Computer fontSize="small" />;
  };

  // Card view configuration
  const cardConfig = {
    title: "displayName",
    subtitle: "operatingSystem",
    avatar: {
      field: "displayName",
    },
    // Color-code left border by enabled/disabled status
    cardSx: (item) => {
      if (item.accountEnabled === false) return { borderLeft: `4px solid ${theme.palette.error.main}` };
      if (item.isCompliant === true) return { borderLeft: `4px solid ${theme.palette.success.main}` };
      if (item.isCompliant === false) return { borderLeft: `4px solid ${theme.palette.warning.main}` };
      return { borderLeft: `4px solid ${theme.palette.primary.main}` };
    },
    badges: [
      {
        field: "accountEnabled",
        conditions: {
          true: { icon: "check", color: "success", label: "Enabled" },
          false: { icon: "cancel", color: "error", label: "Disabled" },
        },
      },
      {
        field: "trustType",
        conditions: {
          AzureAd: { label: "Azure AD Joined", color: "primary" },
          ServerAd: { label: "Domain Joined", color: "info" },
          Workplace: { label: "Workplace Joined", color: "default" },
        },
      },
      // Source presence indicators — show which systems this device exists in
      {
        field: "id",
        transform: (v) => (v ? "yes" : null),
        conditions: { yes: { label: "Entra", color: "info" } },
      },
      {
        field: "isManaged",
        transform: (v) => (v === true ? "yes" : null),
        conditions: { yes: { label: "Intune", color: "primary" } },
      },
      {
        field: "ninjaDeviceId",
        transform: (v) => (v ? "yes" : null),
        conditions: { yes: { label: "NinjaOne", color: "success" } },
      },
    ],
    extraFields: [
      [
        { field: "manufacturer", icon: <Business />, maxLines: 1 },
        { field: "model", icon: <Devices />, maxLines: 1 },
      ],
    ],
    extraFieldsMax: 3,
    // NinjaOne hardware summary rendered as custom content
    customContent: (item) => {
      if (!item.ninjaDeviceId) return null;
      return (
        <Box
          sx={{
            mt: 1,
            mb: 0.5,
            p: 1,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.info.main, 0.04),
            border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Dns sx={{ fontSize: 12, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                NinjaOne
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {item.ninjaCpuName && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Memory sx={{ fontSize: 12, color: "text.secondary" }} />
                  <Typography variant="caption" noWrap sx={{ maxWidth: 140 }}>
                    {item.ninjaCpuName}
                  </Typography>
                </Stack>
              )}
              {item.ninjaTotalRamGB != null && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Storage sx={{ fontSize: 12, color: "text.secondary" }} />
                  <Typography variant="caption">{item.ninjaTotalRamGB} GB</Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Box>
      );
    },
    desktopFields: [
      { field: "operatingSystemVersion", label: "OS Version" },
      { field: "enrollmentType", label: "Enrollment" },
      { field: "approximateLastSignInDateTime", label: "Last Sign-In" },
      { field: "profileType", label: "Profile" },
    ],
    desktopFieldsMax: 4,
    desktopFieldsLayout: "column",
    cardGridProps: {
      xs: 12,
      sm: 6,
      md: 4,
      lg: 3,
    },
  };

  const actions = [
    {
      label: "View in Entra",
      link: `https://entra.microsoft.com/${tenantFilter}/#view/Microsoft_AAD_Devices/DeviceDetailsMenuBlade/~/Properties/objectId/[id]/deviceId/`,
      color: "info",
      icon: <Visibility />,
      target: "_blank",
      multiPost: false,
      external: true,
      category: "view",
    },
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
      label: "Enable Device",
      type: "POST",
      url: "/api/ExecDeviceDelete",
      data: {
        ID: "id",
        action: "!Enable",
      },
      confirmText: "Are you sure you want to enable this device?",
      multiPost: false,
      condition: (row) => !row.accountEnabled,
      icon: <CheckCircleOutline />,
      category: "edit",
    },
    {
      label: "Disable Device",
      type: "POST",
      url: "/api/ExecDeviceDelete",
      data: {
        ID: "id",
        action: "!Disable",
      },
      confirmText: "Are you sure you want to disable this device?",
      multiPost: false,
      condition: (row) => row.accountEnabled,
      icon: <Block />,
      category: "edit",
    },
    {
      label: "Retrieve BitLocker Keys",
      type: "POST",
      url: "/api/ExecGetRecoveryKey",
      data: {
        GUID: "deviceId",
      },
      confirmText: "Are you sure you want to retrieve the BitLocker keys?",
      multiPost: false,
      icon: <VpnKey />,
      category: "security",
    },
    {
      label: "Delete Device",
      type: "POST",
      url: "/api/ExecDeviceDelete",
      data: {
        ID: "id",
        action: "!Delete",
      },
      confirmText: "Are you sure you want to delete this device?",
      multiPost: false,
      icon: <DeleteForever />,
      category: "danger",
    },
  ];

  const offCanvas = {
    actions: actions,
    children: (row) => {
      const osIcon = getOSIcon(row.operatingSystem);
      const isEnabled = row.accountEnabled === true;
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
              <Avatar
                sx={{
                  bgcolor: stringToColor(row.displayName || "D"),
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
                  {row.displayName || "Unknown Device"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {row.operatingSystem} {row.operatingSystemVersion}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Source Presence */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 1, mb: 1, display: "block" }}
            >
              Sources
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip label="Entra" color="info" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
              {row.isManaged ? (
                <Chip label="Intune" color="primary" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
              ) : (
                <Chip label="Intune" size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.7rem", opacity: 0.4 }} />
              )}
              {row.ninjaDeviceId ? (
                <Chip label="NinjaOne" color="success" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />
              ) : (
                <Chip label="NinjaOne" size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.7rem", opacity: 0.4 }} />
              )}
            </Stack>
          </Box>

          {/* Status Badges */}
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={isEnabled ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                label={isEnabled ? "Enabled" : "Disabled"}
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(statusColor, 0.1),
                  color: statusColor,
                  borderColor: statusColor,
                }}
                variant="outlined"
              />
              {row.trustType && (
                <Chip
                  icon={<VerifiedUser fontSize="small" />}
                  label={row.trustType}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {row.isCompliant === true && (
                <Chip
                  icon={<CheckCircle fontSize="small" />}
                  label="Compliant"
                  color="success"
                  variant="outlined"
                  size="small"
                />
              )}
              {row.isCompliant === false && (
                <Chip
                  icon={<Cancel fontSize="small" />}
                  label="Non-Compliant"
                  color="error"
                  variant="outlined"
                  size="small"
                />
              )}
              {row.isManaged && (
                <Chip label="Managed" color="info" variant="outlined" size="small" />
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
              {row.manufacturer && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.manufacturer}</Typography>
                </Stack>
              )}
              {row.model && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Model</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.model}</Typography>
                </Stack>
              )}
              {row.enrollmentType && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Enrollment Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.enrollmentType}</Typography>
                </Stack>
              )}
              {row.profileType && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Profile Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.profileType}</Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* NinjaOne Hardware — shown only when enrichment data is present */}
          {row.ninjaDeviceId && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Dns fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    NinjaOne Hardware
                  </Typography>
                  <Chip
                    icon={
                      row.ninjaOffline ? (
                        <WifiOff sx={{ fontSize: 14 }} />
                      ) : (
                        <Wifi sx={{ fontSize: 14 }} />
                      )
                    }
                    label={row.ninjaOffline ? "Offline" : "Online"}
                    color={row.ninjaOffline ? "default" : "success"}
                    variant="outlined"
                    size="small"
                    sx={{ ml: "auto" }}
                  />
                </Stack>
                <Stack spacing={1}>
                  {row.ninjaCpuName && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">CPU</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.ninjaCpuName}{row.ninjaCpuCores ? ` (${row.ninjaCpuCores} cores)` : ""}
                      </Typography>
                    </Stack>
                  )}
                  {row.ninjaTotalRamGB != null && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Memory</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.ninjaTotalRamGB} GB
                      </Typography>
                    </Stack>
                  )}
                  {row.ninjaOsName && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">OS (NinjaOne)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.ninjaOsName}{row.ninjaOsBuild ? ` (${row.ninjaOsBuild})` : ""}
                      </Typography>
                    </Stack>
                  )}
                  {row.ninjaOsArch && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Architecture</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.ninjaOsArch}</Typography>
                    </Stack>
                  )}
                  {row.ninjaLastBootTime && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Last Boot</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getCippFormatting(row.ninjaLastBootTime, "ninjaLastBootTime")}
                      </Typography>
                    </Stack>
                  )}
                  {row.ninjaDomain && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Domain</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.ninjaDomain}</Typography>
                    </Stack>
                  )}
                  {row.ninjaLastContact && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Last NinjaOne Contact</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getCippFormatting(row.ninjaLastContact, "ninjaLastContact")}
                      </Typography>
                    </Stack>
                  )}
                  {row.ninjaNodeClass && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Device Class</Typography>
                      <Chip label={row.ninjaNodeClass} size="small" variant="outlined" />
                    </Stack>
                  )}
                </Stack>
              </Box>
            </>
          )}

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
              {row.approximateLastSignInDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Last Sign-In</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.approximateLastSignInDateTime, "approximateLastSignInDateTime")}
                  </Typography>
                </Stack>
              )}
              {row.registrationDateTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Registered</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.registrationDateTime, "registrationDateTime")}
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

  // Build simpleColumns — conditionally add NinjaOne columns
  const simpleColumns = useMemo(() => {
    const base = [
      "displayName",
      "accountEnabled",
      "trustType",
      "enrollmentType",
      "manufacturer",
      "model",
      "operatingSystem",
      "operatingSystemVersion",
      "profileType",
      "approximateLastSignInDateTime",
    ];

    if (!hasNinjaData) return base;

    return [...base, "ninjaCpuName", "ninjaTotalRamGB", "ninjaOffline", "ninjaLastContact"];
  }, [hasNinjaData]);

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListGraphRequest"
      apiData={{
        Endpoint: "devices",
        $format: "application/json",
        $count: true,
      }}
      apiDataKey="Results"
      apiDataFilter={mergeNinjaData}
      queryKey={`EntraDevices-${tenantFilter}`}
      actions={actions}
      offCanvas={offCanvas}
      simpleColumns={simpleColumns}
      cardConfig={cardConfig}
      offCanvasOnRowClick={true}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
