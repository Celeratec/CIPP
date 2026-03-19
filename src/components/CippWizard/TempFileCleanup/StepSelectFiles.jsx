import { Box, Typography } from "@mui/material";

export const StepSelectFiles = ({ data, onUpdate, onNext, onBack }) => {
  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Step 4: Select Files
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        This component will be implemented in Task 8.
      </Typography>
    </Box>
  );
};

export default StepSelectFiles;
