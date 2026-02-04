import { Box, Card, CardContent, Container, Button, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm, useWatch } from "react-hook-form";
import { Grid } from "@mui/system";
import { useSettings } from "../../hooks/use-settings";
import { ApiGetCall } from "../../api/ApiCall.jsx";
import Portals from "../../data/portals";
import { BulkActionsMenu } from "../../components/bulk-actions-menu.js";
import { ExecutiveReportButton } from "../../components/ExecutiveReportButton.js";
import { TabbedLayout } from "../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../layouts/index.js";
import tabOptions from "./tabOptions";
import { dashboardDemoData } from "../../data/dashboardv2-demo-data";
import { SecureScoreCard } from "../../components/CippComponents/SecureScoreCard";
import { MFACard } from "../../components/CippComponents/MFACard";
import { AuthMethodCard } from "../../components/CippComponents/AuthMethodCard";
import { LicenseCard } from "../../components/CippComponents/LicenseCard";
import { TenantInfoCard } from "../../components/CippComponents/TenantInfoCard";
import { TenantMetricsGrid } from "../../components/CippComponents/TenantMetricsGrid";
import { AssessmentCard } from "../../components/CippComponents/AssessmentCard";
import { CippChartCard } from "../../components/CippCards/CippChartCard";
import { CippApiDialog } from "../../components/CippComponents/CippApiDialog";
import { CippAddTestReportDrawer } from "../../components/CippComponents/CippAddTestReportDrawer";
import CippFormComponent from "../../components/CippComponents/CippFormComponent";
import {
  Devices as DevicesIcon,
  CheckCircle as CheckCircleIcon,
  Work as BriefcaseIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
} from "@mui/icons-material";

