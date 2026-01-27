import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Divider,
  Skeleton,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { getCippFormatting } from "../../utils/get-cipp-formatting";
import { 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Sync,
  Mail,
  Storage,
  Forward,
  Archive,
  Security,
  SettingsEthernet,
  Warning,
  CheckCircle,
  Block,
  VisibilityOff,
} from "@mui/icons-material";
import { Stack, Grid, Box } from "@mui/system";
import { alpha, useTheme } from "@mui/material/styles";

// Section component for consistent styling
const InfoSection = ({ icon: Icon, title, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Icon fontSize="small" color="primary" />
      <Typography variant="subtitle2" fontWeight={600}>
        {title}
      </Typography>
    </Stack>
    {children}
  </Box>
);

// Stat card component for key metrics
const StatCard = ({ icon: Icon, label, value, color = "primary", subtitle }) => {
  const theme = useTheme();
  // Handle "default" color by using grey
  const paletteColor = color === "default" ? theme.palette.grey[500] : theme.palette[color]?.main || theme.palette.grey[500];
  
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        textAlign: "center",
        borderColor: alpha(paletteColor, 0.3),
        bgcolor: alpha(paletteColor, 0.04),
      }}
    >
      <Icon sx={{ color: paletteColor, fontSize: 24, mb: 0.5 }} />
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export const CippExchangeInfoCard = (props) => {
  const { exchangeData, isLoading = false, isFetching = false, handleRefresh, ...other } = props;
  const theme = useTheme();

  // Define the protocols array
  const protocols = [
    { name: "EWS", enabled: exchangeData?.EWSEnabled },
    { name: "MAPI", enabled: exchangeData?.MailboxMAPIEnabled },
    { name: "OWA", enabled: exchangeData?.MailboxOWAEnabled },
    { name: "IMAP", enabled: exchangeData?.MailboxImapEnabled },
    { name: "POP", enabled: exchangeData?.MailboxPopEnabled },
    { name: "ActiveSync", enabled: exchangeData?.MailboxActiveSyncEnabled },
  ];

  // Define mailbox hold types array
  const holds = [
    { name: "Litigation", enabled: exchangeData?.LitigationHold },
    { name: "Retention", enabled: exchangeData?.RetentionHold },
    { name: "Compliance Tag", enabled: exchangeData?.ComplianceTagHold },
    { name: "In-Place", enabled: exchangeData?.InPlaceHold },
    { name: "eDiscovery", enabled: exchangeData?.EDiscoveryHold },
    { name: "Purview Retention", enabled: exchangeData?.PurviewRetentionHold },
  ];

  const activeHolds = holds.filter(h => h.enabled);
  const enabledProtocols = protocols.filter(p => p.enabled);

  // Calculate usage percentage
  const usagePercent = exchangeData?.TotalItemSize && exchangeData?.ProhibitSendReceiveQuota
    ? Math.round((exchangeData.TotalItemSize / exchangeData.ProhibitSendReceiveQuota) * 100)
    : 0;

  // Determine forwarding status
  const forwardingAddress = exchangeData?.ForwardingAddress;
  let forwardingType = "None";
  let cleanAddress = "";
  if (forwardingAddress) {
    if (forwardingAddress.startsWith("smtp:")) {
      forwardingType = "External";
      cleanAddress = forwardingAddress.replace("smtp:", "");
    } else {
      forwardingType = "Internal";
      cleanAddress = forwardingAddress;
    }
  }

  if (isLoading) {
    return (
      <Card {...other}>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={100} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...other}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Mail color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Exchange Mailbox
              </Typography>
            </Stack>
            {isFetching ? (
              <CircularProgress size={20} />
            ) : (
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} size="small">
                  <Sync />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Spam Alert */}
          {exchangeData?.BlockedForSpam && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This mailbox is currently blocked for spam.
            </Alert>
          )}

          {/* Quick Stats */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                icon={Mail}
                label="Type"
                value={exchangeData?.RecipientTypeDetails || "N/A"}
                color="primary"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                icon={SettingsEthernet}
                label="Protocols"
                value={`${enabledProtocols.length}/${protocols.length}`}
                color="info"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                icon={Security}
                label="Holds"
                value={activeHolds.length > 0 ? activeHolds.length : "None"}
                color={activeHolds.length > 0 ? "warning" : "success"}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                icon={Archive}
                label="Archive"
                value={exchangeData?.ArchiveMailBox ? "Enabled" : "Disabled"}
                color={exchangeData?.ArchiveMailBox ? "success" : "default"}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Content */}
        <Box sx={{ p: 2.5 }}>
          {/* Storage Usage */}
          <InfoSection icon={Storage} title="Storage Usage">
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Mailbox Size
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {exchangeData?.TotalItemSize != null 
                    ? `${Math.round(exchangeData.TotalItemSize * 100) / 100} GB` 
                    : "N/A"} 
                  {exchangeData?.ProhibitSendReceiveQuota && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {" "}/ {Math.round(exchangeData.ProhibitSendReceiveQuota)} GB
                    </Typography>
                  )}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercent, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    bgcolor: usagePercent > 90 
                      ? theme.palette.error.main 
                      : usagePercent > 75 
                        ? theme.palette.warning.main 
                        : theme.palette.primary.main,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {usagePercent}% used
              </Typography>
            </Paper>
          </InfoSection>

          <Divider sx={{ my: 2 }} />

          {/* Mailbox Settings */}
          <InfoSection icon={Mail} title="Mailbox Settings">
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {exchangeData?.HiddenFromAddressLists ? (
                      <VisibilityOff fontSize="small" color="warning" />
                    ) : (
                      <CheckCircle fontSize="small" color="success" />
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Address List
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {exchangeData?.HiddenFromAddressLists ? "Hidden" : "Visible"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {exchangeData?.BlockedForSpam ? (
                      <Block fontSize="small" color="error" />
                    ) : (
                      <CheckCircle fontSize="small" color="success" />
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Spam Status
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {exchangeData?.BlockedForSpam ? "Blocked" : "Clear"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
            {exchangeData?.RetentionPolicy && (
              <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Retention Policy
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {exchangeData.RetentionPolicy}
                </Typography>
              </Paper>
            )}
          </InfoSection>

          <Divider sx={{ my: 2 }} />

          {/* Forwarding */}
          <InfoSection icon={Forward} title="Forwarding">
            {forwardingType === "None" ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                  borderColor: alpha(theme.palette.success.main, 0.3),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircle fontSize="small" color="success" />
                  <Typography variant="body2">No forwarding configured</Typography>
                </Stack>
              </Paper>
            ) : (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.warning.main, 0.04),
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning fontSize="small" color="warning" />
                    <Chip 
                      label={`${forwardingType} Forwarding Active`} 
                      color="warning" 
                      size="small" 
                    />
                  </Stack>
                  <Typography variant="body2">
                    <strong>To:</strong> {cleanAddress}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exchangeData?.ForwardAndDeliver 
                      ? "Copy kept in mailbox" 
                      : "No copy kept in mailbox"}
                  </Typography>
                </Stack>
              </Paper>
            )}
          </InfoSection>

          <Divider sx={{ my: 2 }} />

          {/* Archive */}
          {exchangeData?.ArchiveMailBox && (
            <>
              <InfoSection icon={Archive} title="Archive Mailbox">
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Archive Size
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {exchangeData?.TotalArchiveItemSize != null
                          ? `${exchangeData.TotalArchiveItemSize} GB`
                          : "N/A"}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Archive Items
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {exchangeData?.TotalArchiveItemCount?.toLocaleString() || "N/A"}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        icon={exchangeData?.AutoExpandingArchive ? <CheckIcon /> : <CloseIcon />}
                        label="Auto-Expanding Archive"
                        color={exchangeData?.AutoExpandingArchive ? "success" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </InfoSection>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Protocols */}
          <InfoSection icon={SettingsEthernet} title="Protocols">
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {protocols.map((protocol) => (
                <Chip
                  key={protocol.name}
                  label={protocol.name}
                  icon={protocol.enabled ? <CheckIcon /> : <CloseIcon />}
                  color={protocol.enabled ? "success" : "default"}
                  variant={protocol.enabled ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Stack>
          </InfoSection>

          <Divider sx={{ my: 2 }} />

          {/* Holds */}
          <InfoSection icon={Security} title="Mailbox Holds">
            {activeHolds.length === 0 ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                  borderColor: alpha(theme.palette.success.main, 0.3),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircle fontSize="small" color="success" />
                  <Typography variant="body2">No holds applied</Typography>
                </Stack>
              </Paper>
            ) : (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {holds.map((hold) => (
                  hold.enabled && (
                    <Chip
                      key={hold.name}
                      label={hold.name}
                      icon={<Security />}
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  )
                ))}
              </Stack>
            )}
            {exchangeData?.ExcludedFromOrgWideHold && (
              <Alert severity="info" sx={{ mt: 1.5 }}>
                This mailbox is excluded from organization-wide holds.
              </Alert>
            )}
          </InfoSection>
        </Box>
      </CardContent>
    </Card>
  );
};

CippExchangeInfoCard.propTypes = {
  exchangeData: PropTypes.object,
  isLoading: PropTypes.bool,
  isFetching: PropTypes.bool,
  handleRefresh: PropTypes.func,
};
