import { Stack, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CippWizardStepButtons } from "./CippWizardStepButtons";
import CippFormComponent from "../CippComponents/CippFormComponent";

export const CippWizardAutoComplete = (props) => {
  const {
    title,
    type = "single",
    name,
    placeholder,
    api,
    onNextStep,
    formControl,
    currentStep,
    onPreviousStep,
  } = props;

  const currentTenant = formControl.watch("tenantFilter");
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack spacing={smDown ? 2 : 3}>
      <Stack spacing={0.5}>
        <Typography variant={smDown ? "subtitle1" : "h6"}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose one or more users to continue.
        </Typography>
      </Stack>
      <CippFormComponent
        key={currentTenant ? currentTenant.value : "default"}
        type="autoComplete"
        name={name}
        formControl={formControl}
        placeholder={placeholder}
        api={{
          ...api,
          tenantFilter: currentTenant ? currentTenant.value : undefined,
          queryKey: api.queryKey ? api.queryKey.replace('{tenant}', currentTenant ? currentTenant.value : "default") : `${api.url}-${currentTenant ? currentTenant.value : "default"}`,
        }}
        multiple={type === "single" ? false : true}
        disableClearable={true}
        validators={{
          required: { value: true, message: "This field is required" },
        }}
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
