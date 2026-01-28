import { Stack, Typography, useMediaQuery, Box, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CippWizardStepButtons } from "./CippWizardStepButtons";
import { CippFormTenantSelector } from "../CippComponents/CippFormTenantSelector";
import { Business } from "@mui/icons-material";

export const CippTenantStep = (props) => {
  const {
    allTenants,
    type = "single",
    valueField = "defaultDomainName",
    onNextStep,
    formControl,
    currentStep,
    onPreviousStep,
    preText,
    includeOffboardingDefaults = false,
  } = props;
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack spacing={smDown ? 1.5 : 2.5}>
      {preText}
      {/* Header - more compact on mobile */}
      <Box sx={{ textAlign: "center", mb: smDown ? 0.5 : 1 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: smDown ? 48 : 56,
            height: smDown ? 48 : 56,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            mb: 1,
          }}
        >
          <Business sx={{ fontSize: smDown ? 24 : 28 }} />
        </Box>
        <Typography variant={smDown ? "subtitle1" : "h6"} fontWeight={600}>
          Select a tenant
        </Typography>
        {!smDown && (
          <Typography variant="body2" color="text.secondary">
            Start typing to search tenants
          </Typography>
        )}
      </Box>
      <CippFormTenantSelector
        valueField={valueField}
        formControl={formControl}
        allTenants={allTenants}
        type={type}
        includeOffboardingDefaults={includeOffboardingDefaults}
        preselectedEnabled={true}
      />
      <CippWizardStepButtons
        currentStep={currentStep}
        onPreviousStep={onPreviousStep}
        onNextStep={onNextStep}
        formControl={formControl}
      />
    </Stack>
  );
};
