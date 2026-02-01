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

  const entraUrl = `https://entra.microsoft.com/${tenant}/#view/Microsoft_AAD_Devices/DeviceDetailsMenuBlade/~/Properties/objectId/${device.id}`;

  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Header with device name and actions */}
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
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
              <Tooltip title="View in Entra">
                <IconButton
                  size="small"
                  href={entraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ ml: 1 }}
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {device.operatingSystem} {device.operatingSystemVersion}
            </Typography>
          </Box>
        </Stack>

        {/* Status Chips */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
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
            <Chip
              label="Disabled"
              color="error"
              variant="outlined"
              size="small"
            />
          )}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Device Details */}
        <Stack spacing={1}>
          {(device.manufacturer || device.model) && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Device
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right" }}>
                {[device.manufacturer, device.model].filter(Boolean).join(" ")}
              </Typography>
            </Stack>
          )}
          {device.trustType && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Trust Type
              </Typography>
              <Chip 
                label={device.trustType} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Relationship
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {device.relationship}
            </Typography>
          </Stack>
          {device.approximateLastSignInDateTime && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Last Sign-In
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Schedule fontSize="small" sx={{ color: "text.secondary", fontSize: 14 }} />
                <Typography variant="body2">
                  <CippTimeAgo data={device.approximateLastSignInDateTime} />
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
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

  // Combine and deduplicate devices - memoized for performance
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
    
    return Array.from(deviceMap.values());
  }, [registeredDevices.data?.Results, ownedDevices.data?.Results]);

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
