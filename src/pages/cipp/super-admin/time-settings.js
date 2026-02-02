import { TabbedLayout } from "../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { useForm } from "react-hook-form";
import {
  Alert,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Box,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { ApiGetCall } from "../../../api/ApiCall";
import { useEffect, useMemo } from "react";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import { useTimezones } from "../../../hooks/use-timezones";
import tabOptions from "./tabOptions";
import {
  ClockIcon,
  GlobeAltIcon,
  ServerIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";

const Page = () => {
  const pageTitle = "Time Settings";

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      Timezone: { label: "UTC", value: "UTC" },
      BusinessHoursStart: { label: "09:00", value: "09:00" },
    },
  });

  // Get timezone and backend info
  const backendInfo = ApiGetCall({
    url: "/api/ExecBackendURLs",
    queryKey: "backendInfo",
  });

  const { timezones, loading: timezonesLoading } = useTimezones();
  const isFlexConsumption = backendInfo.data?.Results?.SKU === "FlexConsumption";
  const currentTimezone = backendInfo.data?.Results?.Timezone || "UTC";
  const currentBusinessHours = backendInfo.data?.Results?.BusinessHoursStart || "09:00";
  const appServicePlan = backendInfo.data?.Results?.SKU || "Unknown";

  // Generate business hours options (00:00 to 23:00 in hourly increments)
  const businessHoursOptions = useMemo(() => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      hours.push({
        label: `${hour}:00`,
        value: `${hour}:00`,
      });
    }
    return hours;
  }, []);

  // Calculate business hours end time (10 hours after start)
  const getBusinessHoursEnd = (startTime) => {
    if (!startTime) return "19:00";
    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = (startHour + 10) % 24;
    return `${endHour.toString().padStart(2, "0")}:00`;
  };

  useEffect(() => {
    if (backendInfo.isSuccess && backendInfo.data) {
      const tzStr = backendInfo.data?.Results?.Timezone || "UTC";
      const tzOption = (timezones || []).find(
        (o) => o?.value === tzStr || o?.alternativeName === tzStr
      ) || {
        label: tzStr,
        value: tzStr,
      };

      const startStr = backendInfo.data?.Results?.BusinessHoursStart || "09:00";
      const startOption = businessHoursOptions.find((o) => o.value === startStr) || {
        label: startStr,
        value: startStr,
      };

      formControl.reset({
        Timezone: tzOption,
        BusinessHoursStart: startOption,
      });
    }
  }, [backendInfo.isSuccess, backendInfo.data, timezones, businessHoursOptions]);

  const infoBarData = [
    {
      name: "Current Timezone",
      data: currentTimezone,
      icon: <GlobeAltIcon />,
      color: "primary",
    },
    {
      name: "App Service Plan",
      data: appServicePlan,
      icon: <ServerIcon />,
      color: isFlexConsumption ? "success" : "info",
    },
    {
      name: "Business Hours",
      data: isFlexConsumption ? `${currentBusinessHours} - ${getBusinessHoursEnd(currentBusinessHours)}` : "N/A",
      icon: <SunIcon />,
      color: isFlexConsumption ? "warning" : "default",
    },
    {
      name: "Flex Consumption",
      data: isFlexConsumption ? "Enabled" : "Not Available",
      icon: <ClockIcon />,
      color: isFlexConsumption ? "success" : "default",
    },
  ];

  return (
    <CippFormPage
      title={pageTitle}
      hideBackButton={true}
      hidePageType={true}
      formControl={formControl}
      resetForm={false}
      postUrl="/api/ExecTimeSettings"
      queryKey="backendInfo"
    >
      <Stack spacing={2}>
        {/* Status Bar */}
        <CippInfoBar data={infoBarData} isFetching={backendInfo.isFetching || timezonesLoading} />

        <Grid container spacing={2}>
          {/* Timezone Configuration Card */}
          <Grid size={{ xs: 12, md: isFlexConsumption ? 6 : 12 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="Timezone Configuration"
                titleTypographyProps={{ variant: "h6" }}
                avatar={
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      display: "flex",
                    }}
                  >
                    <GlobeAltIcon style={{ width: 20, height: 20 }} />
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Set the timezone used for CIPP operations, scheduling, and log timestamps. All
                    scheduled tasks and reports will use this timezone.
                  </Typography>

                  {backendInfo.isSuccess && (
                    <CippFormComponent
                      type="autoComplete"
                      name="Timezone"
                      label="Timezone"
                      multiple={false}
                      formControl={formControl}
                      options={timezones?.length ? timezones : [{ label: "UTC", value: "UTC" }]}
                      creatable={false}
                      validators={{ required: "Please select a timezone" }}
                    />
                  )}

                  {!backendInfo.isSuccess && (
                    <Alert severity="info">Loading timezone options...</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Business Hours Card - Only show for Flex Consumption */}
          {isFlexConsumption && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardHeader
                  title="Business Hours"
                  titleTypographyProps={{ variant: "h6" }}
                  avatar={
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: "warning.main",
                        color: "warning.contrastText",
                        display: "flex",
                      }}
                    >
                      <SunIcon style={{ width: 20, height: 20 }} />
                    </Box>
                  }
                  action={
                    <Chip label="Flex Consumption" size="small" color="success" variant="outlined" />
                  }
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Configure when CIPP maintains higher instance availability. During business
                      hours (10-hour window), more instances are kept warm for better performance.
                    </Typography>

                    <CippFormComponent
                      type="autoComplete"
                      name="BusinessHoursStart"
                      label="Business Hours Start Time"
                      formControl={formControl}
                      options={businessHoursOptions}
                      validators={{ required: "Please select business hours start time" }}
                      multiple={false}
                      creatable={false}
                    />

                    <Alert severity="info" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Window:</strong> 10 hours from start time
                        </Typography>
                        <Typography variant="body2">
                          <strong>Peak Performance:</strong> More instances available during business
                          hours
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cost Optimization:</strong> Instances scale down outside business
                          hours
                        </Typography>
                      </Stack>
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Info Card for Non-Flex Consumption */}
          {!isFlexConsumption && backendInfo.isSuccess && (
            <Grid size={12}>
              <Alert severity="info">
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  App Service Plan: {appServicePlan}
                </Typography>
                <Typography variant="body2">
                  Business hours configuration is only available for Flex Consumption App Service
                  Plans. Your current plan provides consistent performance without the need for
                  business hours optimization.
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>

        {/* Help Section */}
        <Card variant="outlined">
          <CardHeader
            title="About Time Settings"
            titleTypographyProps={{ variant: "subtitle1" }}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Timezone Impact
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Scheduled task execution times</li>
                    <li>Report generation timestamps</li>
                    <li>Audit log timestamps</li>
                    <li>Alert notification times</li>
                  </ul>
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Best Practices
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Set timezone to your primary operating region</li>
                    <li>Consider team locations when setting business hours</li>
                    <li>Review scheduled tasks after timezone changes</li>
                    <li>UTC is recommended for global operations</li>
                  </ul>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </CippFormPage>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
