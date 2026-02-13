import { Layout as DashboardLayout } from "../../../../../layouts/index.js";
import { useSettings } from "../../../../../hooks/use-settings";
import { useRouter } from "next/router";
import { ApiGetCall } from "../../../../../api/ApiCall";
import CippFormSkeleton from "../../../../../components/CippFormPages/CippFormSkeleton";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import { 
  Mail, 
  Fingerprint, 
  Launch,
  Computer,
  PhoneAndroid,
  PhoneIphone,
  Laptop,
  CheckCircle,
  Cancel,
  Warning,
  Sync,
  OpenInNew,
  Schedule,
  Devices,
  Dns,
  WifiOff,
  Wifi,
  Memory,
  Storage,
} from "@mui/icons-material";
import { HeaderedTabbedLayout } from "../../../../../layouts/HeaderedTabbedLayout";
import tabOptions from "./tabOptions";
import { CippCopyToClipBoard } from "../../../../../components/CippComponents/CippCopyToClipboard";
import { CippTimeAgo } from "../../../../../components/CippComponents/CippTimeAgo";
import { Box, Stack } from "@mui/system";
import { Grid } from "@mui/system";
import { 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  CardActionArea,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useCippUserActions } from "../../../../../components/CippComponents/CippUserActions";
import { memo, useMemo, useCallback } from "react";

