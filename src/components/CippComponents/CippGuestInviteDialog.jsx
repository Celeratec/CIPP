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
import { useEffect, useState, useCallback } from "react";
import { ApiPostCall } from "../../api/ApiCall";
import CippFormComponent from "./CippFormComponent";
import Link from "next/link";
import axios from "axios";
import { buildVersionedHeaders } from "../../utils/cippVersion";

/**
 * Detects whether an error message is a domain collaboration restriction.
 */
const isDomainCollaborationError = (messages) => {
  if (!messages || !Array.isArray(messages)) return false;
  return messages.some(
    (msg) =>
      typeof msg === "string" &&
      (msg.toLowerCase().includes("does not allow collaboration") ||
        msg.toLowerCase().includes("collaboration with the domain"))
  );
};

/**
 * Client-side diagnostic engine. Fetches External Collaboration and SharePoint
 * settings using the same proven API endpoints the settings pages use, then
 * analyzes them against the blocked domain.
 */
const runClientDiagnostics = async (tenantFilter, domain) => {
  const findings = [];
  const headers = await buildVersionedHeaders();

  // --- Fetch Entra External Collaboration settings ---
  try {
    const collabResp = await axios.get("/api/ListExternalCollaboration", {
      params: { tenantFilter },
      headers,
    });
    const collab = collabResp.data?.Results;

    if (collab) {
      // Check if invitations are completely disabled
      if (collab.allowInvitesFrom === "none") {
        findings.push({
          source: "Entra External Collaboration",
          issue: "Guest invitations are completely disabled",
          detail:
            "The 'Guest invite restrictions' setting is set to 'No one in the organization can invite guest users including admins'. All guest invitations are blocked regardless of domain.",
          fix: "Change the guest invite restrictions to allow at least admins and users in the Guest Inviter role to send invitations.",
          settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
          severity: "error",
        });
      }

      // Check domain allow/block lists
      const domainPolicy =
        collab.domainRestrictions?.InvitationsAllowedAndBlockedDomainsPolicy;

      if (domainPolicy) {
        const allowed = domainPolicy.AllowedDomains || [];
        const blocked = domainPolicy.BlockedDomains || [];

        if (allowed.length > 0 && !allowed.includes(domain)) {
          findings.push({
            source: "Entra External Collaboration",
            issue: `Domain '${domain}' is not in the allowed domains list`,
            detail: `The tenant uses a domain allow-list for guest invitations. Only users from these domains can be invited. The domain '${domain}' is not on this list.`,
            fix: `Add '${domain}' to the allowed domains list in External Collaboration settings, or switch to a block-list approach.`,
            settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
            severity: "error",
            currentList: allowed,
            listType: "allowList",
          });
        }

        if (blocked.length > 0 && blocked.includes(domain)) {
          findings.push({
            source: "Entra External Collaboration",
            issue: `Domain '${domain}' is explicitly blocked`,
            detail: `The domain '${domain}' appears in the blocked domains list for guest invitations. Users from this domain cannot be invited.`,
            fix: `Remove '${domain}' from the blocked domains list in External Collaboration settings.`,
            settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
            severity: "error",
            currentList: blocked,
            listType: "blockList",
          });
        }

        // If there's an allow-list and the domain IS on it, or no restrictions at all
        if (allowed.length === 0 && blocked.length === 0) {
          findings.push({
            source: "Entra External Collaboration",
            issue: "No domain restrictions configured in External Collaboration",
            detail:
              "The External Collaboration settings do not have any domain allow-list or block-list configured. The block may be coming from another policy layer.",
            fix: "Check Cross-Tenant Access Policies, Conditional Access policies, or Azure AD Identity Governance settings.",
            settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
            severity: "info",
          });
        }
      } else {
        // No domain policy object at all - this IS likely the cause
        // The B2B Management Policy doesn't exist, but the block is happening
        // In this case, domain restrictions might be configured but the legacy
        // policy API didn't return them
        findings.push({
          source: "Entra External Collaboration",
          issue: "Domain restriction policy could not be read",
          detail:
            "The B2B Management Policy that stores domain allow/deny lists could not be retrieved. Domain restrictions may still be configured through the Azure portal. Check External Collaboration settings directly.",
          fix: `Open External Collaboration settings and check the 'Collaboration restrictions' section. Ensure '${domain}' is allowed.`,
          settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
          severity: "warning",
        });
      }
    }
  } catch {
    // External Collaboration endpoint not available
    findings.push({
      source: "Entra External Collaboration",
      issue: "Could not retrieve External Collaboration settings",
      detail:
        "The External Collaboration settings API returned an error. Check permissions or try viewing the settings page directly.",
      fix: "Open External Collaboration settings to review domain restrictions manually.",
      settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
      severity: "warning",
    });
  }

  // --- Fetch SharePoint Sharing settings ---
  try {
    const spResp = await axios.get("/api/ListSharepointSettings", {
      params: { tenantFilter },
      headers,
    });
    const spData = Array.isArray(spResp.data) ? spResp.data[0] : spResp.data;

    if (spData) {
      if (spData.sharingCapability === "disabled") {
        findings.push({
          source: "SharePoint Sharing Settings",
          issue: "External sharing is completely disabled for SharePoint",
          detail:
            "SharePoint external sharing is set to 'Only people in your organization'. Even if the guest is invited to the tenant, they cannot access SharePoint content.",
          fix: "Enable external sharing in SharePoint Sharing Settings. At minimum, set it to 'Existing guests' or 'New and existing guests'.",
          settingsPage: "/teams-share/sharepoint/sharing-settings",
          severity: "warning",
        });
      }

      if (spData.sharingDomainRestrictionMode === "allowList") {
        const spAllowed = spData.sharingAllowedDomainList || [];
        if (spAllowed.length > 0 && !spAllowed.includes(domain)) {
          findings.push({
            source: "SharePoint Sharing Settings",
            issue: `Domain '${domain}' is not in the SharePoint allowed domains list`,
            detail: `SharePoint uses a separate domain allow-list for external sharing. The domain '${domain}' is not on this list, so even if the guest is invited to the tenant, they won't be able to access SharePoint content.`,
            fix: `Add '${domain}' to the SharePoint sharing allowed domains list.`,
            settingsPage: "/teams-share/sharepoint/sharing-settings",
            severity: "warning",
            currentList: spAllowed,
            listType: "allowList",
          });
        }
      } else if (spData.sharingDomainRestrictionMode === "blockList") {
        const spBlocked = spData.sharingBlockedDomainList || [];
        if (spBlocked.length > 0 && spBlocked.includes(domain)) {
          findings.push({
            source: "SharePoint Sharing Settings",
            issue: `Domain '${domain}' is blocked in SharePoint sharing settings`,
            detail: `The domain '${domain}' appears in the SharePoint blocked domains list.`,
            fix: `Remove '${domain}' from the SharePoint sharing blocked domains list.`,
            settingsPage: "/teams-share/sharepoint/sharing-settings",
            severity: "warning",
            currentList: spBlocked,
            listType: "blockList",
          });
        }
      }
    }
  } catch {
    // SharePoint settings not available - non-critical
  }

  return findings;
};

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
  const [diagLoading, setDiagLoading] = useState(false);

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
      setDiagLoading(false);
      formHook.reset({
        displayName: "",
        mail: "",
        redirectUri: "",
        sendInvite: false,
      });
    }
  }, [open]);

  const runDiagnostics = useCallback(
    async (errorMessages, email) => {
      const domain = email?.split("@")[1];
      if (!domain || !isDomainCollaborationError(errorMessages)) return;

      setBlockedDomain(domain);
      setDiagLoading(true);

      try {
        // First check if backend already provided diagnostics (non-fallback)
        // If not, run client-side diagnostics using the proven settings APIs
        const findings = await runClientDiagnostics(tenantFilter, domain);

        // Filter to only show actionable findings (skip info-level unless it's the only one)
        const actionable = findings.filter((f) => f.severity !== "info");
        setDiagnostics(actionable.length > 0 ? actionable : findings);
      } catch {
        setDiagnostics([
          {
            source: "Diagnostic Engine",
            issue: "Diagnostics failed",
            detail: "Could not retrieve tenant settings to diagnose the issue.",
            fix: "Check External Collaboration settings and SharePoint Sharing settings manually.",
            settingsPage: "/tenant/administration/cross-tenant-access/external-collaboration",
            severity: "warning",
          },
        ]);
      } finally {
        setDiagLoading(false);
      }
    },
    [tenantFilter]
  );

  const onSubmit = (data) => {
    setStatus("loading");
    setDiagnostics(null);
    setBlockedDomain(null);
    setResultMessages([]);
    setDiagLoading(false);

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
          setStatus("error");

          // Check if backend provided specific diagnostics (not fallback)
          const backendDiags = responseData?.Diagnostics;
          const hasRealDiag =
            backendDiags?.length > 0 &&
            !backendDiags.every((d) => d.source === "Unknown Policy");

          if (hasRealDiag) {
            setDiagnostics(backendDiags);
            setBlockedDomain(responseData?.BlockedDomain);
          } else {
            // Run client-side diagnostics - more reliable since it uses
            // the same API endpoints as the settings pages
            runDiagnostics(results, data.mail);
          }
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

              {/* Diagnostics Loading */}
              {diagLoading && (
                <Box
                  sx={{
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    borderRadius: 2,
                    px: 2,
                    py: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Analyzing tenant settings to identify the cause...
                    </Typography>
                  </Stack>
                </Box>
              )}

              {/* Diagnostics Panel */}
              {hasDiagnostics && !diagLoading && (
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      {(() => {
                        const errorCount = diagnostics.filter(
                          (d) => d.severity === "error"
                        ).length;
                        const warnCount = diagnostics.filter(
                          (d) => d.severity === "warning"
                        ).length;
                        if (errorCount > 0)
                          return `${errorCount} policy ${errorCount === 1 ? "restriction" : "restrictions"} identified that ${errorCount === 1 ? "is" : "are"} blocking this invitation:`;
                        if (warnCount > 0)
                          return `${warnCount} potential ${warnCount === 1 ? "issue" : "issues"} found — review the settings below:`;
                        return "Review the following settings:";
                      })()}
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
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                color:
                                  diag.severity === "error" ? "error.main" : "warning.main",
                              }}
                            >
                              {diag.issue}
                            </Typography>

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
                                  Current{" "}
                                  {diag.listType === "allowList" ? "allowed" : "blocked"}{" "}
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

                            <Alert
                              severity="info"
                              variant="outlined"
                              icon={false}
                              sx={{ py: 0.5 }}
                            >
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
                setDiagLoading(false);
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
