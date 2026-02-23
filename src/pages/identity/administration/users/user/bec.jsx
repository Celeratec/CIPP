import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { Layout as DashboardLayout } from "../../../../../layouts/index.js";
import { useSettings } from "../../../../../hooks/use-settings";
import { useRouter } from "next/router";
import { ApiGetCall } from "../../../../../api/ApiCall";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Fingerprint, 
  Launch,
  Warning,
  Info,
  Error as ErrorIcon,
  Person,
  Security,
} from "@mui/icons-material";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { HeaderedTabbedLayout } from "../../../../../layouts/HeaderedTabbedLayout";
import tabOptions from "./tabOptions";
import { CippCopyToClipBoard } from "../../../../../components/CippComponents/CippCopyToClipboard";
import { CippTimeAgo } from "../../../../../components/CippComponents/CippTimeAgo";
import { Box, Stack } from "@mui/system";
import { Grid } from "@mui/system";
import CippRemediationCard from "../../../../../components/CippCards/CippRemediationCard";
import CippButtonCard from "../../../../../components/CippCards/CippButtonCard";
import { SvgIcon, Typography, CircularProgress, Button, Chip, Alert, Paper, Avatar, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { PropertyList } from "../../../../../components/property-list";
import { PropertyListItem } from "../../../../../components/property-list-item";
import { CippHead } from "../../../../../components/CippComponents/CippHead";
import { useCippUserActions } from "../../../../../components/CippComponents/CippUserActions";
import { getInitials, stringToColor } from "../../../../../utils/get-initials";

// Reusable BEC Check Card Component - Memoized to prevent unnecessary re-renders
const BecCheckCard = memo(({ 
  title, 
  items, 
  itemsFound,
  noItemsMessage,
  itemsFoundMessage,
  renderItem,
  infoCheck = false, // For informational checks (MFA, passwords) that aren't necessarily bad
}) => {
  const hasItems = items && items.length > 0;
  
  // Determine icon and color based on whether items were found
  // For security checks: found = warning (potential issue), not found = success (all clear)
  // For info checks: found = info (just information), not found = disabled (no data)
  const getIconConfig = () => {
    if (infoCheck) {
      return hasItems 
        ? { icon: <Info />, color: "info" }
        : { icon: <CheckCircle />, color: "disabled" };
    }
    return hasItems 
      ? { icon: <Warning />, color: "warning" }
      : { icon: <CheckCircle />, color: "success" };
  };

  const { icon, color } = getIconConfig();

  return (
    <CippButtonCard
      variant="outlined"
      isFetching={false}
      title={
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>{title}</Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {hasItems && (
              <Chip 
                label={`${items.length} found`} 
                size="small" 
                color={infoCheck ? "info" : "warning"}
                variant="outlined"
              />
            )}
            <SvgIcon color={color}>
              {icon}
            </SvgIcon>
          </Stack>
        </Stack>
      }
    >
      <Typography variant="body2" gutterBottom>
        {hasItems ? itemsFoundMessage : noItemsMessage}
      </Typography>
      {hasItems && (
        <Box mt={2}>
          <PropertyList>
            {items.map((item, index) => renderItem(item, index))}
          </PropertyList>
        </Box>
      )}
    </CippButtonCard>
  );
});

BecCheckCard.displayName = "BecCheckCard";
import { BECRemediationReportButton } from "../../../../../components/BECRemediationReportButton";

const Page = () => {
  const userSettingsDefaults = useSettings();
  const router = useRouter();
  const theme = useTheme();
  const { userId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [restart, setRestart] = useState(false);
  const [initialReady, setInitialReady] = useState(false);
  const [becCheckReady, setBecCheckReady] = useState(false);
  const userActions = useCippUserActions();

  const userRequest = ApiGetCall({
    url: `/api/ListUsers?UserId=${userId}&tenantFilter=${userSettingsDefaults.currentTenant}`,
    queryKey: `ListUsers-${userId}`,
    waiting: initialReady,
  });

  useEffect(() => {
    if (userId) {
      setInitialReady(true);
    }
  }, [userId]);

  useEffect(() => {
    if (userRequest.isSuccess && userRequest.data?.[0]?.userPrincipalName) {
      setBecCheckReady(true);
    }
  }, [userRequest]);

  const becInitialCall = ApiGetCall({
    url: `/api/execBECCheck`,
    data: {
      userId: userId,
      tenantFilter: userSettingsDefaults.currentTenant,
      username: userRequest.data?.[0]?.userPrincipalName,
      ...(restart && { Overwrite: true }),
    },
    queryKey: `execBECCheck-initial-${userId}-${userSettingsDefaults.currentTenant}-${userRequest.data?.[0]?.userPrincipalName}`,
    waiting: becCheckReady,
  });

  // Fetch BEC Check result using GUID
  const becPollingCall = ApiGetCall({
    url: `/api/execBECCheck`,
    data: {
      GUID: becInitialCall.data?.GUID,
      tenantFilter: userSettingsDefaults.currentTenant,
    },
    queryKey: `execBECCheck-polling-${becInitialCall.data?.GUID}`,
    waiting: false,
  });

  // Effect to monitor becGuid and start polling
  useEffect(() => {
    if (becInitialCall.data?.GUID) {
      setIsLoading(true);
      if (!becPollingCall.data || becPollingCall.data?.Waiting) {
        setTimeout(() => {
          becPollingCall.refetch();
        }, 10000);
      }
    }

    if (becPollingCall.isSuccess && becPollingCall.data && !becPollingCall.data?.Waiting) {
      setIsLoading(false);
    }
  }, [becPollingCall.dataUpdatedAt, becInitialCall]);

  const restartProcess = () => {
    setRestart(true);
    becPollingCall.refetch();
    setTimeout(() => {
      becInitialCall.refetch();
      becPollingCall.refetch();
    }, 500);
  };

  // Combine loading states
  const isFetching =
    userRequest.isLoading || becInitialCall.isLoading || becPollingCall.isLoading || isLoading;



  const subtitle = userRequest.isSuccess
    ? [
        {
          icon: <Mail />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.userPrincipalName} />,
        },
        {
          icon: <Fingerprint />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.id} />,
        },
        {
          icon: <CalendarIcon />,
          text: (
            <>
              Created: <CippTimeAgo data={userRequest.data?.[0]?.createdDateTime} />
            </>
          ),
        },
        {
          icon: <Launch style={{ color: "#757575" }} />,
          text: (
            <Button
              color="muted"
              style={{ paddingLeft: 0 }}
              size="small"
              href={`https://entra.microsoft.com/${userSettingsDefaults.currentTenant}/#view/Microsoft_AAD_UsersAndTenants/UserProfileMenuBlade/~/overview/userId/${userId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Entra
            </Button>
          ),
        },
      ]
    : [];

  // Show loading state while user data is being fetched
  const isUserLoading = !userRequest.isSuccess && (userRequest.isLoading || !router.isReady);
  const noUserSelected = router.isReady && !userId;

  // Determine title based on state
  const getTitle = () => {
    if (noUserSelected) return "No User Selected";
    if (userRequest.isSuccess) return userRequest.data?.[0]?.displayName || "Unknown User";
    if (isUserLoading) return "Loading User...";
    return "User Not Found";
  };

  return (
    <HeaderedTabbedLayout
      tabOptions={tabOptions}
      title={getTitle()}
      subtitle={subtitle}
      actions={userActions}
      actionsData={userRequest.data?.[0]}
      isFetching={userRequest.isFetching || isUserLoading}
    >
      <CippHead title="Compromise Remediation" />

      {/* No User Selected State */}
      {noUserSelected && (
        <Box sx={{ py: 4 }}>
          <Alert 
            severity="warning" 
            icon={<ShieldExclamationIcon style={{ width: 24, height: 24 }} />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              No User Selected
            </Typography>
            <Typography variant="body2">
              This page requires a user ID to be specified. Please navigate here from a user list or risky users page by selecting a specific user to analyze.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push("/identity/administration/risky-users")}
            startIcon={<ShieldExclamationIcon style={{ width: 20, height: 20 }} />}
          >
            Go to Risky Users
          </Button>
        </Box>
      )}

      {/* Initial User Loading State */}
      {!noUserSelected && isUserLoading && (
        <Box sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
              borderLeft: `4px solid ${theme.palette.warning.main}`,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                  color: theme.palette.warning.main,
                  width: 56,
                  height: 56,
                }}
              >
                <Security sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" fontWeight={600}>
                    Loading Compromise Analysis
                  </Typography>
                  <CircularProgress size={20} color="warning" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  User ID: <code style={{ 
                    backgroundColor: alpha(theme.palette.text.primary, 0.08), 
                    padding: "2px 6px", 
                    borderRadius: 4,
                    fontSize: "0.8rem",
                  }}>{userId}</code>
                </Typography>
              </Box>
            </Stack>
          </Paper>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={100} />
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* User Not Found State */}
      {!noUserSelected && !isUserLoading && !userRequest.isSuccess && userRequest.isError && (
        <Box sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              User Not Found
            </Typography>
            <Typography variant="body2">
              Could not find user with ID: {userId}. The user may have been deleted or you may not have permission to view this user.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push("/identity/administration/risky-users")}
            startIcon={<ShieldExclamationIcon style={{ width: 20, height: 20 }} />}
          >
            Back to Risky Users
          </Button>
        </Box>
      )}

      {/* Loading State: Show only Remediation Card and Check 1 with Loading Skeleton */}
      {isFetching && userRequest.isSuccess && (
        <Box
          sx={{
            flexGrow: 1,
            py: 1,
          }}
        >
          <Grid container spacing={2}>
            {/* Remediation Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <CippRemediationCard
                userPrincipalName={userRequest.data[0].userPrincipalName}
                userId={userRequest.data[0].id}
                tenantFilter={userSettingsDefaults.currentTenant}
                restartProcess={restartProcess}
                isFetching={false}
              />
            </Grid>
            {/* Check 1 Card with Loading */}
            <Grid size={{ xs: 12, md: 7 }}>
              <CippButtonCard
                variant="outlined"
                isFetching={false}
                title={
                  <Stack direction="row" justifyContent={"space-between"}>
                    <Box>Loading data</Box>
                    <CircularProgress size={20} />
                  </Stack>
                }
              >
                <Typography variant="body2" gutterBottom>
                  This Analysis can take up to 10 minutes to complete depending on the amount of
                  logs. Please wait for the process to finish.
                </Typography>
              </CippButtonCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Loaded State: Show all steps */}
      {!isFetching && userRequest.isSuccess && (
        <Box
          sx={{
            flexGrow: 1,
            py: 4,
          }}
        >
          <Grid container spacing={2}>
            {/* Remediation Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <CippRemediationCard
                userPrincipalName={userRequest.data[0].userPrincipalName}
                userId={userRequest.data[0].id}
                tenantFilter={userSettingsDefaults.currentTenant}
                isFetching={false}
                restartProcess={restartProcess}
              />
            </Grid>
            {/* All Steps */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                {/* Log Information Card */}
                <CippButtonCard
                  variant="outlined"
                  isFetching={false}
                  title={
                    <Stack direction="row" justifyContent={"space-between"}>
                      <Box>Log Information</Box>
                      <SvgIcon color="success">
                        <CheckCircle />
                      </SvgIcon>
                    </Stack>
                  }
                >
                  <Typography variant="body2" gutterBottom>
                    {becPollingCall.data?.ExtractResult}. The data of this log was extracted at{" "}
                    {new Date(becPollingCall.data?.ExtractedAt).toLocaleString()}. This data might
                    be cached. To get the latest version of the data, click the Refresh Data button.
                  </Typography>
                </CippButtonCard>

                {/* Check 1: Mailbox Rules */}
                <BecCheckCard
                  title="Check 1: Mailbox Rules"
                  items={becPollingCall.data?.NewRules}
                  noItemsMessage="No suspicious mailbox rules found. This is a good sign."
                  itemsFoundMessage="Mailbox rules have been found. Please review the list below - rules that forward or delete emails could indicate compromise."
                  renderItem={(rule, index) => (
                    <PropertyListItem
                      key={index}
                      label={rule?.Name}
                      value={rule?.Description}
                    />
                  )}
                />

                {/* Check 2: Recently added users */}
                <BecCheckCard
                  title="Check 2: Recently Added Users"
                  items={becPollingCall.data?.NewUsers}
                  noItemsMessage="No new users have been added in the last 14 days."
                  itemsFoundMessage="New users have been found in the last 14 days. Please verify these accounts are legitimate."
                  renderItem={(user, index) => (
                    <PropertyListItem
                      key={index}
                      label={user?.userPrincipalName}
                      value={user?.createdDateTime}
                    />
                  )}
                />

                {/* Check 3: New Applications */}
                <BecCheckCard
                  title="Check 3: New Applications"
                  items={becPollingCall.data?.AddedApps}
                  noItemsMessage="No new applications have been added recently."
                  itemsFoundMessage="New applications have been found. Please verify these apps are authorized and legitimate."
                  renderItem={(app, index) => (
                    <PropertyListItem
                      key={index}
                      label={`${app?.displayName} - ${app?.appId}`}
                      value={app?.createdDateTime}
                    />
                  )}
                />

                {/* Check 4: Mailbox Permission Changes */}
                <BecCheckCard
                  title="Check 4: Mailbox Permission Changes"
                  items={becPollingCall.data?.MailboxPermissionChanges}
                  noItemsMessage="No mailbox permission changes detected."
                  itemsFoundMessage="Mailbox permission changes have been detected. Review to ensure these were authorized."
                  renderItem={(permission, index) => (
                    <PropertyListItem
                      key={index}
                      label={permission.UserKey}
                      value={`${permission.Operation} - ${permission.Permissions}`}
                    />
                  )}
                />

                {/* Check 5: MFA Devices - Informational */}
                <BecCheckCard
                  title="Check 5: MFA Devices"
                  items={becPollingCall.data?.MFADevices}
                  infoCheck={true}
                  noItemsMessage="No MFA devices registered for this user."
                  itemsFoundMessage="MFA Devices are registered for this user. Review to ensure no unauthorized devices have been added."
                  renderItem={(device, index) => (
                    <PropertyListItem
                      key={index}
                      label={device["@odata.type"]?.replace("#microsoft.graph.", "")}
                      value={`${device?.displayName || "Unknown"} - Registered at ${device?.createdDateTime}`}
                    />
                  )}
                />

                {/* Check 6: Password Changes - Informational */}
                <BecCheckCard
                  title="Check 6: Password Changes"
                  items={becPollingCall.data?.ChangedPasswords}
                  infoCheck={true}
                  noItemsMessage="No recent password changes detected."
                  itemsFoundMessage="Recent password changes detected. Verify these were initiated by legitimate users."
                  renderItem={(user, index) => (
                    <PropertyListItem
                      key={index}
                      label={user?.displayName}
                      value={user?.lastPasswordChangeDateTime}
                    />
                  )}
                />

                {/* Report Download Card */}
                <CippButtonCard
                  variant="outlined"
                  isFetching={false}
                  title={
                    <Stack direction="row" justifyContent={"space-between"}>
                      <Box>Download Report</Box>
                      <SvgIcon color={becPollingCall.data ? "success" : "disabled"}>
                        <CheckCircle />
                      </SvgIcon>
                    </Stack>
                  }
                >
                  <Typography variant="body2" gutterBottom>
                    Generate a comprehensive PDF report for documentation, compliance, or end-user
                    review. The report includes detailed explanations suitable for non-technical
                    users, managers, and compliance requirements (ISO/CMMC/SOC).
                  </Typography>
                  {becPollingCall.data && (
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={2}>
                        <BECRemediationReportButton
                          userData={userRequest.data[0]}
                          becData={becPollingCall.data}
                          tenantName={userSettingsDefaults.currentTenant}
                        />
                        <Button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(becPollingCall.data, null, 2)], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `BEC_Report_${userRequest.data[0].userPrincipalName}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          variant="outlined"
                          startIcon={
                            <SvgIcon fontSize="small">
                              <Download />
                            </SvgIcon>
                          }
                        >
                          Download JSON
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CippButtonCard>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </HeaderedTabbedLayout>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
