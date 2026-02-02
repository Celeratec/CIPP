import { TabbedLayout } from "../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import tabOptions from "./tabOptions";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import { useForm } from "react-hook-form";
import {
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link,
  Box,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import { ApiGetCall } from "../../../api/ApiCall";
import { useEffect } from "react";
import NextLink from "next/link";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";
import { useWatch } from "react-hook-form";

const Page = () => {
  const pageTitle = "Tenant Mode";

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      TenantMode: "default",
    },
  });

  const selectedMode = useWatch({ control: formControl.control, name: "TenantMode" });

  const tenantModeOptions = [
    {
      label: "Multi Tenant - GDAP Mode",
      value: "default",
      description:
        "Standard MSP configuration using Granular Delegated Admin Privileges (GDAP) to manage multiple customer tenants.",
      icon: <GlobeAltIcon />,
      features: [
        "Manage multiple customer tenants",
        "GDAP relationship required",
        "SAM application consent per tenant",
        "Recommended for most MSPs",
      ],
    },
    {
      label: "Multi Tenant - Add Partner Tenant",
      value: "PartnerTenantAvailable",
      description:
        "GDAP mode with the ability to also manage your own partner tenant alongside customer tenants.",
      icon: <BuildingOffice2Icon />,
      features: [
        "All GDAP mode features",
        "Add your partner tenant to the tenant list",
        "Manage partner and customer tenants together",
        "Useful for MSPs wanting self-management",
      ],
    },
    {
      label: "Single Tenant - Own Tenant Mode",
      value: "owntenant",
      description:
        "Configure CIPP to manage only your own tenant. No GDAP or partner relationships required.",
      icon: <BuildingOfficeIcon />,
      features: [
        "Manage single tenant only",
        "No GDAP relationships needed",
        "Simplified setup",
        "Ideal for enterprises or internal IT",
      ],
    },
  ];

  const execPartnerMode = ApiGetCall({
    url: "/api/ExecPartnerMode?Action=ListCurrent",
    queryKey: "execPartnerMode",
  });

  useEffect(() => {
    if (execPartnerMode.isSuccess) {
      formControl.reset({
        TenantMode: execPartnerMode.data?.TenantMode,
      });
    }
  }, [execPartnerMode.isSuccess, execPartnerMode.data]);

  const currentMode = tenantModeOptions.find(
    (opt) => opt.value === execPartnerMode.data?.TenantMode
  );

  const infoBarData = [
    {
      name: "Current Mode",
      data: currentMode?.label || "Loading...",
      icon: currentMode?.icon || <GlobeAltIcon />,
      color: "primary",
    },
    {
      name: "Configuration",
      data: execPartnerMode.data?.TenantMode === "owntenant" ? "Single Tenant" : "Multi Tenant",
      icon: execPartnerMode.data?.TenantMode === "owntenant" ? <BuildingOfficeIcon /> : <GlobeAltIcon />,
      color: "info",
    },
    {
      name: "GDAP Required",
      data: execPartnerMode.data?.TenantMode === "owntenant" ? "No" : "Yes",
      icon: <CheckCircleIcon />,
      color: execPartnerMode.data?.TenantMode === "owntenant" ? "success" : "warning",
    },
    {
      name: "Partner Tenant",
      data: execPartnerMode.data?.TenantMode === "PartnerTenantAvailable" ? "Available" : "N/A",
      icon: <BuildingOffice2Icon />,
      color: execPartnerMode.data?.TenantMode === "PartnerTenantAvailable" ? "success" : "default",
    },
  ];

  return (
    <CippFormPage
      title={pageTitle}
      hideBackButton={true}
      hidePageType={true}
      formControl={formControl}
      resetForm={false}
      postUrl="/api/ExecPartnerMode"
      queryKey={["execPartnerMode", "TenantSelector"]}
    >
      <Stack spacing={2}>
        {/* Status Bar */}
        <CippInfoBar data={infoBarData} isFetching={execPartnerMode.isFetching} />

        {/* Info Alert */}
        <Alert severity="info">
          <Typography variant="body2">
            Tenant mode determines how CIPP connects to and manages Microsoft 365 tenants. Choose the
            mode that best fits your organization's needs.{" "}
            <Link
              component={NextLink}
              href="https://docs.cipp.app/setup/installation/owntenant"
              target="_blank"
              rel="noreferrer"
            >
              View documentation →
            </Link>
          </Typography>
        </Alert>

        {/* Mode Selection Cards */}
        <Card variant="outlined">
          <CardHeader
            title="Select Tenant Mode"
            titleTypographyProps={{ variant: "h6" }}
          />
          <Divider />
          <CardContent>
            <RadioGroup
              value={selectedMode}
              onChange={(e) => formControl.setValue("TenantMode", e.target.value)}
            >
              <Grid container spacing={2}>
                {tenantModeOptions.map((option) => {
                  const isSelected = selectedMode === option.value;
                  const isCurrent = execPartnerMode.data?.TenantMode === option.value;

                  return (
                    <Grid size={{ xs: 12, md: 4 }} key={option.value}>
                      <Card
                        variant={isSelected ? "elevation" : "outlined"}
                        sx={{
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          borderColor: isSelected ? "primary.main" : "divider",
                          borderWidth: isSelected ? 2 : 1,
                          bgcolor: isSelected ? "action.selected" : "background.paper",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "action.hover",
                          },
                        }}
                        onClick={() => formControl.setValue("TenantMode", option.value)}
                      >
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <FormControlLabel
                                value={option.value}
                                control={<Radio />}
                                label=""
                                sx={{ m: 0, mr: -1 }}
                              />
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: isSelected ? "primary.main" : "action.selected",
                                  color: isSelected ? "primary.contrastText" : "text.secondary",
                                  display: "flex",
                                }}
                              >
                                <Box component="span" sx={{ width: 24, height: 24 }}>
                                  {option.icon}
                                </Box>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {option.label}
                                </Typography>
                              </Box>
                              {isCurrent && (
                                <Chip label="Current" size="small" color="success" variant="outlined" />
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>

                            <Divider />

                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Features:
                              </Typography>
                              <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                                {option.features.map((feature, idx) => (
                                  <Typography
                                    component="li"
                                    variant="caption"
                                    color="text.secondary"
                                    key={idx}
                                  >
                                    {feature}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Warning for mode changes */}
        {selectedMode !== execPartnerMode.data?.TenantMode && !execPartnerMode.isFetching && (
          <Alert severity="warning">
            <Typography variant="body2" fontWeight={500} gutterBottom>
              Mode Change Detected
            </Typography>
            <Typography variant="body2">
              Changing tenant mode may affect your ability to access certain tenants. Please ensure
              you understand the implications before saving. You may need to reconfigure tenant
              access after changing modes.
            </Typography>
          </Alert>
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
