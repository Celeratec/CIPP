import { useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { useSettings } from "../../../../hooks/use-settings";
import { ApiGetCall } from "../../../../api/ApiCall";
import { useDialog } from "../../../../hooks/use-dialog";
import { CippApiDialog } from "../../../../components/CippComponents/CippApiDialog";
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Grid, Stack } from "@mui/system";
import {
  ArrowBack,
  Phone,
  PhoneEnabled,
  PhoneDisabled,
  Person,
  PersonAdd,
  PersonRemove,
  LocationOn,
  Flag,
  CheckCircle,
  Warning,
  SyncAlt,
  CalendarToday,
  Speed,
  Shield,
} from "@mui/icons-material";
import Link from "next/link";

const getAssignedToDisplay = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.displayName || value.userPrincipalName || value.id || "";
  }
  return String(value);
};

const InfoRow = ({ label, value, mono = false }) => {
  if (!value) return null;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          fontFamily: mono ? "monospace" : "inherit",
          fontSize: mono ? "0.8rem" : "inherit",
          maxWidth: "60%",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
};

const StatBox = ({ label, value, color = "primary" }) => (
  <Box sx={{ textAlign: "center", flex: 1, py: 1.5 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: `${color}.main` }}>
      {value ?? "—"}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const Page = () => {
  const router = useRouter();
  const { number } = router.query;
  const tenant = useSettings().currentTenant;

  const assignDialog = useDialog();
  const unassignDialog = useDialog();
  const locationDialog = useDialog();

  const phoneData = ApiGetCall({
    url: "/api/ListTeamsVoice",
    data: { tenantFilter: tenant },
    queryKey: `TeamsVoice-${tenant}`,
    waiting: !!(tenant),
  });

  const phoneNumber = useMemo(() => {
    if (!phoneData.data || !number) return null;
    const data = Array.isArray(phoneData.data) ? phoneData.data : [];
    return data.find((p) => p.TelephoneNumber === number) || null;
  }, [phoneData.data, number]);

  if (!number || phoneData.isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Button
            component={Link}
            href="/teams-share/teams/business-voice"
            startIcon={<ArrowBack />}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to Phone Numbers
          </Button>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Stack>
      </Container>
    );
  }

  if (phoneData.isError || !phoneNumber) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Button
            component={Link}
            href="/teams-share/teams/business-voice"
            startIcon={<ArrowBack />}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to Phone Numbers
          </Button>
          <Alert severity="error">
            {phoneData.isError
              ? "Failed to load phone number data."
              : `Phone number "${number}" not found.`}
          </Alert>
        </Stack>
      </Container>
    );
  }

  const isAssigned = phoneNumber.AssignmentStatus === "Assigned";
  const isOperatorConnect =
    phoneNumber.IsOperatorConnect === true ||
    phoneNumber.IsOperatorConnect === "True" ||
    phoneNumber.IsOperatorConnect === "true";
  const assignedUser = getAssignedToDisplay(phoneNumber.AssignedTo);
  const accentColor = isAssigned ? "success" : "warning";

  return (
    <>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Button
            component={Link}
            href="/teams-share/teams/business-voice"
            startIcon={<ArrowBack />}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to Phone Numbers
          </Button>

          {/* Hero + Stats Row */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: "100%",
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(
                      theme.palette[accentColor].main,
                      0.12
                    )} 0%, ${alpha(theme.palette[accentColor].main, 0.04)} 100%)`,
                  borderLeft: (theme) =>
                    `4px solid ${theme.palette[accentColor].main}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: (theme) =>
                        alpha(theme.palette[accentColor].main, 0.15),
                      color: (theme) => theme.palette[accentColor].main,
                      width: 64,
                      height: 64,
                    }}
                  >
                    {isAssigned ? (
                      <PhoneEnabled sx={{ fontSize: 32 }} />
                    ) : (
                      <PhoneDisabled sx={{ fontSize: 32 }} />
                    )}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                      {phoneNumber.TelephoneNumber}
                    </Typography>
                    {isAssigned && assignedUser && (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        sx={{ mb: 0.75 }}
                      >
                        <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {assignedUser}
                        </Typography>
                      </Stack>
                    )}
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        icon={
                          isAssigned ? (
                            <CheckCircle fontSize="small" />
                          ) : (
                            <Warning fontSize="small" />
                          )
                        }
                        label={isAssigned ? "Assigned" : "Unassigned"}
                        size="small"
                        color={accentColor}
                        variant="outlined"
                      />
                      {phoneNumber.NumberType && (
                        <Chip
                          icon={<Phone fontSize="small" />}
                          label={phoneNumber.NumberType}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {isOperatorConnect && (
                        <Tooltip title="Provisioned via Operator Connect">
                          <Chip
                            icon={<SyncAlt fontSize="small" />}
                            label="Operator Connect"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                      {phoneNumber.ActivationState && (
                        <Chip
                          label={phoneNumber.ActivationState}
                          size="small"
                          color={
                            phoneNumber.ActivationState === "Activated"
                              ? "success"
                              : phoneNumber.ActivationState === "AssignmentPending"
                              ? "info"
                              : "default"
                          }
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Stack
                  direction="row"
                  divider={<Divider orientation="vertical" flexItem />}
                  spacing={0}
                >
                  <StatBox
                    label="Status"
                    value={isAssigned ? "Assigned" : "Unassigned"}
                    color={accentColor}
                  />
                  <StatBox
                    label="Country"
                    value={phoneNumber.IsoCountryCode || "—"}
                    color="primary"
                  />
                  <StatBox
                    label="Type"
                    value={phoneNumber.NumberType || "—"}
                    color="info"
                  />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAdd />}
                onClick={() => assignDialog.handleOpen()}
              >
                Assign User
              </Button>
              {isAssigned && (
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<PersonRemove />}
                  onClick={() => unassignDialog.handleOpen()}
                >
                  Unassign User
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<LocationOn />}
                onClick={() => locationDialog.handleOpen()}
              >
                Set Emergency Location
              </Button>
            </Stack>
          </Paper>

          {/* Assignment + Location Info */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Assignment
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <InfoRow
                    label="Assignment Status"
                    value={phoneNumber.AssignmentStatus}
                  />
                  <InfoRow
                    label="Assigned To"
                    value={assignedUser || "Unassigned"}
                  />
                  <InfoRow label="Number Type" value={phoneNumber.NumberType} />
                  <InfoRow
                    label="Activation State"
                    value={phoneNumber.ActivationState}
                  />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Location
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <InfoRow
                    label="Country Code"
                    value={phoneNumber.IsoCountryCode}
                  />
                  <InfoRow
                    label="Emergency Location"
                    value={phoneNumber.PlaceName}
                  />
                  <InfoRow label="City" value={phoneNumber.CityCode} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Capabilities + Details */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Speed fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Capabilities
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <InfoRow
                    label="Acquired Capabilities"
                    value={phoneNumber.AcquiredCapabilities}
                  />
                  <InfoRow
                    label="Available Capabilities"
                    value={phoneNumber.AvailableCapabilities}
                  />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Shield fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Additional Details
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  <InfoRow
                    label="Operator Connect"
                    value={isOperatorConnect ? "Yes" : "No"}
                  />
                  {phoneNumber.AcquisitionDate && (
                    <InfoRow
                      label="Acquisition Date"
                      value={new Date(
                        phoneNumber.AcquisitionDate
                      ).toLocaleDateString()}
                    />
                  )}
                  <InfoRow
                    label="Telephone Number ID"
                    value={phoneNumber.Id}
                    mono
                  />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      {/* Assign User Dialog */}
      <CippApiDialog
        title="Assign User"
        createDialog={assignDialog}
        api={{
          url: "/api/ExecTeamsVoicePhoneNumberAssignment",
          type: "POST",
          data: {
            PhoneNumber: phoneNumber.TelephoneNumber,
            PhoneNumberType: phoneNumber.NumberType,
            locationOnly: false,
          },
          confirmText: `Select the User to assign the phone number '${phoneNumber.TelephoneNumber}' to.`,
          multiPost: false,
        }}
        fields={[
          {
            type: "autoComplete",
            name: "input",
            label: "Select User",
            multiple: false,
            creatable: false,
            api: {
              url: "/api/listUsers",
              labelField: (input) =>
                `${input.displayName} (${input.userPrincipalName})`,
              valueField: "userPrincipalName",
            },
          },
        ]}
        row={phoneNumber}
        relatedQueryKeys={[`TeamsVoice-${tenant}`]}
      />

      {/* Unassign User Dialog */}
      <CippApiDialog
        title="Unassign User"
        createDialog={unassignDialog}
        api={{
          url: "/api/ExecRemoveTeamsVoicePhoneNumberAssignment",
          type: "POST",
          data: {
            PhoneNumber: phoneNumber.TelephoneNumber,
            AssignedTo: phoneNumber.AssignedTo,
            PhoneNumberType: phoneNumber.NumberType,
          },
          confirmText: `Are you sure you want to remove the assignment for '${phoneNumber.TelephoneNumber}' from '${assignedUser}'?`,
          multiPost: false,
        }}
        row={phoneNumber}
        relatedQueryKeys={[`TeamsVoice-${tenant}`]}
      />

      {/* Set Emergency Location Dialog */}
      <CippApiDialog
        title="Set Emergency Location"
        createDialog={locationDialog}
        api={{
          url: "/api/ExecTeamsVoicePhoneNumberAssignment",
          type: "POST",
          data: {
            PhoneNumber: phoneNumber.TelephoneNumber,
            locationOnly: true,
          },
          confirmText: `Select the Emergency Location for '${phoneNumber.TelephoneNumber}'.`,
          multiPost: false,
        }}
        fields={[
          {
            type: "autoComplete",
            name: "input",
            label: "Emergency Location",
            api: {
              url: "/api/ListTeamsLisLocation",
              labelField: "Description",
              valueField: "LocationId",
            },
          },
        ]}
        row={phoneNumber}
        relatedQueryKeys={[`TeamsVoice-${tenant}`]}
      />
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
