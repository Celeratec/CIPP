import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { useSettings } from "/src/hooks/use-settings";
import { useRouter } from "next/router";
import { ApiGetCall } from "/src/api/ApiCall";
import CippFormSkeleton from "/src/components/CippFormPages/CippFormSkeleton";
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
  Visibility,
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
  Paper,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CippDataTable } from "/src/components/CippTable/CippDataTable";
import { useCippUserActions } from "/src/components/CippComponents/CippUserActions";
import { getCippFormatting } from "/src/utils/get-cipp-formatting";
import { stringToColor } from "/src/utils/get-initials";

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

  const subtitle = userRequest.isSuccess
    ? [
        {
          icon: <Mail />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.userPrincipalName} />,
        },
        {
          icon: <Fingerprint />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.id} />,
        },
        {
          icon: <CalendarIcon />,
          text: (
            <>
              Created: <CippTimeAgo data={userRequest.data?.[0]?.createdDateTime} />
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
      ]
    : [];

  const getOSIcon = (os) => {
    const osLower = String(os || "").toLowerCase();
    if (osLower.includes("windows")) return <Computer fontSize="small" />;
    if (osLower.includes("ios") || osLower.includes("iphone") || osLower.includes("ipad")) return <PhoneIphone fontSize="small" />;
    if (osLower.includes("android")) return <PhoneAndroid fontSize="small" />;
    if (osLower.includes("macos") || osLower.includes("mac")) return <Laptop fontSize="small" />;
    return <Computer fontSize="small" />;
  };

  const getComplianceInfo = (device) => {
    if (device.isCompliant === true) {
      return { label: "Compliant", color: "success", icon: <CheckCircle fontSize="small" /> };
    } else if (device.isCompliant === false) {
      return { label: "Non-Compliant", color: "error", icon: <Cancel fontSize="small" /> };
    }
    return { label: "Unknown", color: "default", icon: <Warning fontSize="small" /> };
  };

  const deviceActions = [
    {
      label: "View in Entra",
      link: `https://entra.microsoft.com/${tenant}/#view/Microsoft_AAD_Devices/DeviceDetailsMenuBlade/~/Properties/objectId/[id]/deviceId/`,
      color: "info",
      icon: <Visibility />,
      target: "_blank",
      external: true,
    },
  ];

  // Combine and deduplicate devices
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
  
  const allDevices = Array.from(deviceMap.values());

  const isLoading = userRequest.isLoading || registeredDevices.isLoading || ownedDevices.isLoading;
  const isFetching = registeredDevices.isFetching || ownedDevices.isFetching;

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
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid size={12}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          <Computer sx={{ color: theme.palette.primary.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">{allDevices.length}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Devices
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                          <CheckCircle sx={{ color: theme.palette.success.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {allDevices.filter(d => d.isCompliant === true).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Compliant
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                          <Cancel sx={{ color: theme.palette.error.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {allDevices.filter(d => d.isCompliant === false).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Non-Compliant
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                          <Sync sx={{ color: theme.palette.info.main }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h4">
                            {allDevices.filter(d => d.isManaged === true).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Managed
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Devices Table */}
            <Grid size={12}>
              <CippDataTable
                title="User Devices"
                data={allDevices}
                isFetching={isFetching}
                simpleColumns={[
                  "displayName",
                  "operatingSystem",
                  "operatingSystemVersion",
                  "manufacturer",
                  "model",
                  "trustType",
                  "isCompliant",
                  "isManaged",
                  "relationship",
                  "approximateLastSignInDateTime",
                ]}
                actions={deviceActions}
                offCanvas={{
                  children: (row) => {
                    const complianceInfo = getComplianceInfo(row);
                    const osIcon = getOSIcon(row.operatingSystem);
                    
                    return (
                      <Stack spacing={3}>
                        {/* Hero Section */}
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: stringToColor(row.displayName || "D"),
                                width: 56,
                                height: 56,
                              }}
                            >
                              {osIcon}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25 }}>
                                {row.displayName || "Unknown Device"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {row.operatingSystem} {row.operatingSystemVersion}
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
                            Device Status
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                              icon={complianceInfo.icon}
                              label={complianceInfo.label}
                              color={complianceInfo.color}
                              variant="outlined"
                              size="small"
                            />
                            {row.isManaged && (
                              <Chip
                                icon={<Sync fontSize="small" />}
                                label="Managed"
                                color="info"
                                variant="outlined"
                                size="small"
                              />
                            )}
                            <Chip
                              label={row.accountEnabled ? "Enabled" : "Disabled"}
                              color={row.accountEnabled ? "success" : "error"}
                              variant="outlined"
                              size="small"
                            />
                            <Chip
                              label={row.relationship}
                              color="default"
                              variant="outlined"
                              size="small"
                            />
                          </Stack>
                        </Box>

                        <Divider />

                        {/* Device Details */}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                            Device Information
                          </Typography>
                          <Stack spacing={1}>
                            {row.manufacturer && (
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.manufacturer}</Typography>
                              </Stack>
                            )}
                            {row.model && (
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Model</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.model}</Typography>
                              </Stack>
                            )}
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Trust Type</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.trustType || "N/A"}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Last Sign-In</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {row.approximateLastSignInDateTime 
                                  ? getCippFormatting(row.approximateLastSignInDateTime, "approximateLastSignInDateTime")
                                  : "N/A"}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>
                    );
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </HeaderedTabbedLayout>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
