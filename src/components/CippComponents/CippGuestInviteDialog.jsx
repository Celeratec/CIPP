import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Send,
  OpenInNew,
  ErrorOutline,
  CheckCircle,
  Search,
  WarningAmber,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { ApiPostCall } from "../../api/ApiCall";
import CippFormComponent from "./CippFormComponent";
import Link from "next/link";

const CippGuestInviteDialog = ({
  open,
  onClose,
  tenantFilter,
  groupId,
  webUrl,
  sharePointType,
  relatedQueryKeys = [],
}) => {
  const theme = useTheme();
  const [diagnostics, setDiagnostics] = useState(null);
  const [blockedDomain, setBlockedDomain] = useState(null);
  const [resultMessages, setResultMessages] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const formHook = useForm({
    defaultValues: {
      displayName: "",
      mail: "",
      redirectUri: "",
      sendInvite: false,
    },
    mode: "onChange",
  });

  const inviteApi = ApiPostCall({
    relatedQueryKeys,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setDiagnostics(null);
      setBlockedDomain(null);
      setResultMessages([]);
      setStatus("idle");
      formHook.reset({
        displayName: "",
        mail: "",
        redirectUri: "",
        sendInvite: false,
      });
    }
  }, [open]);

  const onSubmit = (data) => {
    setStatus("loading");
    setDiagnostics(null);
    setBlockedDomain(null);
    setResultMessages([]);

    inviteApi.mutate(
      {
        url: "/api/ExecSharePointInviteGuest",
        data: {
          tenantFilter,
          groupId,
          URL: webUrl,
          SharePointType: sharePointType,
          ...data,
        },
      },
      {
        onSuccess: (response) => {
          const results = response?.data?.Results || [];
          setResultMessages(results);
          setStatus("success");
        },
        onError: (error) => {
          const responseData = error?.response?.data;
          const results = responseData?.Results || [
            error?.message || "An unexpected error occurred.",
          ];
          setResultMessages(results);

          if (responseData?.Diagnostics) {
            setDiagnostics(responseData.Diagnostics);
            setBlockedDomain(responseData.BlockedDomain);
          }

          setStatus("error");
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
  };

  const fields = [
    {
      type: "textField",
      name: "displayName",
      label: "Display Name",
      placeholder: "Guest user's display name",
      validators: { required: "Display name is required" },
    },
    {
      type: "textField",
      name: "mail",
      label: "Email Address",
      placeholder: "guest@externaldomain.com",
      validators: {
        required: "Email address is required",
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: "Please enter a valid email address",
        },
      },
    },
    {
      type: "textField",
      name: "redirectUri",
      label: "Redirect URL (Optional)",
      placeholder: "https://myapps.microsoft.com",
    },
    {
      type: "switch",
      name: "sendInvite",
      label: "Send email invitation to guest",
    },
  ];

  const hasDiagnostics = diagnostics && diagnostics.length > 0;
  const hasHighSeverity = diagnostics?.some((d) => d.severity === "error");

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open} disableRestoreFocus>
      <form onSubmit={formHook.handleSubmit(onSubmit)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Send sx={{ fontSize: 22 }} />
            <span>Invite External Guest</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invite an external guest user to this SharePoint site. The guest will be invited to the
            tenant and, for group-connected sites, automatically added as a site member.
          </Typography>
        </DialogContent>

        {/* Form Fields */}
        <Collapse in={status === "idle" || status === "loading"}>
          <DialogContent>
            <Stack spacing={2}>
              {fields.map((fieldProps, i) => (
                <Box key={i} sx={{ width: "100%" }}>
                  <CippFormComponent formControl={formHook} {...fieldProps} />
                </Box>
              ))}
            </Stack>
          </DialogContent>
        </Collapse>

        {/* Loading State */}
        <Collapse in={status === "loading"}>
          <DialogContent>
            <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Inviting guest...
              </Typography>
            </Stack>
          </DialogContent>
        </Collapse>

        {/* Success State */}
        <Collapse in={status === "success"}>
          <DialogContent>
            <Stack spacing={1.5}>
              {resultMessages.map((msg, i) => (
                <Alert key={i} severity="success" icon={<CheckCircle />}>
                  <Typography variant="body2">{msg}</Typography>
                </Alert>
              ))}
            </Stack>
          </DialogContent>
        </Collapse>

        {/* Error State */}
        <Collapse in={status === "error"}>
          <DialogContent>
            <Stack spacing={2}>
              {/* Error messages */}
              {resultMessages.map((msg, i) => (
                <Alert key={i} severity="error" icon={<ErrorOutline />}>
                  <Typography variant="body2">{msg}</Typography>
                </Alert>
              ))}

              {/* Diagnostics Panel */}
              {hasDiagnostics && (
                <Box
                  sx={{
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {/* Diagnostics Header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                      borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Search sx={{ fontSize: 18, color: "warning.main" }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Root Cause Analysis
                      </Typography>
                      {blockedDomain && (
                        <Chip
                          label={blockedDomain}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ ml: "auto", height: 24, fontSize: "0.75rem" }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {diagnostics.length === 1
                        ? "1 policy issue was identified that is blocking this invitation:"
                        : `${diagnostics.length} policy issues were identified that may be blocking this invitation:`}
                    </Typography>
                  </Box>

                  {/* Individual Diagnostics */}
                  <Stack spacing={0} divider={<Divider />}>
                    {diagnostics.map((diag, idx) => (
                      <Box key={idx} sx={{ px: 2, py: 1.5 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                          <Box sx={{ pt: 0.25 }}>
                            {diag.severity === "error" ? (
                              <ErrorOutline sx={{ fontSize: 18, color: "error.main" }} />
                            ) : (
                              <WarningAmber sx={{ fontSize: 18, color: "warning.main" }} />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{ mb: 0.5 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    diag.severity === "error" ? "error.main" : "warning.main",
                                }}
                              >
                                {diag.issue}
                              </Typography>
                            </Stack>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mb: 0.5 }}
                            >
                              <strong>Source:</strong> {diag.source}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {diag.detail}
                            </Typography>

                            {diag.currentList && diag.currentList.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mb: 0.5 }}
                                >
                                  Current {diag.listType === "allowList" ? "allowed" : "blocked"}{" "}
                                  domains:
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                  {diag.currentList.map((domain, di) => (
                                    <Chip
                                      key={di}
                                      label={domain}
                                      size="small"
                                      variant="outlined"
                                      color={
                                        diag.listType === "allowList" ? "success" : "error"
                                      }
                                      sx={{ height: 22, fontSize: "0.7rem" }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            <Alert severity="info" variant="outlined" icon={false} sx={{ py: 0.5 }}>
                              <Typography variant="caption">
                                <strong>How to fix:</strong> {diag.fix}
                              </Typography>
                            </Alert>

                            {diag.settingsPage && (
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  component={Link}
                                  href={`${diag.settingsPage}?tenantFilter=${tenantFilter}`}
                                  target="_blank"
                                  size="small"
                                  variant="outlined"
                                  startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                                >
                                  Open {diag.source}
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </DialogContent>
        </Collapse>

        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            Close
          </Button>
          {(status === "idle" || status === "loading") && (
            <Button
              variant="contained"
              type="submit"
              disabled={!formHook.formState.isValid || status === "loading"}
              startIcon={status === "loading" ? <CircularProgress size={16} /> : <Send />}
            >
              {status === "loading" ? "Inviting..." : "Send Invitation"}
            </Button>
          )}
          {status === "error" && (
            <Button
              variant="contained"
              onClick={() => {
                setStatus("idle");
                setDiagnostics(null);
                setBlockedDomain(null);
                setResultMessages([]);
              }}
            >
              Try Again
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CippGuestInviteDialog;
