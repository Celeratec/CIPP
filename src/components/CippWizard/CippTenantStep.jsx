import { Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CippWizardStepButtons } from "./CippWizardStepButtons";
import { CippFormTenantSelector } from "../CippComponents/CippFormTenantSelector";

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
    <Stack spacing={smDown ? 2 : 3}>
      {preText}
      <Stack spacing={0.5}>
        <Typography variant={smDown ? "subtitle1" : "h6"}>Select a tenant</Typography>
        <Typography variant="body2" color="text.secondary">
          Start typing to search tenants.
        </Typography>
      </Stack>
      <CippFormTenantSelector
        valueField={valueField}
        formControl={formControl}
        allTenants={allTenants}
        type={type}
        includeOffboardingDefaults={includeOffboardingDefaults}
        preselectedEnabled={true}
        sx={{ mt: smDown ? 0.5 : 1 }}
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
