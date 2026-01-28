import { Button, Stack, useMediaQuery, Box, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useFormState } from "react-hook-form";
import { ApiPostCall } from "../../api/ApiCall";
import { CippApiResults } from "../CippComponents/CippApiResults";
import { ArrowBack, ArrowForward, Check, Refresh } from "@mui/icons-material";

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
    sticky = false,
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

  // Mobile-optimized button styles with proper touch targets (min 44px)
  const mobileButtonSx = {
    minHeight: 48,
    fontSize: '1rem',
  };

  const buttonContent = (
    <Stack
      alignItems={smDown ? "stretch" : "center"}
      direction={smDown ? "column-reverse" : "row"}
      justifyContent={smDown ? "stretch" : "flex-end"}
      spacing={smDown ? 1.5 : 2}
    >
      {currentStep > 0 && (
        <Button
          color="inherit"
          onClick={onPreviousStep}
          size={smDown ? "large" : "large"}
          type="button"
          fullWidth={smDown}
          startIcon={<ArrowBack />}
          sx={smDown ? { ...mobileButtonSx, order: 2 } : {}}
        >
          Back
        </Button>
      )}
      {!noNextButton && currentStep !== lastStep && (
        <Button
          size="large"
          disabled={!isValid}
          onClick={onNextStep}
          type="submit"
          variant="contained"
          fullWidth={smDown}
          endIcon={<ArrowForward />}
          sx={smDown ? { ...mobileButtonSx, order: 1 } : {}}
        >
          Next Step
        </Button>
      )}
      {!noSubmitButton && currentStep === lastStep && (
        <form onSubmit={formControl.handleSubmit(handleSubmit)} style={{ width: smDown ? "100%" : "auto" }}>
          <Button
            size="large"
            type="submit"
            variant="contained"
            disabled={sendForm.isPending}
            fullWidth={smDown}
            startIcon={
              sendForm.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : isSubmitted ? (
                <Refresh />
              ) : (
                <Check />
              )
            }
            sx={smDown ? mobileButtonSx : {}}
          >
            {sendForm.isPending ? "Submitting..." : isSubmitted ? "Resubmit" : "Submit"}
          </Button>
        </form>
      )}
    </Stack>
  );

  return (
    <>
      <CippApiResults apiObject={sendForm} />
      {sticky ? (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "background.paper",
            pt: 2,
            // Extra bottom padding for mobile safe area (notches, gesture bars)
            pb: { xs: 3, sm: 1 },
            mt: 3,
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            borderTop: 1,
            borderColor: "divider",
            zIndex: 10,
          }}
        >
          {buttonContent}
        </Box>
      ) : (
        <Box sx={{ mt: smDown ? 2 : 3 }}>
          {buttonContent}
        </Box>
      )}
    </>
  );
};

export default CippWizardStepButtons;
