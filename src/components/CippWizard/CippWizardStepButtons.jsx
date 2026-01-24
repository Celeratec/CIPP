import { Button, Stack, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useFormState } from "react-hook-form";
import { ApiPostCall } from "../../api/ApiCall";
import { CippApiResults } from "../CippComponents/CippApiResults";

export const CippWizardStepButtons = (props) => {
  const {
    postUrl,
    lastStep,
    currentStep,
    onPreviousStep,
    onNextStep,
    formControl,
    noNextButton = false,
    noSubmitButton = false,
    replacementBehaviour,
    queryKeys,
    ...other
  } = props;
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const { isValid, isSubmitted, isSubmitting } = useFormState({ control: formControl.control });
  const sendForm = ApiPostCall({ relatedQueryKeys: queryKeys });
  const handleSubmit = () => {
    const values = formControl.getValues();
    const newData = {};
    Object.keys(values).forEach((key) => {
      const value = values[key];
      // Only add non-null values if removeNulls is specified
      if (replacementBehaviour !== "removeNulls" || value !== null) {
        newData[key] = value;
      }
    });
    sendForm.mutate({ url: postUrl, data: newData });
  };

  return (
    <>
      <CippApiResults apiObject={sendForm} />
      <Stack
        alignItems={smDown ? "stretch" : "center"}
        direction={smDown ? "column" : "row"}
        justifyContent={smDown ? "stretch" : "flex-end"}
        spacing={2}
        sx={{ mt: 3 }}
      >
        {currentStep > 0 && (
          <Button
            color="inherit"
            onClick={onPreviousStep}
            size={smDown ? "medium" : "large"}
            type="button"
            fullWidth={smDown}
          >
            Back
          </Button>
        )}
        {!noNextButton && currentStep !== lastStep && (
          <Button
            size={smDown ? "medium" : "large"}
            disabled={!isValid}
            onClick={onNextStep}
            type="submit"
            variant="contained"
            fullWidth={smDown}
          >
            Next Step
          </Button>
        )}
        {!noSubmitButton && currentStep === lastStep && (
          <form onSubmit={formControl.handleSubmit(handleSubmit)} style={{ width: smDown ? "100%" : "auto" }}>
            <Button
              size={smDown ? "medium" : "large"}
              type="submit"
              variant="contained"
              disabled={sendForm.isPending}
              fullWidth={smDown}
            >
              {isSubmitted ? "Resubmit" : "Submit"}
            </Button>
          </form>
        )}
      </Stack>
    </>
  );
};

export default CippWizardStepButtons;
