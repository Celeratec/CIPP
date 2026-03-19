import { Box, Typography } from "@mui/material";

export const StepConfirmDelete = ({ data, onBack }) => {
  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h6" color="text.secondary">
        Step 5: Confirm Delete
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        This component will be implemented in Task 9.
      </Typography>
    </Box>
  );
};

export default StepConfirmDelete;
