import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Skeleton,
  Typography,
  CircularProgress,
  Paper,
  Avatar,
  Chip,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import { 
  Block, 
  Close, 
  Done, 
  DoneAll,
  Email,
  Security,
  CheckCircle,
  Pending,
  Cancel,
  CalendarToday,
  Person,
} from "@mui/icons-material";
import { CippMessageViewer } from "../../../../components/CippComponents/CippMessageViewer.jsx";
import { ApiGetCall, ApiPostCall } from "../../../../api/ApiCall";
import { useSettings } from "../../../../hooks/use-settings";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import { getInitials, stringToColor } from "../../../../utils/get-initials";

const simpleColumns = [
  "ReceivedTime",
  "ReleaseStatus",
  "Subject",
  "SenderAddress",
  "RecipientAddress",
  "Type",
  "PolicyName",
  "Tenant",
];
const detailColumns = ["Received", "Status", "SenderAddress", "RecipientAddress"];
const pageTitle = "Quarantine Management";

const Page = () => {
  const tenantFilter = useSettings().currentTenant;
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [traceDialogOpen, setTraceDialogOpen] = useState(false);
  const [traceDetails, setTraceDetails] = useState([]);
  const [traceMessageId, setTraceMessageId] = useState(null);
  const [messageSubject, setMessageSubject] = useState(null);
  const [messageContentsWaiting, setMessageContentsWaiting] = useState(false);

  const getMessageContents = ApiGetCall({
    url: "/api/ListMailQuarantineMessage",
    data: {
      tenantFilter: tenantFilter,
      Identity: messageId,
    },
    waiting: messageContentsWaiting,
    queryKey: `ListMailQuarantineMessage-${messageId}`,
  });

  const getMessageTraceDetails = ApiPostCall({
    urlFromData: true,
    queryKey: `MessageTraceDetail-${traceMessageId}`,
    onResult: (result) => {
      setTraceDetails(result);
    },
  });

  const viewMessage = (row) => {
    const id = row.Identity;
    setMessageId(id);
    if (!messageContentsWaiting) {
      setMessageContentsWaiting(true);
    }
    getMessageContents.refetch();
    setDialogOpen(true);
  };

  const viewMessageTrace = (row) => {
    setTraceMessageId(row.MessageId);
    getMessageTraceDetails.mutate({
      url: "/api/ListMessageTrace",
      data: {
        tenantFilter: tenantFilter,
        messageId: row.MessageId,
      },
    });
    setMessageSubject(row.Subject);
    setTraceDialogOpen(true);
  };

  useEffect(() => {
    if (getMessageContents.isSuccess) {
      setDialogContent(<CippMessageViewer emailSource={getMessageContents?.data?.Message} />);
    } else {
      setDialogContent(<Skeleton variant="rectangular" height={400} />);
    }
  }, [getMessageContents.isSuccess, getMessageContents.data]);

  const actions = [
    {
      label: "View Message",
      noConfirm: true,
      customFunction: viewMessage,
      icon: <EyeIcon />,
    },
    {
      label: "View Message Trace",
      noConfirm: true,
      customFunction: viewMessageTrace,
      icon: <DocumentTextIcon />,
    },
    {
      label: "Release",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: {
        Identity: "Identity",
        Type: "!Release",
      },
      confirmText: "Are you sure you want to release this message?",
      icon: <Done />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Deny",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      data: {
        Identity: "Identity",
        Type: "!Deny",
      },
      confirmText: "Are you sure you want to deny this message?",
      icon: <Block />,
      condition: (row) => row.ReleaseStatus !== "DENIED",
    },
    {
      label: "Release & Allow Sender",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      data: {
        Identity: "Identity",
        Type: "!Release",
        AllowSender: true,
      },
      confirmText:
        "Are you sure you want to release this email and add the sender to the whitelist?",
      icon: <DoneAll />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
  ];

  // Helper for release status
  const getReleaseStatusInfo = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "RELEASED":
        return { label: "Released", color: theme.palette.success.main, icon: <CheckCircle fontSize="small" /> };
      case "DENIED":
        return { label: "Denied", color: theme.palette.error.main, icon: <Cancel fontSize="small" /> };
      case "REQUESTED":
        return { label: "Requested", color: theme.palette.warning.main, icon: <Pending fontSize="small" /> };
      case "NOTRELEASED":
      default:
        return { label: "Not Released", color: theme.palette.warning.main, icon: <Pending fontSize="small" /> };
    }
  };

  const offCanvas = {
    actions: actions,
    children: (row) => {
      const statusInfo = getReleaseStatusInfo(row.ReleaseStatus);
      
      return (
        <Stack spacing={3}>
          {/* Hero Section */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)} 0%, ${alpha(statusInfo.color, 0.05)} 100%)`,
              borderLeft: `4px solid ${statusInfo.color}`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: statusInfo.color,
                  width: 56,
                  height: 56,
                }}
              >
                <Email />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.25, lineHeight: 1.3 }}>
                  {row.Subject || "No Subject"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  From: {row.SenderAddress}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Status */}
          <Box>
            <Typography 
              variant="overline" 
              color="text.secondary" 
              sx={{ fontWeight: 600, letterSpacing: 1, mb: 1.5, display: "block" }}
            >
              Quarantine Status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                sx={{ 
                  fontWeight: 600, 
                  bgcolor: alpha(statusInfo.color, 0.1),
                  color: statusInfo.color,
                  borderColor: statusInfo.color,
                }}
                variant="outlined"
              />
              {row.Type && (
                <Chip
                  icon={<Security fontSize="small" />}
                  label={row.Type}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Message Details */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Email fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Message Details
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Sender</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {row.SenderAddress}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Recipient</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {row.RecipientAddress}
                </Typography>
              </Stack>
              {row.ReceivedTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Received</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getCippFormatting(row.ReceivedTime, "ReceivedTime")}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Policy Info */}
          {row.PolicyName && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Security fontSize="small" color="action" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Policy Information
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Policy Name</Typography>
                    <Chip label={row.PolicyName} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              </Box>
            </>
          )}

          {/* Message ID */}
          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Message ID
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                {row.MessageId}
              </Typography>
            </Paper>
          </Box>
        </Stack>
      );
    },
  };

  const filterList = [
    {
      filterName: "Not Released",
      value: [{ id: "ReleaseStatus", value: "NOTRELEASED" }],
      type: "column",
    },
    {
      filterName: "Released",
      value: [{ id: "ReleaseStatus", value: "RELEASED" }],
      type: "column",
    },
    {
      filterName: "Requested",
      value: [{ id: "ReleaseStatus", value: "REQUESTED" }],
      type: "column",
    },
  ];

  return (
    <>
      <CippTablePage
        title={pageTitle}
        apiUrl="/api/ListMailQuarantine"
        apiDataKey="Results"
        actions={actions}
        offCanvas={offCanvas}
        simpleColumns={simpleColumns}
        filters={filterList}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ py: 2 }}>
          Quarantine Message
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{dialogContent}</DialogContent>
      </Dialog>
      <Dialog
        open={traceDialogOpen}
        onClose={() => setTraceDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ py: 2 }}>
          Message Trace - {messageSubject}
          <IconButton
            aria-label="close"
            onClick={() => setTraceDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {getMessageTraceDetails.isPending && (
            <Typography variant="body1" sx={{ py: 4 }}>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> Loading message trace
              details...
            </Typography>
          )}
          {getMessageTraceDetails.isSuccess && (
            <CippDataTable
              noCard={true}
              title="Message Trace Details"
              simpleColumns={detailColumns}
              data={traceDetails ?? []}
              refreshFunction={() =>
                getMessageTraceDetails.mutate({
                  url: "/api/ListMessageTrace",
                  data: {
                    tenantFilter: tenantFilter,
                    messageId: traceMessageId,
                  },
                })
              }
              isFetching={getMessageTraceDetails.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
