import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../../../../../layouts/index.js";
import { TabbedLayout } from "../../../../../layouts/TabbedLayout";
import tabOptions from "../tabOptions";
import CippPageCard from "../../../../../components/CippCards/CippPageCard";
import { ApiGetCall, ApiPostCall } from "../../../../../api/ApiCall";
import {
  Box,
  Button,
  Typography,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  alpha,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Grid } from "@mui/system";
import {
  ArrowBack,
  ArrowForward,
  RocketLaunch,
  Settings,
  Business,
  CheckCircle,
} from "@mui/icons-material";
import Link from "next/link";
import { CippFormTenantSelector } from "../../../../../components/CippComponents/CippFormTenantSelector";
import { useForm, useWatch } from "react-hook-form";
import CippDeploymentResults from "../../../../../components/CippComponents/CippDeploymentResults";

const steps = ["Review Template", "Select Tenants", "Deploy"];

const Page = () => {
  const router = useRouter();
  const theme = useTheme();
  const { template: templateId } = router.query;
  const [activeStep, setActiveStep] = useState(0);
  const [deploymentId, setDeploymentId] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      tenantFilter: [],
      secretExpirationDays: 730,
    },
  });

  const selectedTenants = useWatch({
    control: formControl.control,
    name: "tenantFilter",
  });

  const templateQuery = ApiGetCall({
    url: "/api/ListIntegrationTemplates",
    data: { id: templateId },
    queryKey: ["IntegrationTemplate", templateId],
    enabled: !!templateId,
  });

  const template = templateQuery.data?.[0];

  const deployMutation = ApiPostCall({
    urlFromData: true,
    onSuccess: (data) => {
      if (data?.DeploymentId) {
        setDeploymentId(data.DeploymentId);
        setActiveStep(2);
      }
      setIsDeploying(false);
    },
    onError: () => {
      setIsDeploying(false);
    },
  });

  const handleNext = () => {
    if (activeStep === 1) {
      handleDeploy();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleDeploy = () => {
    const tenants = Array.isArray(selectedTenants) ? selectedTenants : [selectedTenants];
    if (tenants.length === 0) return;

    setIsDeploying(true);
    deployMutation.mutate({
      url: "/api/ExecDeployIntegrationApp",
      data: {
        templateId: template.id,
        tenants: tenants.map((t) => ({
          value: t.value,
          label: t.label,
        })),
        customizations: {
          secretExpirationDays: formControl.getValues("secretExpirationDays"),
        },
      },
    });
  };

  const permissionCount =
    template?.permissions?.reduce(
      (acc, resource) => acc + (resource.permissions?.length || 0),
      0
    ) || 0;

  const canProceed = () => {
    if (activeStep === 0) return !!template;
    if (activeStep === 1) {
      const tenants = Array.isArray(selectedTenants) ? selectedTenants : [selectedTenants];
      return tenants.length > 0 && tenants[0]?.value;
    }
    return false;
  };

  if (!templateId) {
    return (
      <CippPageCard title="Deploy Integration App">
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            No template selected. Please select a template from the{" "}
            <Link href="/tenant/administration/applications/integration-templates">
              Integration Templates
            </Link>{" "}
            page.
          </Alert>
        </Box>
      </CippPageCard>
    );
  }

  return (
    <CippPageCard title={`Deploy: ${template?.name || "Loading..."}`}>
      <Box sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {templateQuery.isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : templateQuery.isError ? (
          <Alert severity="error">
            Failed to load template: {templateQuery.error?.message || "Unknown error"}
          </Alert>
        ) : (
          <>
            {activeStep === 0 && (
              <Stack spacing={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      mb: 1.5,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Settings sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Review Template
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirm the template settings before selecting tenants
                  </Typography>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Template Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {template?.name}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {template?.description || "No description provided"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Permissions ({permissionCount})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {template?.permissions?.map((resource) =>
                            resource.permissions?.map((perm) => (
                              <Chip
                                key={perm.id}
                                label={perm.name}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))
                          )}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          App Name Pattern
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {template?.appNamePattern}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Customizations
                    </Typography>
                    <FormControl fullWidth size="small">
                      <InputLabel>Secret Expiration</InputLabel>
                      <Select
                        value={formControl.watch("secretExpirationDays")}
                        onChange={(e) =>
                          formControl.setValue("secretExpirationDays", e.target.value)
                        }
                        label="Secret Expiration"
                      >
                        <MenuItem value={90}>90 days</MenuItem>
                        <MenuItem value={180}>180 days</MenuItem>
                        <MenuItem value={365}>1 year</MenuItem>
                        <MenuItem value={730}>2 years (maximum)</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                      mb: 1.5,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Business sx={{ fontSize: 36 }} />
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Select Tenants
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose the tenants where you want to create the app registration
                  </Typography>
                </Box>

                <CippFormTenantSelector
                  formControl={formControl}
                  allTenants={false}
                  type="multiple"
                  valueField="defaultDomainName"
                />

                {selectedTenants && selectedTenants.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.02),
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{selectedTenants.length}</strong> tenant
                      {selectedTenants.length !== 1 ? "s" : ""} selected
                    </Typography>
                  </Paper>
                )}
              </Stack>
            )}

            {activeStep === 2 && deploymentId && (
              <CippDeploymentResults deploymentId={deploymentId} />
            )}

            {activeStep < 2 && (
              <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!canProceed() || isDeploying}
                  endIcon={
                    isDeploying ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : activeStep === 1 ? (
                      <RocketLaunch />
                    ) : (
                      <ArrowForward />
                    )
                  }
                >
                  {activeStep === 1 ? "Deploy" : "Next"}
                </Button>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/tenant/administration/applications/integration-templates"
                  startIcon={<ArrowBack />}
                >
                  Back to Templates
                </Button>
              </Stack>
            )}
          </>
        )}
      </Box>
    </CippPageCard>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
