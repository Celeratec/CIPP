import { TabbedLayout } from "../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import tabOptions from "./tabOptions";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import { useForm } from "react-hook-form";
import {
  Alert,
  Link,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { ApiGetCall, ApiPostCall } from "../../../api/ApiCall";
import { useEffect } from "react";
import NextLink from "next/link";
import { CippDataTable } from "../../../components/CippTable/CippDataTable";
import {
  TrashIcon,
  ServerStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon,
} from "@heroicons/react/24/outline";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";
import { getCippFormatting } from "../../../utils/get-cipp-formatting";

const Page = () => {
  const pageTitle = "Function Offloading";

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      OffloadFunctions: false,
    },
  });

  const execOffloadFunctions = ApiGetCall({
    url: "/api/ExecOffloadFunctions?Action=ListCurrent",
    queryKey: "execOffloadFunctions",
  });

  const deleteOffloadEntry = ApiPostCall({
    urlFromData: true,
    relatedQueryKeys: ["execOffloadFunctions"],
  });

  const handleDeleteOffloadEntry = (row) => {
    const entity = {
      RowKey: row.Name,
      PartitionKey: "Version",
    };

    deleteOffloadEntry.mutate({
      url: "/api/ExecAzBobbyTables",
      data: {
        FunctionName: "Remove-AzDataTableEntity",
        TableName: "Version",
        Parameters: {
          Entity: entity,
          Force: true,
        },
      },
    });
  };

  useEffect(() => {
    if (execOffloadFunctions.isSuccess) {
      formControl.reset({
        OffloadFunctions: execOffloadFunctions.data?.OffloadFunctions,
      });
    }
  }, [execOffloadFunctions.isSuccess, execOffloadFunctions.data]);

  // Calculate stats for info bar
  const functionApps = execOffloadFunctions.data?.Version || [];
  const defaultApp = functionApps.find((app) => app.Default === true);
  const offloadApps = functionApps.filter((app) => app.Default !== true);
  const isEnabled = execOffloadFunctions.data?.OffloadFunctions;
  const canEnable = execOffloadFunctions.data?.CanEnable;
  const alerts = execOffloadFunctions.data?.Alerts || [];

  // Check for version mismatches
  const defaultVersion = defaultApp?.Version;
  const versionMismatches = offloadApps.filter(
    (app) => app.Version !== defaultVersion
  );

  const infoBarData = [
    {
      name: "Offloading Status",
      data: isEnabled ? "Enabled" : "Disabled",
      icon: isEnabled ? <CheckCircleIcon /> : <XCircleIcon />,
      color: isEnabled ? "success" : "warning",
    },
    {
      name: "Function Apps",
      data: functionApps.length,
      icon: <ServerStackIcon />,
      color: "primary",
    },
    {
      name: "Offload Apps",
      data: offloadApps.length,
      icon: <CloudIcon />,
      color: offloadApps.length > 0 ? "info" : "warning",
    },
    {
      name: "Version Issues",
      data: versionMismatches.length > 0 ? versionMismatches.length : "None",
      icon: versionMismatches.length > 0 ? <ExclamationTriangleIcon /> : <CheckCircleIcon />,
      color: versionMismatches.length > 0 ? "warning" : "success",
    },
  ];

  // Custom columns for better display
  const columns = [
    {
      header: "Name",
      id: "Name",
      accessorKey: "Name",
      Cell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={500}>
            {row.original.Name}
          </Typography>
          {row.original.Default && (
            <Chip label="Primary" size="small" color="primary" variant="outlined" />
          )}
        </Stack>
      ),
    },
    {
      header: "Version",
      id: "Version",
      accessorKey: "Version",
      Cell: ({ row }) => {
        const isDefault = row.original.Default;
        const hasVersionMismatch = !isDefault && row.original.Version !== defaultVersion;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">{row.original.Version}</Typography>
            {hasVersionMismatch && (
              <Chip
                label="Mismatch"
                size="small"
                color="warning"
                variant="filled"
                icon={<ExclamationTriangleIcon style={{ width: 14, height: 14 }} />}
              />
            )}
          </Stack>
        );
      },
    },
    {
      header: "Type",
      id: "Type",
      accessorKey: "Default",
      Cell: ({ row }) =>
        row.original.Default ? (
          <Chip label="Primary Instance" size="small" color="success" variant="outlined" />
        ) : (
          <Chip label="Offload Instance" size="small" color="info" variant="outlined" />
        ),
    },
  ];

  return (
    <CippFormPage
      title={pageTitle}
      hideBackButton={true}
      hidePageType={true}
      formControl={formControl}
      resetForm={false}
      postUrl="/api/ExecOffloadFunctions"
      queryKey={"execOffloadFunctions"}
    >
      <Stack spacing={2}>
        {/* Status Summary Bar */}
        <CippInfoBar data={infoBarData} isFetching={execOffloadFunctions.isFetching} />

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Stack spacing={1}>
            {alerts.map((alert, index) => (
              <Alert severity="warning" key={index} icon={<ExclamationTriangleIcon />}>
                {alert}
              </Alert>
            ))}
          </Stack>
        )}

        {/* Version Mismatch Warning */}
        {versionMismatches.length > 0 && !execOffloadFunctions.isFetching && (
          <Alert severity="warning">
            <Typography variant="body2" fontWeight={500} gutterBottom>
              Version Mismatch Detected
            </Typography>
            <Typography variant="body2">
              {versionMismatches.length} offload function app(s) have a different version than the
              primary instance ({defaultVersion}). This may cause unexpected behavior. Please update
              all function apps to the same version.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Configuration Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="Configuration"
                titleTypographyProps={{ variant: "h6" }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <CippFormComponent
                      type="switch"
                      name="OffloadFunctions"
                      formControl={formControl}
                      label="Enable Function Offloading"
                      disabled={
                        execOffloadFunctions.isFetching ||
                        (!canEnable && !isEnabled)
                      }
                    />
                    {!canEnable && !isEnabled && !execOffloadFunctions.isFetching && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        No offload function apps detected. Deploy additional function apps to enable
                        offloading.
                      </Typography>
                    )}
                  </Box>

                  <Divider />

                  <Alert severity="info" sx={{ "& .MuiAlert-message": { width: "100%" } }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Self-hosted users:</strong> You must deploy additional function app(s)
                      to your CIPP resource group and enable CI/CD before enabling this feature.
                    </Typography>
                    <Link
                      component={NextLink}
                      href="https://docs.cipp.app/user-documentation/cipp/settings/superadmin/function-offloading"
                      target="_blank"
                      rel="noreferrer"
                      sx={{ fontWeight: 500 }}
                    >
                      View Documentation →
                    </Link>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* About Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="About Function Offloading"
                titleTypographyProps={{ variant: "h6" }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Function offloading enables distributing processor-intensive tasks across multiple
                    Azure Function apps. This improves performance and reliability in high-load
                    environments by preventing any single function app from becoming overwhelmed.
                  </Typography>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      How it works:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>The primary function app handles incoming requests and orchestration</li>
                        <li>
                          Heavy processing tasks are distributed to offload function apps
                        </li>
                        <li>All function apps must run the same version for compatibility</li>
                        <li>Offload apps register automatically when deployed correctly</li>
                      </ul>
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Best practices:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Deploy 1-3 offload function apps depending on your tenant count</li>
                        <li>Enable CI/CD to keep all instances synchronized</li>
                        <li>Monitor version consistency across all apps</li>
                      </ul>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Function Apps Table */}
          <Grid size={12}>
            <CippDataTable
              cardProps={{ variant: "outlined" }}
              title="Registered Function Apps"
              data={functionApps}
              columns={columns}
              refreshFunction={execOffloadFunctions.refetch}
              isFetching={execOffloadFunctions.isFetching}
              simple={false}
              actions={[
                {
                  label: "Remove Registration",
                  icon: <TrashIcon />,
                  url: "/api/ExecAzBobbyTables",
                  type: "POST",
                  customFunction: handleDeleteOffloadEntry,
                  confirmText:
                    "Are you sure you want to remove the registration for [Name]? This does not delete the function app from Azure - you must do that separately or it will re-register automatically.",
                  condition: (row) => row.Default !== true,
                  color: "error",
                },
              ]}
            />
          </Grid>
        </Grid>
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
