import { TabbedLayout } from "../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import tabOptions from "./tabOptions";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import { useForm } from "react-hook-form";
import {
  Typography,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Box,
  Chip,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { ApiGetCall } from "../../../api/ApiCall";
import { useEffect } from "react";
import {
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";

const Page = () => {
  const pageTitle = "JIT Admin Settings";

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      MaxDuration: "",
    },
  });

  const jitSettings = ApiGetCall({
    url: "/api/ExecJITAdminSettings?Action=Get",
    queryKey: "jitAdminSettings",
  });

  useEffect(() => {
    if (jitSettings.isSuccess && jitSettings.data) {
      formControl.reset({
        MaxDuration: jitSettings.data?.MaxDuration || [],
      });
    }
  }, [jitSettings.isSuccess, jitSettings.data]);

  const currentMaxDuration = jitSettings.data?.MaxDuration;
  const hasLimit = currentMaxDuration && currentMaxDuration !== "";

  // Parse duration for display
  const formatDuration = (iso8601) => {
    if (!iso8601) return "No Limit";
    const match = iso8601.match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?)?/);
    if (!match) return iso8601;
    const days = match[1] ? parseInt(match[1]) : 0;
    const hours = match[2] ? parseInt(match[2]) : 0;
    if (days > 0 && hours > 0) return `${days} days, ${hours} hours`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return iso8601;
  };

  const infoBarData = [
    {
      name: "Max Duration",
      data: formatDuration(currentMaxDuration),
      icon: <ClockIcon />,
      color: hasLimit ? "warning" : "success",
    },
    {
      name: "Policy Status",
      data: hasLimit ? "Enforced" : "No Limit",
      icon: hasLimit ? <ShieldCheckIcon /> : <ExclamationTriangleIcon />,
      color: hasLimit ? "success" : "warning",
    },
    {
      name: "Scope",
      data: "Global",
      icon: <UserPlusIcon />,
      color: "info",
    },
    {
      name: "Enforcement",
      data: "Backend Validated",
      icon: <ShieldCheckIcon />,
      color: "primary",
    },
  ];

  const durationOptions = [
    { label: "1 Hour", value: "PT1H", description: "Short-term emergency access" },
    { label: "4 Hours", value: "PT4H", description: "Half-day tasks" },
    { label: "8 Hours", value: "PT8H", description: "Full workday" },
    { label: "1 Day", value: "P1D", description: "24-hour access" },
    { label: "3 Days", value: "P3D", description: "Extended troubleshooting" },
    { label: "7 Days", value: "P7D", description: "1 week projects" },
    { label: "14 Days", value: "P14D", description: "2 week projects" },
    { label: "30 Days", value: "P30D", description: "Monthly maximum" },
  ];

  return (
    <CippFormPage
      title={pageTitle}
      hideBackButton={true}
      hidePageType={true}
      formControl={formControl}
      resetForm={false}
      postUrl="/api/ExecJITAdminSettings"
      queryKey={["jitAdminSettings"]}
      customDataformatter={(values) => ({
        Action: "Set",
        MaxDuration: values.MaxDuration || null,
      })}
    >
      <Stack spacing={2}>
        {/* Status Bar */}
        <CippInfoBar data={infoBarData} isFetching={jitSettings.isFetching} />

        <Grid container spacing={2}>
          {/* Configuration Card */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="Duration Limit"
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
                    <ClockIcon style={{ width: 20, height: 20 }} />
                  </Box>
                }
                action={
                  hasLimit ? (
                    <Chip label="Limit Set" size="small" color="success" variant="outlined" />
                  ) : (
                    <Chip label="No Limit" size="small" color="warning" variant="outlined" />
                  )
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    Set the maximum allowed duration for Just-In-Time (JIT) admin accounts. This
                    setting helps enforce security policies by preventing technicians from creating
                    accounts with excessively long lifespans.
                  </Typography>

                  <CippFormComponent
                    type="autoComplete"
                    name="MaxDuration"
                    label="Maximum Duration"
                    placeholder="Leave empty for no limit"
                    options={durationOptions.map((opt) => ({
                      label: `${opt.label} (${opt.value})`,
                      value: opt.value,
                    }))}
                    creatable={true}
                    multiple={false}
                    validators={{
                      validate: {
                        iso8601duration: (value) => {
                          if (typeof value !== "string" || value.trim() === "") {
                            return true;
                          }
                          const iso8601Regex =
                            /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
                          if (!iso8601Regex.test(value)) {
                            return "Invalid format. Use PT1H, P1D, P7D, P28D, etc.";
                          }
                          return true;
                        },
                      },
                    }}
                    formControl={formControl}
                    helperText="Select a preset or enter a custom ISO 8601 duration (e.g., PT4H, P7D)"
                  />

                  {/* Duration Examples */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Common Durations
                    </Typography>
                    <Grid container spacing={1}>
                      {durationOptions.slice(0, 4).map((opt) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={opt.value}>
                          <Box
                            sx={{
                              p: 1.5,
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                              textAlign: "center",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: "action.hover",
                              },
                            }}
                            onClick={() => formControl.setValue("MaxDuration", opt.value)}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {opt.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {opt.value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Info Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader title="About JIT Admin" titleTypographyProps={{ variant: "h6" }} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Just-In-Time (JIT) admin accounts provide temporary elevated access for
                    technicians. Setting a maximum duration ensures accounts don't persist longer
                    than necessary.
                  </Typography>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      How It Works
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Duration is calculated from start to expiration date</li>
                        <li>Backend validates all JIT admin requests</li>
                        <li>Requests exceeding the limit are rejected</li>
                        <li>Setting applies globally to all tenants</li>
                      </ul>
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      ISO 8601 Format
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>
                          <code>PT1H</code> = 1 hour
                        </li>
                        <li>
                          <code>P1D</code> = 1 day
                        </li>
                        <li>
                          <code>P7D</code> = 7 days (1 week)
                        </li>
                        <li>
                          <code>P28D</code> = 28 days (4 weeks)
                        </li>
                      </ul>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Example Alert */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Example:</strong> If maximum duration is set to{" "}
            <code>P28D</code> (4 weeks), and a technician tries to create a JIT admin account
            lasting 56 days, the request will be rejected with an error message explaining the
            configured limit.
          </Typography>
        </Alert>
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
