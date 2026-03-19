import {
  Stack,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { ApiPostCall } from "../../../api/ApiCall";
import { getCippError } from "../../../utils/get-cipp-error";

const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === null || bytes === undefined) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
};

export const StepScanResults = ({ data, onUpdate, onNext, onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scanStartedRef = useRef(false);

  const scanMutation = ApiPostCall({});

  const startScan = () => {
    setIsScanning(true);
    setError(null);

    scanMutation.mutate(
      {
        url: "/api/ExecTempFileScan",
        data: {
          tenantFilter: data.tenant?.value,
          scope: data.scope,
          siteId: data.siteId?.value,
          userId: data.userId?.value,
          filters: data.filters,
        },
      },
      {
        onSuccess: (response) => {
          setIsScanning(false);
          const results = response?.data?.Results || [];
          onUpdate({
            scanResults: results,
            selectedFiles: results,
          });
        },
        onError: (err) => {
          setIsScanning(false);
          const errorMsg = getCippError(err);
          const status = err?.response?.status;
          const statusText = err?.response?.statusText;
          if (status) {
            setError(`${errorMsg || "Scan failed"} (HTTP ${status}${statusText ? `: ${statusText}` : ""})`);
          } else {
            setError(errorMsg || err?.message || "Scan failed - please check your connection");
          }
        },
      }
    );
  };

  useEffect(() => {
    if (!scanStartedRef.current) {
      scanStartedRef.current = true;
      startScan();
    }
  }, []);

  const totalSize =
    data.scanResults?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
  const fileCount = data.scanResults?.length || 0;

  return (
    <Stack spacing={3}>
      <Typography variant="h6">
        {isScanning
          ? "Scanning... This may take a moment for large sites."
          : error
            ? "Scan Failed"
            : "Scan Complete"}
      </Typography>

      {isScanning && (
        <Box>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Searching for temp files...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error">
          {error}
          <Box sx={{ mt: 1 }}>
            <Button size="small" onClick={startScan}>
              Retry Scan
            </Button>
          </Box>
        </Alert>
      )}

      {!isScanning && !error && scanStartedRef.current && fileCount > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5">
              Found {fileCount} file{fileCount !== 1 ? "s" : ""} (
              {formatFileSize(totalSize)})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              matching your criteria
            </Typography>
          </CardContent>
        </Card>
      )}

      {!isScanning && fileCount === 0 && !error && scanStartedRef.current && (
        <Alert severity="success">
          No temp files found! Your storage is clean.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button onClick={onBack} disabled={isScanning}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={isScanning || fileCount === 0}
        >
          Review Files
        </Button>
      </Box>
    </Stack>
  );
};

export default StepScanResults;