// Device Card Component - Memoized to prevent unnecessary re-renders
const DeviceCard = memo(({ device, tenant, theme }) => {
  const getOSIcon = (os) => {
    const osLower = String(os || "").toLowerCase();
    if (osLower.includes("windows")) return <Computer />;
    if (osLower.includes("ios") || osLower.includes("iphone") || osLower.includes("ipad")) return <PhoneIphone />;
    if (osLower.includes("android")) return <PhoneAndroid />;
    if (osLower.includes("macos") || osLower.includes("mac")) return <Laptop />;
    return <Computer />;
  };

  const getComplianceInfo = () => {
    if (device.isCompliant === true) {
      return { label: "Compliant", color: "success", icon: <CheckCircle fontSize="small" /> };
    } else if (device.isCompliant === false) {
      return { label: "Non-Compliant", color: "error", icon: <Cancel fontSize="small" /> };
    }
    return { label: "Unknown", color: "default", icon: <Warning fontSize="small" /> };
  };

  // Color-code by compliance state
  const getBorderColor = () => {
    if (!device.accountEnabled) return theme.palette.error.main;
    if (device.isCompliant === true) return theme.palette.success.main;
    if (device.isCompliant === false) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  const getOSColor = (os) => {
    const osLower = String(os || "").toLowerCase();
    if (osLower.includes("windows")) return theme.palette.info.main;
    if (osLower.includes("ios") || osLower.includes("iphone") || osLower.includes("ipad") || osLower.includes("macos") || osLower.includes("mac")) return theme.palette.grey[700];
    if (osLower.includes("android")) return theme.palette.success.main;
    return theme.palette.primary.main;
  };

  const complianceInfo = getComplianceInfo();
  const osIcon = getOSIcon(device.operatingSystem);
  const osColor = getOSColor(device.operatingSystem);
  const borderColor = getBorderColor();

  const entraUrl = `https://entra.microsoft.com/${tenant}/#view/Microsoft_AAD_Devices/DeviceDetailsMenuBlade/~/Properties/objectId/${device.id}`;
  const intuneUrl = `https://intune.microsoft.com/${tenant}/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview/mdmDeviceId/${device.id}`;

  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: "100%",
        borderLeft: `4px solid ${borderColor}`,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header with device name and actions */}
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: alpha(osColor, 0.1),
              color: osColor,
              width: 48,
              height: 48,
            }}
          >
            {osIcon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {device.displayName || "Unknown Device"}
              </Typography>
              <Stack direction="row" spacing={0}>
                <Tooltip title="View in Entra">
                  <IconButton
                    size="small"
                    href={entraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                {device.isManaged && (
                  <Tooltip title="View in Intune">
                    <IconButton
                      size="small"
                      href={intuneUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Devices fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {device.operatingSystem} {device.operatingSystemVersion}
            </Typography>
          </Box>
        </Stack>

        {/* Source Presence */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
          <Chip label="Entra" color="info" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }} />
          {device.isManaged ? (
            <Chip label="Intune" color="primary" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }} />
          ) : (
            <Chip label="Intune" size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.65rem", height: 20, opacity: 0.4 }} />
          )}
          {device.ninjaDeviceId ? (
            <Chip label="NinjaOne" color="success" size="small" variant="filled" sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }} />
          ) : (
            <Chip label="NinjaOne" size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: "0.65rem", height: 20, opacity: 0.4 }} />
          )}
        </Stack>

        {/* Status Chips */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Chip
            icon={complianceInfo.icon}
            label={complianceInfo.label}
            color={complianceInfo.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
          {device.isManaged && (
            <Chip
              icon={<Sync fontSize="small" />}
              label="Managed"
              color="info"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          )}
          {!device.accountEnabled && (
            <Chip label="Disabled" color="error" variant="outlined" size="small" />
          )}
          {device.trustType && (
            <Chip
              label={device.trustType}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: "0.7rem" }}
            />
          )}
          {device.ninjaDeviceId && (
            <Chip
              icon={device.ninjaOffline ? <WifiOff sx={{ fontSize: 14 }} /> : <Wifi sx={{ fontSize: 14 }} />}
              label={device.ninjaOffline ? "Offline" : "Online"}
              color={device.ninjaOffline ? "default" : "success"}
              variant="outlined"
              size="small"
            />
          )}
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* Device Details */}
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          {(device.manufacturer || device.model) && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Device</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right" }}>
                {[device.manufacturer, device.model].filter(Boolean).join(" ")}
              </Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">Relationship</Typography>
            <Chip
              label={device.relationship}
              size="small"
              color={device.relationship === "Registered & Owned" ? "primary" : "default"}
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          </Stack>
          {device.approximateLastSignInDateTime && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">Last Sign-In</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Schedule fontSize="small" sx={{ color: "text.secondary", fontSize: 14 }} />
                <Typography variant="body2">
                  <CippTimeAgo data={device.approximateLastSignInDateTime} />
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>

        {/* NinjaOne Hardware — shown only when enrichment data is present */}
        {device.ninjaDeviceId && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.info.main, 0.04),
                border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
              }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Dns sx={{ fontSize: 13, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    NinjaOne Hardware
                  </Typography>
                </Stack>
                {device.ninjaCpuName && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Memory sx={{ fontSize: 13, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">CPU</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }} noWrap>
                      {device.ninjaCpuName}{device.ninjaCpuCores ? ` (${device.ninjaCpuCores}c)` : ""}
                    </Typography>
                  </Stack>
                )}
                {device.ninjaTotalRamGB != null && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Storage sx={{ fontSize: 13, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">RAM</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {device.ninjaTotalRamGB} GB
                    </Typography>
                  </Stack>
                )}
                {device.ninjaOsName && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">OS</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500, textAlign: "right", maxWidth: "65%" }} noWrap>
                      {device.ninjaOsName}{device.ninjaOsBuild ? ` (${device.ninjaOsBuild})` : ""}
                    </Typography>
                  </Stack>
                )}
                {device.ninjaDomain && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Domain</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>{device.ninjaDomain}</Typography>
                  </Stack>
                )}
                {device.ninjaLastContact && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Last Contact</Typography>
                    <Typography variant="caption">
                      <CippTimeAgo data={device.ninjaLastContact} />
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
});

DeviceCard.displayName = "DeviceCard";

const Page = () => {
  const userSettingsDefaults = useSettings();
  const router = useRouter();
  const { userId } = router.query;
  const tenant = userSettingsDefaults.currentTenant;
  const theme = useTheme();
  const userActions = useCippUserActions();

  const userRequest = ApiGetCall({
    url: `/api/ListUsers?UserId=${userId}&tenantFilter=${tenant}`,
    queryKey: `ListUsers-${userId}`,
  });

  // Get user's registered devices (devices they've registered in Entra)
  const registeredDevices = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: `users/${userId}/registeredDevices`,
      tenantFilter: tenant,
      $select: "id,displayName,deviceId,operatingSystem,operatingSystemVersion,trustType,approximateLastSignInDateTime,accountEnabled,manufacturer,model,isCompliant,isManaged",
    },
    queryKey: `UserRegisteredDevices-${userId}`,
    waiting: !!userId,
  });

  // Get user's owned devices
  const ownedDevices = ApiGetCall({
    url: "/api/ListGraphRequest",
    data: {
      Endpoint: `users/${userId}/ownedDevices`,
      tenantFilter: tenant,
      $select: "id,displayName,deviceId,operatingSystem,operatingSystemVersion,trustType,approximateLastSignInDateTime,accountEnabled,manufacturer,model,isCompliant,isManaged",
    },
    queryKey: `UserOwnedDevices-${userId}`,
    waiting: !!userId,
  });

  // Fetch NinjaOne enrichment data (runs in parallel)
  const ninjaDevices = ApiGetCall({
    url: "/api/ListNinjaDeviceInfo",
    data: { TenantFilter: tenant },
    queryKey: `NinjaDevices-${tenant}`,
    waiting: !!tenant,
  });

  // Build NinjaOne lookup map keyed by azureADDeviceId (= Entra device "id")
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

  // Set the title and subtitle for the layout
  const title = userRequest.isSuccess ? userRequest.data?.[0]?.displayName : "Loading...";

  // Memoize subtitle to prevent recreation on every render
  const subtitle = useMemo(() => {
    if (!userRequest.isSuccess) return [];
    const userData = userRequest.data?.[0];
    return [
      {
        icon: <Mail />,
        text: <CippCopyToClipBoard type="chip" text={userData?.userPrincipalName} />,
      },
      {
        icon: <Fingerprint />,
        text: <CippCopyToClipBoard type="chip" text={userData?.id} />,
      },
      {
        icon: <CalendarIcon />,
        text: (
          <>
            Created: <CippTimeAgo data={userData?.createdDateTime} />
          </>
        ),
      },
      {
        icon: <Launch style={{ color: "#757575" }} />,
        text: (
          <Button
            color="muted"
            style={{ paddingLeft: 0 }}
            size="small"
            href={`https://entra.microsoft.com/${tenant}/#view/Microsoft_AAD_UsersAndTenants/UserProfileMenuBlade/~/overview/userId/${userId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View in Entra
          </Button>
        ),
      },
    ];
  }, [userRequest.isSuccess, userRequest.data, tenant, userId]);

  // Combine, deduplicate, and enrich devices - memoized for performance
  const allDevices = useMemo(() => {
    const registeredDevicesList = registeredDevices.data?.Results || [];
    const ownedDevicesList = ownedDevices.data?.Results || [];
    
    // Create a map to deduplicate by device ID
    const deviceMap = new Map();
    registeredDevicesList.forEach(device => {
      deviceMap.set(device.id, { ...device, relationship: "Registered" });
    });
    ownedDevicesList.forEach(device => {
      if (deviceMap.has(device.id)) {
        deviceMap.set(device.id, { ...deviceMap.get(device.id), relationship: "Registered & Owned" });
      } else {
        deviceMap.set(device.id, { ...device, relationship: "Owned" });
      }
    });

    // Merge NinjaOne enrichment data into each device
    return Array.from(deviceMap.values()).map((device) => {
      const ninja = ninjaLookup[device.id];
      return ninja ? { ...device, ...ninja } : device;
    });
  }, [registeredDevices.data?.Results, ownedDevices.data?.Results, ninjaLookup]);

  const isLoading = userRequest.isLoading || registeredDevices.isLoading || ownedDevices.isLoading;

  // Calculate stats - memoized for performance
  const { totalDevices, compliantDevices, nonCompliantDevices, managedDevices } = useMemo(() => ({
    totalDevices: allDevices.length,
    compliantDevices: allDevices.filter(d => d.isCompliant === true).length,
    nonCompliantDevices: allDevices.filter(d => d.isCompliant === false).length,
    managedDevices: allDevices.filter(d => d.isManaged === true).length,
  }), [allDevices]);

  return (
    <HeaderedTabbedLayout
      tabOptions={tabOptions}
      title={title}
      subtitle={subtitle}
      actions={userActions}
      actionsData={userRequest.data?.[0]}
      isFetching={userRequest.isLoading}
    >
      {isLoading && <CippFormSkeleton layout={[2, 1, 2, 2]} />}
      {userRequest.isSuccess && (
        <Box
          sx={{
            flexGrow: 1,
            py: 2,
          }}
        >
          {/* Summary Stats Bar */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                spacing={{ xs: 2, sm: 4 }}
                divider={<Divider orientation="vertical" flexItem />}
                justifyContent="center"
                alignItems="center"
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 36, height: 36 }}>
                    <Devices sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {totalDevices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Devices
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 36, height: 36 }}>
                    <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {compliantDevices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Compliant
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), width: 36, height: 36 }}>
                    <Cancel sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {nonCompliantDevices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Non-Compliant
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), width: 36, height: 36 }}>
                    <Sync sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {managedDevices}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Managed
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Device Cards Grid */}
          {allDevices.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Devices sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Devices Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This user has no registered or owned devices.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {allDevices.map((device) => (
                <Grid key={device.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <DeviceCard device={device} tenant={tenant} theme={theme} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </HeaderedTabbedLayout>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
