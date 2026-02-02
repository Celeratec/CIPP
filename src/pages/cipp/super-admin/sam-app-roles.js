import { TabbedLayout } from "../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import tabOptions from "./tabOptions";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  Chip,
  Link,
  Box,
} from "@mui/material";
import {
  WarningAmberOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import { Grid, Stack } from "@mui/system";
import { useForm } from "react-hook-form";
import { ApiGetCall, ApiGetCallWithPagination } from "../../../api/ApiCall";
import { useEffect } from "react";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import GDAPRoles from "../../../data/GDAPRoles";
import { CippFormTenantSelector } from "../../../components/CippComponents/CippFormTenantSelector";
import {
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";
import NextLink from "next/link";

const Page = () => {
  const pageTitle = "SAM App Roles";

  const formControl = useForm({
    mode: "onChange",
  });

  const execSAMRoles = ApiGetCall({
    url: "/api/ExecSAMRoles",
    queryKey: "ExecSAMRoles",
  });

  const { data: tenantsData = { pages: [] }, isSuccess: tenantsSuccess } = ApiGetCallWithPagination({
    url: "/api/ListTenants?AllTenantSelector=true",
    queryKey: "ListTenants-AllTenantSelector",
  });
  const tenants = tenantsData?.pages?.[0] || [];

  useEffect(() => {
    if (execSAMRoles.isSuccess && tenantsSuccess) {
      var selectedTenants = [];
      execSAMRoles.data?.Tenants?.map((tenant) => {
        var tenantObj = false;
        if (tenant?.value) {
          tenantObj = tenants.find((t) => t?.defaultDomainName === tenant?.value);
        } else {
          tenantObj = tenants.find((t) => t?.defaultDomainName === tenant);
        }
        if (tenantObj) {
          selectedTenants.push({
            value: tenantObj?.defaultDomainName,
            label: tenantObj?.displayName,
          });
        }
      });
      formControl.reset({
        Roles: execSAMRoles.data?.Roles,
        Tenants: selectedTenants,
      });
    }
  }, [execSAMRoles.isSuccess, tenantsSuccess]);

  const selectedRoles = execSAMRoles.data?.Roles || [];
  const selectedTenants = execSAMRoles.data?.Tenants || [];

  const infoBarData = [
    {
      name: "Assigned Roles",
      data: selectedRoles.length,
      icon: <ShieldCheckIcon />,
      color: selectedRoles.length > 0 ? "success" : "default",
    },
    {
      name: "Target Tenants",
      data: selectedTenants.length,
      icon: <BuildingOfficeIcon />,
      color: selectedTenants.length > 0 ? "info" : "default",
    },
    {
      name: "Status",
      data: selectedRoles.length > 0 ? "Configured" : "Not Configured",
      icon: selectedRoles.length > 0 ? <ShieldCheckIcon /> : <ExclamationTriangleIcon />,
      color: selectedRoles.length > 0 ? "success" : "warning",
    },
    {
      name: "Feature Status",
      data: "Beta",
      icon: <ExclamationTriangleIcon />,
      color: "warning",
    },
  ];

  // Categorize roles for better UX
  const categorizedRoles = GDAPRoles.reduce((acc, role) => {
    const category = role.Name.includes("Administrator") ? "Administrator Roles" :
                     role.Name.includes("Reader") ? "Reader Roles" : "Other Roles";
    if (!acc[category]) acc[category] = [];
    acc[category].push({ value: role.ObjectId, label: role.Name });
    return acc;
  }, {});

  const roleOptions = GDAPRoles.map((role) => ({
    value: role.ObjectId,
    label: role.Name,
  }));

  return (
    <CippFormPage
      title={pageTitle}
      hideBackButton={true}
      hidePageType={true}
      formControl={formControl}
      resetForm={false}
      postUrl="/api/ExecSAMRoles?Action=Update"
      queryKey={"ExecSAMRoles"}
    >
      <Stack spacing={2}>
        {/* Status Bar */}
        <CippInfoBar data={infoBarData} isFetching={execSAMRoles.isFetching} />

        {/* Beta Warning */}
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined />}
          sx={{ "& .MuiAlert-message": { width: "100%" } }}
        >
          <Typography variant="body2" fontWeight={500} gutterBottom>
            Beta Feature
          </Typography>
          <Typography variant="body2">
            This functionality is in beta and should be treated as such. Admin roles are applied
            during the Update Permissions process or a CPV refresh. Use with caution in production
            environments.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {/* Configuration Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="Role Configuration"
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
                    <SecurityOutlined style={{ width: 20, height: 20 }} />
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Admin Roles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select the Entra ID admin roles to assign to the CIPP-SAM service principal.
                      These roles grant additional permissions beyond standard delegated access.
                    </Typography>
                    <CippFormComponent
                      formControl={formControl}
                      type="autoComplete"
                      name="Roles"
                      label="Select Admin Roles"
                      options={roleOptions}
                      multiple={true}
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Target Tenants
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select which tenants should have these roles assigned. Leave empty to apply to
                      all tenants, or select specific tenants for targeted assignment.
                    </Typography>
                    <CippFormTenantSelector
                      formControl={formControl}
                      name="Tenants"
                      allTenants={true}
                      label="Select Target Tenants"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Info Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardHeader
                title="About SAM App Roles"
                titleTypographyProps={{ variant: "h6" }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    SAM App Roles allow you to grant the CIPP-SAM service principal direct admin
                    role membership in customer tenants. This is an advanced configuration for
                    accessing APIs and cmdlets unavailable through delegated permissions.
                  </Typography>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Use Cases
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Access to application-only Graph API endpoints</li>
                        <li>Exchange PowerShell cmdlets requiring admin roles</li>
                        <li>Security operations requiring elevated permissions</li>
                      </ul>
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      When Roles Apply
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="div">
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li>During "Update Permissions" execution</li>
                        <li>On CPV consent refresh</li>
                        <li>When onboarding new tenants</li>
                      </ul>
                    </Typography>
                  </Box>

                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <Link
                        component={NextLink}
                        href="https://docs.cipp.app"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View documentation →
                      </Link>
                    </Typography>
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Currently Assigned Roles */}
        {selectedRoles.length > 0 && (
          <Card variant="outlined">
            <CardHeader
              title="Currently Assigned Roles"
              titleTypographyProps={{ variant: "subtitle1" }}
              subheader={`${selectedRoles.length} role(s) configured`}
            />
            <Divider />
            <CardContent>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedRoles.map((role, idx) => {
                  const roleInfo = GDAPRoles.find((r) => r.ObjectId === role.value || r.ObjectId === role);
                  return (
                    <Chip
                      key={idx}
                      label={roleInfo?.Name || role.label || role}
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<ShieldCheckIcon style={{ width: 14, height: 14 }} />}
                    />
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}
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