const Page = () => {
  const settings = useSettings();
  const router = useRouter();
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentTenant } = settings;
  const [portalMenuItems, setPortalMenuItems] = useState([]);
  const [portalsReady, setPortalsReady] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false });
  const [refreshDialog, setRefreshDialog] = useState({ open: false });

  // Prefetch commonly accessed data after dashboard loads
  // Temporarily disabled for debugging
  // useDashboardPrefetch(currentTenant);

  // Get reportId from query params or default to "ztna"
  // Only use default if router is ready and reportId is still not present
  const selectedReport =
    router.isReady && !router.query.reportId ? "ztna" : router.query.reportId || "ztna";

  const formControl = useForm({
    mode: "onChange",
  });

  const reportIdValue = useWatch({ control: formControl.control });

  // Fetch available reports
  const reportsApi = ApiGetCall({
    url: "/api/ListTestReports",
    queryKey: "ListTestReports",
  });

  const reports = reportsApi.data || [];

  // Update form when selectedReport changes (from URL)
  useEffect(() => {
    if (selectedReport && router.isReady && reports.length > 0) {
      const matchingReport = reports.find((r) => r.id === selectedReport);
      if (matchingReport) {
        formControl.setValue("reportId", {
          value: matchingReport.id,
          label: matchingReport.name,
        });
      }
    }
  }, [selectedReport, router.isReady, reports]);

  // Update URL when form value changes (e.g., user selects different report from dropdown)
  useEffect(() => {
    if (reportIdValue?.reportId?.value && reportIdValue.reportId.value !== selectedReport) {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, reportId: reportIdValue.reportId.value },
        },
        undefined,
        { shallow: true },
      );
    }
  }, [reportIdValue]);

  const organization = ApiGetCall({
    url: "/api/ListOrg",
    queryKey: `${currentTenant}-ListOrg`,
    data: { tenantFilter: currentTenant },
  });

  const sharepoint = ApiGetCall({
    url: "/api/ListSharepointQuota",
    queryKey: `${currentTenant}-ListSharepointQuota`,
    data: { tenantFilter: currentTenant },
  });

  const testsApi = ApiGetCall({
    url: "/api/ListTests",
    data: { tenantFilter: currentTenant, reportId: selectedReport },
    queryKey: `${currentTenant}-ListTests-${selectedReport}`,
    waiting: !!currentTenant && !!selectedReport,
  });

  const currentTenantInfo = ApiGetCall({
    url: "/api/ListTenants",
    queryKey: `ListTenants`,
  });

  const reportData =
    testsApi.isSuccess && testsApi.data?.TenantCounts
      ? {
          ExecutedAt: testsApi.data?.LatestReportTimeStamp || null,
          TenantName: organization.data?.displayName || "",
          Domain: currentTenant || "",
          TestResultSummary: {
            IdentityPassed: testsApi.data.TestCounts?.Identity?.Passed || 0,
            IdentityTotal: testsApi.data.TestCounts?.Identity?.Total || 0,
            DevicesPassed: testsApi.data.TestCounts?.Devices?.Passed || 0,
            DevicesTotal: testsApi.data.TestCounts?.Devices?.Total || 0,
            DataPassed: 0,
            DataTotal: 0,
          },
          SecureScore: testsApi.data.SecureScore || [],
          TenantInfo: {
            TenantOverview: {
              UserCount: testsApi.data.TenantCounts.Users || 0,
              GuestCount: testsApi.data.TenantCounts.Guests || 0,
              GroupCount: testsApi.data.TenantCounts.Groups || 0,
              ApplicationCount: testsApi.data.TenantCounts.ServicePrincipals || 0,
              DeviceCount: testsApi.data.TenantCounts.Devices || 0,
              ManagedDeviceCount: testsApi.data.TenantCounts.ManagedDevices || 0,
            },
            MFAState: testsApi.data.MFAState,
            OverviewCaDevicesAllUsers: dashboardDemoData.TenantInfo.OverviewCaDevicesAllUsers,
            OverviewAuthMethodsPrivilegedUsers:
              dashboardDemoData.TenantInfo.OverviewAuthMethodsPrivilegedUsers,
            DeviceOverview: dashboardDemoData.TenantInfo.DeviceOverview,
          },
        }
      : dashboardDemoData;

  // Function to filter portals based on user preferences
  const getFilteredPortals = () => {
    const defaultLinks = {
      M365_Portal: true,
      Exchange_Portal: true,
      Entra_Portal: true,
      Teams_Portal: true,
      Azure_Portal: true,
      Intune_Portal: true,
      SharePoint_Admin: true,
      Security_Portal: true,
      Compliance_Portal: true,
      Power_Platform_Portal: true,
      Power_BI_Portal: true,
    };

    let portalLinks;
    if (settings.UserSpecificSettings?.portalLinks) {
      portalLinks = { ...defaultLinks, ...settings.UserSpecificSettings.portalLinks };
    } else if (settings.portalLinks) {
      portalLinks = { ...defaultLinks, ...settings.portalLinks };
    } else {
      portalLinks = defaultLinks;
    }

    // Filter the portals based on user settings
    return Portals.filter((portal) => {
      const settingKey = portal.name;
      return settingKey ? portalLinks[settingKey] === true : true;
    });
  };

  // Initialize portals immediately with current tenant - don't wait for API
  useEffect(() => {
    if (currentTenant) {
      const filteredPortals = getFilteredPortals();
      
      // Use currentTenant as default for URL variables - works for most portals
      const menuItems = filteredPortals.map((portal) => ({
        label: portal.label,
        target: "_blank",
        link: portal.url.replace(portal.variable, currentTenant),
        icon: portal.icon,
      }));
      setPortalMenuItems(menuItems);
      setPortalsReady(true);
    }
  }, [currentTenant, settings.portalLinks, settings.UserSpecificSettings]);

  // Update portal URLs with full tenant info when available (for customerId lookups)
  useEffect(() => {
    if (currentTenantInfo.isSuccess && currentTenant) {
      const tenantLookup = currentTenantInfo.data?.find(
        (tenant) => tenant.defaultDomainName === currentTenant,
      );

      if (tenantLookup) {
        const filteredPortals = getFilteredPortals();
        const menuItems = filteredPortals.map((portal) => ({
          label: portal.label,
          target: "_blank",
          link: portal.url.replace(portal.variable, tenantLookup?.[portal.variable] || currentTenant),
          icon: portal.icon,
        }));
        setPortalMenuItems(menuItems);
      }
    }
  }, [currentTenantInfo.isSuccess, currentTenantInfo.data, currentTenant]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const formatStorageSize = (sizeInMB) => {
    if (!sizeInMB && sizeInMB !== 0) return "0 MB";
    const sizeInGB = sizeInMB / 1024;
    const sizeInTB = sizeInGB / 1024;
    if (sizeInTB >= 1) {
      return `${sizeInTB.toFixed(2)} TB`;
    }
    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(2)} GB`;
    }
    return `${sizeInMB.toFixed(0)} MB`;
  };

  const compactCardHeight = smDown ? "auto" : 360;
  const compactWideCardHeight = smDown ? "auto" : 340;

  return (
    <Container maxWidth={false} sx={{ mt: 12, mb: 4 }}>
      <Box sx={{ width: "100%", mx: "auto" }}>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent 
                sx={{ 
                  display: "flex", 
                  flexWrap: "wrap",
                  alignItems: "center", 
                  gap: smDown ? 1 : 2, 
                  p: smDown ? 1.5 : 2 
                }}
              >
                <BulkActionsMenu
                  buttonName="Portals"
                  actions={portalMenuItems}
                  disabled={!portalsReady || portalMenuItems.length === 0}
                />
                <ExecutiveReportButton disabled={organization.isFetching} />
                <Tooltip title="Coming soon!" arrow>
                  <span>
                    <Button
                      variant="contained"
                      startIcon={!smDown && <AssessmentIcon />}
                      disabled
                      sx={{
                        fontWeight: "bold",
                        textTransform: "none",
                        borderRadius: 2,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        transition: "all 0.2s ease-in-out",
                        minWidth: smDown ? "auto" : undefined,
                        px: smDown ? 1.5 : 2,
                      }}
                    >
                      {smDown ? <AssessmentIcon /> : "Report Builder"}
                    </Button>
                  </span>
                </Tooltip>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent 
                sx={{ 
                  display: "flex", 
                  flexDirection: smDown ? "column" : "row",
                  gap: smDown ? 2 : 1.5, 
                  alignItems: smDown ? "stretch" : "center", 
                  p: smDown ? 1.5 : 2 
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <CippFormComponent
                    name="reportId"
                    label="Select a report"
                    type="autoComplete"
                    multiple={false}
                    formControl={formControl}
                    options={reports.map((r) => ({
                      label: r.name,
                      value: r.id,
                      description: r.description,
                    }))}
                    placeholder="Choose a report"
                  />
                </Box>
                <Box 
                  sx={{ 
                    display: "flex", 
                    flexWrap: "wrap",
                    gap: 1, 
                    justifyContent: smDown ? "stretch" : "flex-end",
                    "& > *": smDown ? { flex: "1 1 calc(50% - 4px)", minWidth: "120px" } : {}
                  }}
                >
                  <CippAddTestReportDrawer buttonText={smDown ? "Create" : "Create custom report"} />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{
                      minWidth: "auto",
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.2s ease-in-out",
                      px: smDown ? 1.5 : 2,
                    }}
                    onClick={() => {
                      setRefreshDialog({
                        open: true,
                        title: "Refresh Test Data",
                        message: `Are you sure you want to refresh the test data for ${currentTenant}? This might take up to 2 hours to update.`,
                        api: {
                          url: "/api/ExecTestRun",
                          data: { tenantFilter: currentTenant },
                          method: "POST",
                        },
                        handleClose: () => setRefreshDialog({ open: false }),
                      });
                    }}
                    startIcon={<RefreshIcon />}
                  >
                    {smDown ? "Update" : "Update Report"}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    sx={{
                      fontWeight: "bold",
                      textTransform: "none",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.2s ease-in-out",
                      px: smDown ? 1.5 : 2,
                    }}
                    onClick={() => {
                      const report = reports.find((r) => r.id === selectedReport);
                      if (report && report.source !== "file") {
                        setDeleteDialog({
                          open: true,
                          handleClose: () => setDeleteDialog({ open: false }),
                          row: { ReportId: selectedReport, name: report.name },
                        });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tenant Overview Section - 3 Column Layout */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {/* Column 1: Tenant Information */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <TenantInfoCard data={organization.data} isLoading={organization.isFetching} />
          </Grid>

          {/* Column 2: Tenant Metrics - 2x3 Grid */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <TenantMetricsGrid
              data={reportData.TenantInfo.TenantOverview}
              isLoading={testsApi.isFetching}
            />
          </Grid>

          {/* Column 3: Assessment Results */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <AssessmentCard data={reportData} isLoading={testsApi.isFetching} />
          </Grid>
        </Grid>

        {/* Identity Section - 2 Column Grid */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ height: compactCardHeight }}>
                <SecureScoreCard data={testsApi.data?.SecureScore} isLoading={testsApi.isFetching} compact />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ height: compactCardHeight }}>
                <CippChartCard
                  title="SharePoint Quota"
                  headerIcon={<CloudIcon sx={{ fontSize: 20 }} />}
                  isFetching={sharepoint.isFetching}
                  chartType="donut"
                  compact
                  showHeaderDivider={false}
                  horizontalLayout
                  chartSeries={[
                    Number(sharepoint.data?.TenantStorageMB - sharepoint.data?.GeoUsedStorageMB) || 0,
                    Number(sharepoint.data?.GeoUsedStorageMB) || 0,
                  ]}
                  labels={["Free", "Used"]}
                  formatValue={formatStorageSize}
                  colors={["hsl(140, 50%, 72%)", "hsl(210, 55%, 58%)"]}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ height: compactCardHeight }}>
                <MFACard data={testsApi.data?.MFAState} isLoading={testsApi.isFetching} compact />
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Box sx={{ height: compactWideCardHeight }}>
                <AuthMethodCard
                  data={testsApi.data?.MFAState}
                  isLoading={testsApi.isFetching}
                  compact
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Box sx={{ minHeight: compactWideCardHeight }}>
                <LicenseCard
                  data={testsApi.data?.LicenseData}
                  isLoading={testsApi.isFetching}
                  compact
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Delete Report Dialog */}
      <CippApiDialog
        createDialog={deleteDialog}
        title="Delete Custom Report"
        fields={[]}
        row={reportIdValue}
        api={{
          url: "/api/DeleteTestReport",
          type: "POST",
          data: {
            ReportId: reportIdValue.reportId?.value,
          },
          confirmText: "Are you sure you want to delete this report? This action cannot be undone.",
          relatedQueryKeys: ["ListTestReports"],
        }}
      />

      {/* Refresh Data Dialog */}
      <CippApiDialog
        createDialog={refreshDialog}
        title={refreshDialog.title}
        fields={[]}
        api={{
          url: refreshDialog.api?.url,
          type: "POST",
          data: refreshDialog.api?.data,
          confirmText: refreshDialog.message,
          relatedQueryKeys: [`${currentTenant}-ListTests-${selectedReport}`],
        }}
      />
    </Container>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout allTenantsSupport={false}>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
