import { Box, Typography } from "@mui/material";

export const StepSelectScope = ({ data, onUpdate, onNext }) => {
  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Step 1: Select Scope
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        This component will be implemented in Task 5.
      </Typography>
    </Box>
  );
};

export default StepSelectScope;
