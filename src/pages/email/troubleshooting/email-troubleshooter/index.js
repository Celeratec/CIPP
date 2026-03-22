import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Badge,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  Block,
  CheckCircle,
  ClearAll,
  Close,
  ContentCopy,
  Done,
  DoneAll,
  ExpandLess,
  ExpandMore,
  Pending,
  Cancel,
  Search,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from "@mui/lab";
import { Grid } from "@mui/system";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import CippFormComponent from "../../../../components/CippComponents/CippFormComponent";
import CippButtonCard from "../../../../components/CippCards/CippButtonCard";
import { CippDataTable } from "../../../../components/CippTable/CippDataTable";
import { CippMessageViewer } from "../../../../components/CippComponents/CippMessageViewer.jsx";
import { ApiPostCall, ApiGetCall } from "../../../../api/ApiCall";
import { useSettings } from "../../../../hooks/use-settings";

const quickPresets = [
  { key: "quarantined24h", label: "Quarantined (24h)", days: 1, status: "Quarantined" },
  { key: "failed48h", label: "Failed Delivery (48h)", days: 2, status: "Failed" },
  { key: "recent7d", label: "All Recent (7d)", days: 7, status: null },
];

const getEventColor = (event) => {
  const e = (event || "").toUpperCase();
  if (e.includes("DELIVER") || e.includes("RESOLVE")) return "success";
  if (e.includes("FAIL") || e.includes("DROP")) return "error";
  if (e.includes("QUARANTINE")) return "warning";
  return "grey";
};

const DeliveryTimeline = ({ events }) => {
  if (!events?.length) return <Typography>No delivery events found.</Typography>;

  return (
    <Timeline position="right">
      {events.map((evt, idx) => (
        <TimelineItem key={idx}>
          <TimelineOppositeContent sx={{ maxWidth: 140, flex: "none" }}>
            <Typography variant="caption" color="text.secondary">
              {evt.Date}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={getEventColor(evt.Event)} />
            {idx < events.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Paper
              elevation={0}
              sx={{ p: 1.5, mb: 1, bgcolor: "background.default", borderRadius: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {evt.Event}
              </Typography>
              {evt.Action && (
                <Typography variant="body2" color="text.secondary">
                  Action: {evt.Action}
                </Typography>
              )}
              {evt.Detail && (
                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                  {evt.Detail}
                </Typography>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

const authResultColor = (result) => {
  const r = (result || "").toLowerCase();
  if (r === "pass" || r === "bestguesspass") return "success";
  if (r === "fail" || r === "permerror") return "error";
  if (r === "softfail" || r === "temperror") return "warning";
  return "default";
};

const AuthSummaryCard = ({ summary }) => {
  if (!summary) return null;
  const items = [
    { label: "SPF", result: summary.SPF?.result, detail: summary.SPF?.detail },
    { label: "DKIM", result: summary.DKIM?.result, detail: summary.DKIM?.detail },
    { label: "DMARC", result: summary.DMARC?.result, detail: summary.DMARC?.detail },
    { label: "CompAuth", result: summary.CompAuth?.result },
  ];
  const allUnknown = items.every((i) => !i.result || i.result === "Unknown");
  if (allUnknown) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Authentication Results
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {items.map((item) => (
          <Chip
            key={item.label}
            label={`${item.label}: ${item.result || "Unknown"}${item.detail ? ` (${item.detail})` : ""}`}
            color={authResultColor(item.result)}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>
    </Paper>
  );
};

const statusColorMap = {
  Delivered: "success",
  Quarantined: "warning",
  Failed: "error",
  FilteredAsSpam: "warning",
  Pending: "default",
  Expanded: "info",
};

const releaseStatusColorMap = {
  RELEASED: "success",
  DENIED: "error",
  NOTRELEASED: "warning",
  REQUESTED: "info",
};

const Page = () => {
  const tenantFilter = useSettings().currentTenant;
  const [activePreset, setActivePreset] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [traceResults, setTraceResults] = useState([]);
  const [quarantineResults, setQuarantineResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [traceError, setTraceError] = useState(null);
  const [quarantineError, setQuarantineError] = useState(null);
  const [highlightMessageId, setHighlightMessageId] = useState(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [traceDetailData, setTraceDetailData] = useState([]);
  const [authSummary, setAuthSummary] = useState(null);
  const [detailMessageId, setDetailMessageId] = useState(null);

  const [selectedQuarantineRows, setSelectedQuarantineRows] = useState([]);
  const [messageViewerOpen, setMessageViewerOpen] = useState(false);
  const [viewMessageId, setViewMessageId] = useState(null);
  const [messageContentsWaiting, setMessageContentsWaiting] = useState(false);

  const formControl = useForm({
    defaultValues: {
      dateFilter: "relative",
      days: 2,
      startDate: null,
      endDate: null,
      sender: [],
      recipient: [],
      messageId: "",
      subject: "",
      status: [],
      fromIP: "",
      toIP: "",
      quarantineType: [],
    },
    mode: "onChange",
  });

  const searchApi = ApiPostCall({
    urlFromData: true,
    queryKey: "EmailTroubleshoot",
    onResult: (result) => {
      const data = result?.Results ?? result;
      setTraceResults(data?.MessageTrace ?? []);
      setQuarantineResults(data?.Quarantine ?? []);
      setSummary(data?.Summary ?? null);
      setTraceError(data?.TraceError ?? null);
      setQuarantineError(data?.QuarantineError ?? null);
      setHighlightMessageId(null);
    },
  });

  const traceDetailApi = ApiPostCall({
    urlFromData: true,
    queryKey: `TraceDetail-${detailMessageId}`,
    onResult: (result) => {
      const data = Array.isArray(result) ? result[0] : result;
      if (data?.Events) {
        setTraceDetailData(data.Events);
        setAuthSummary(data.AuthSummary ?? null);
      } else {
        setTraceDetailData(Array.isArray(result) ? result : []);
        setAuthSummary(null);
      }
    },
  });

  const getMessageContents = ApiGetCall({
    url: "/api/ListMailQuarantineMessage",
    data: { tenantFilter, Identity: viewMessageId },
    waiting: messageContentsWaiting,
    queryKey: `QuarantineMessage-${viewMessageId}`,
  });

  const bulkReleaseApi = ApiPostCall({
    urlFromData: true,
    queryKey: "BulkQuarantineRelease",
  });

  const buildSearchData = (overrides = {}) => {
    const values = { ...formControl.getValues(), ...overrides };
    const data = { tenantFilter };

    if (values.messageId) {
      data.messageId = values.messageId;
      return data;
    }

    if (values.sender?.length) data.sender = values.sender;
    if (values.recipient?.length) data.recipient = values.recipient;
    if (values.status?.length) data.status = values.status[0];
    if (values.fromIP) data.fromIP = values.fromIP;
    if (values.toIP) data.toIP = values.toIP;
    if (values.subject) data.subject = values.subject;
    if (values.quarantineType?.length)
      data.quarantineType = values.quarantineType[0]?.value ?? values.quarantineType[0];

    if (values.dateFilter === "relative") {
      data.days = values.days?.value ?? values.days;
    } else {
      data.startDate = values.startDate;
      data.endDate = values.endDate;
    }

    return data;
  };

  const onSubmit = (overrides) => {
    searchApi.mutate({
      url: "/api/ExecEmailTroubleshoot",
      data: buildSearchData(overrides),
    });
  };

  const onClear = () => {
    formControl.reset();
    setActivePreset(null);
    setTraceResults([]);
    setQuarantineResults([]);
    setSummary(null);
    setTraceError(null);
    setQuarantineError(null);
    setHighlightMessageId(null);
  };

  const applyPreset = (preset) => {
    formControl.setValue("dateFilter", "relative");
    formControl.setValue("days", preset.days);
    if (preset.status) {
      formControl.setValue("status", [{ label: preset.status, value: preset.status }]);
    } else {
      formControl.setValue("status", []);
    }
    setActivePreset(preset.key);
    onSubmit({
      dateFilter: "relative",
      days: preset.days,
      status: preset.status ? [{ value: preset.status }] : [],
    });
  };

  const viewTraceDetail = (row) => {
    setDetailMessageId(row.MessageTraceId);
    traceDetailApi.mutate({
      url: "/api/ListMessageTrace",
      data: {
        tenantFilter,
        id: row.MessageTraceId,
        recipient: row.RecipientAddress,
        traceDetail: true,
      },
    });
    setDetailDialogOpen(true);
  };

  const viewQuarantineMessage = (row) => {
    setViewMessageId(row.Identity);
    if (!messageContentsWaiting) setMessageContentsWaiting(true);
    getMessageContents.refetch();
    setMessageViewerOpen(true);
  };

  const handleBulkRelease = (type, addAllowEntry = false) => {
    const identities = selectedQuarantineRows.map((r) => r.Identity);
    if (identities.length > 50) {
      if (
        !window.confirm(
          `WARNING: You are about to process ${identities.length} messages. This may take a while and could have significant impact. Continue?`
        )
      )
        return;
    } else if (identities.length > 10) {
      if (
        !window.confirm(
          `You are about to ${type.toLowerCase()} ${identities.length} messages. Are you sure?`
        )
      )
        return;
    }
    bulkReleaseApi.mutate({
      url: "/api/ExecQuarantineManagement",
      data: { tenantFilter, Identity: identities, Type: type, AddAllowEntry: addAllowEntry },
    });
  };

  const isMessageIdSet = !!formControl.watch("messageId");

  const isIPAddress = {
    validate: (value) =>
      !value ||
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(
        value
      ) ||
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value) ||
      "Invalid IP address",
  };

  const traceActions = [
    {
      label: "View Delivery Details",
      noConfirm: true,
      customFunction: viewTraceDetail,
      icon: <DocumentTextIcon />,
    },
    {
      label: "View in Explorer",
      noConfirm: true,
      link: `https://security.microsoft.com/realtimereportsv3?tid=${tenantFilter}&dltarget=Explorer&dlstorage=Url&viewid=allemail&query-NetworkMessageId=[MessageTraceId]`,
      icon: <DocumentTextIcon />,
    },
    {
      label: "Allow Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Allow",
        notes: "!Allowed via Email Troubleshooter",
        RemoveAfter: true,
      },
      confirmText: "Allow this sender for all users in the tenant?",
      icon: <CheckCircle />,
    },
    {
      label: "Block Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Block",
        notes: "!Blocked via Email Troubleshooter",
        NoExpiration: true,
      },
      confirmText: "Block this sender for all users in the tenant?",
      icon: <Block />,
    },
    {
      label: "Release from Quarantine",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "MessageId", Type: "!Release" },
      confirmText: "Release this message from quarantine?",
      icon: <Done />,
      condition: (row) => row.Status === "Quarantined",
    },
    {
      label: "Copy Message ID",
      noConfirm: true,
      customFunction: (row) => navigator.clipboard.writeText(row.MessageId || row.MessageTraceId),
      icon: <ContentCopy />,
    },
  ];

  const quarantineActions = [
    {
      label: "View Message",
      noConfirm: true,
      customFunction: viewQuarantineMessage,
      icon: <EyeIcon />,
    },
    {
      label: "View Delivery Timeline",
      noConfirm: true,
      customFunction: (row) => {
        setDetailMessageId(row.MessageId);
        traceDetailApi.mutate({
          url: "/api/ListMessageTrace",
          data: { tenantFilter, messageId: row.MessageId },
        });
        setDetailDialogOpen(true);
      },
      icon: <DocumentTextIcon />,
    },
    {
      label: "Release",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release" },
      confirmText: "Release this message?",
      icon: <Done />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Deny",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Deny" },
      confirmText: "Deny this message?",
      icon: <Block />,
      condition: (row) => row.ReleaseStatus !== "DENIED",
    },
    {
      label: "Release & Allow Sender",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release", AllowSender: true },
      confirmText: "Release and allow this sender?",
      icon: <DoneAll />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Release & Add Allow Entry",
      type: "POST",
      url: "/api/ExecQuarantineManagement",
      multiPost: true,
      data: { Identity: "Identity", Type: "!Release", AddAllowEntry: true },
      confirmText: "Release and add sender to Tenant Allow List?",
      icon: <DoneAll />,
      condition: (row) => row.ReleaseStatus !== "RELEASED",
    },
    {
      label: "Block Sender",
      type: "POST",
      url: "/api/AddTenantAllowBlockList",
      data: {
        tenantID: tenantFilter,
        entries: "SenderAddress",
        listType: "!Sender",
        listMethod: "!Block",
        notes: "!Blocked via Email Troubleshooter",
        NoExpiration: true,
      },
      confirmText: "Block this sender?",
      icon: <Block />,
    },
  ];

  const traceColumns = [
    { header: "Received", accessorKey: "Received" },
    {
      header: "Status",
      accessorKey: "Status",
      Cell: ({ row }) => {
        const status = row.original.Status;
        const isQuarantined = status === "Quarantined";
        return (
          <Chip
            label={status}
            color={statusColorMap[status] || "default"}
            size="small"
            variant="outlined"
            onClick={
              isQuarantined
                ? () => {
                    setActiveTab(1);
                    setHighlightMessageId(row.original.MessageId);
                  }
                : undefined
            }
            sx={isQuarantined ? { cursor: "pointer" } : {}}
          />
        );
      },
    },
    { header: "Sender", accessorKey: "SenderAddress" },
    { header: "Recipient", accessorKey: "RecipientAddress" },
    { header: "Subject", accessorKey: "Subject" },
  ];

  const quarantineColumns = [
    { header: "Received", accessorKey: "ReceivedTime" },
    {
      header: "Release Status",
      accessorKey: "ReleaseStatus",
      Cell: ({ row }) => {
        const status = row.original.ReleaseStatus;
        const label = status === "NOTRELEASED" ? "Not Released" : status;
        return (
          <Chip
            label={label}
            color={releaseStatusColorMap[status] || "default"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    { header: "Subject", accessorKey: "Subject" },
    { header: "Sender", accessorKey: "SenderAddress" },
    { header: "Recipient", accessorKey: "RecipientAddress" },
    { header: "Type", accessorKey: "Type" },
    { header: "Policy", accessorKey: "PolicyName" },
  ];

  const displayedQuarantineResults =
    highlightMessageId && activeTab === 1
      ? quarantineResults.filter((r) => r.MessageId === highlightMessageId)
      : quarantineResults;

  const noHighlightMatch =
    highlightMessageId &&
    activeTab === 1 &&
    displayedQuarantineResults.length === 0;

  return (
    <Stack spacing={2} sx={{ px: 3 }}>
      {/* Quick Filter Presets */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Quick Search:
        </Typography>
        {quickPresets.map((preset) => (
          <Chip
            key={preset.key}
            label={preset.label}
            size="small"
            onClick={() => applyPreset(preset)}
            color={activePreset === preset.key ? "primary" : "default"}
            variant={activePreset === preset.key ? "filled" : "outlined"}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Stack>

      {/* Search Panel */}
      <CippButtonCard component="accordion" title="Search" accordionExpanded={true}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <CippFormComponent
              type="radio"
              row
              name="dateFilter"
              label="Date Range"
              options={[
                { label: "Relative", value: "relative" },
                { label: "Custom", value: "startEnd" },
              ]}
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>
          {formControl.watch("dateFilter") === "relative" && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CippFormComponent
                type="autoComplete"
                name="days"
                label="Time Range"
                options={[
                  { label: "Last 24 hours", value: 1 },
                  { label: "Last 2 days", value: 2 },
                  { label: "Last 7 days", value: 7 },
                  { label: "Last 10 days", value: 10 },
                ]}
                formControl={formControl}
                disabled={isMessageIdSet}
              />
            </Grid>
          )}
          {formControl.watch("dateFilter") === "startEnd" && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <CippFormComponent
                  type="datePicker"
                  name="startDate"
                  label="Start Date"
                  dateTimeType="datetime"
                  formControl={formControl}
                  disabled={isMessageIdSet}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CippFormComponent
                  type="datePicker"
                  name="endDate"
                  label="End Date"
                  dateTimeType="datetime"
                  formControl={formControl}
                  disabled={isMessageIdSet}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <CippFormComponent
              type="autoComplete"
              freeSolo
              multiple
              creatable
              name="sender"
              label="Sender"
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CippFormComponent
              type="autoComplete"
              freeSolo
              multiple
              creatable
              name="recipient"
              label="Recipient"
              formControl={formControl}
              disabled={isMessageIdSet}
            />
          </Grid>

          {/* Advanced Section */}
          <Grid size={12}>
            <Button
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            >
              Advanced Options
            </Button>
          </Grid>
          <Grid size={12}>
            <Collapse in={showAdvanced}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="messageId"
                    label="Message ID"
                    formControl={formControl}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="subject"
                    label="Subject"
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="status"
                    label="Status"
                    options={[
                      { label: "None", value: "None" },
                      { label: "Delivered", value: "Delivered" },
                      { label: "Failed", value: "Failed" },
                      { label: "Quarantined", value: "Quarantined" },
                      { label: "Filtered As Spam", value: "FilteredAsSpam" },
                      { label: "Expanded", value: "Expanded" },
                      { label: "Pending", value: "Pending" },
                    ]}
                    multiple
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="autoComplete"
                    name="quarantineType"
                    label="Quarantine Type"
                    options={[
                      { label: "Spam", value: "Spam" },
                      { label: "Phish", value: "Phish" },
                      { label: "Malware", value: "Malware" },
                      { label: "High Confidence Phish", value: "HighConfPhish" },
                    ]}
                    multiple
                    formControl={formControl}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="fromIP"
                    label="From IP"
                    formControl={formControl}
                    validators={isIPAddress}
                    disabled={isMessageIdSet}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CippFormComponent
                    type="textField"
                    name="toIP"
                    label="To IP"
                    formControl={formControl}
                    validators={isIPAddress}
                    disabled={isMessageIdSet}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          <Grid size={12} sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => onSubmit()}
              variant="contained"
              color="primary"
              startIcon={<Search />}
            >
              Search
            </Button>
            <Button onClick={onClear} variant="outlined" startIcon={<ClearAll />}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </CippButtonCard>

      {/* Error Alerts */}
      {traceError && (
        <Alert severity="warning" onClose={() => setTraceError(null)}>
          {traceError}
        </Alert>
      )}
      {quarantineError && (
        <Alert severity="warning" onClose={() => setQuarantineError(null)}>
          {quarantineError}
        </Alert>
      )}

      {/* Results Tabs */}
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab
          label={
            <Badge badgeContent={summary?.traceCount ?? 0} color="primary" max={999}>
              <span style={{ paddingRight: 12 }}>Message Trace</span>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={summary?.quarantineUnreleased ?? 0} color="warning" max={999}>
              <span style={{ paddingRight: 12 }}>Quarantine</span>
            </Badge>
          }
        />
      </Tabs>

      {/* Message Trace Tab */}
      {activeTab === 0 && (
        <CippDataTable
          title="Message Trace Results"
          columns={traceColumns}
          data={traceResults}
          isFetching={searchApi.isPending}
          refreshFunction={() => onSubmit()}
          actions={traceActions}
        />
      )}

      {/* Quarantine Tab */}
      {activeTab === 1 && (
        <>
          {highlightMessageId && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`Filtered by Message ID`}
                onDelete={() => setHighlightMessageId(null)}
                color="primary"
                size="small"
              />
            </Stack>
          )}
          {noHighlightMatch && (
            <Alert
              severity="info"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setHighlightMessageId(null)}
                >
                  Show All
                </Button>
              }
            >
              This message was not found in the current quarantine results. It may have already
              been released or expired.
            </Alert>
          )}
          {/* Bulk Action Toolbar */}
          {selectedQuarantineRows.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedQuarantineRows.length} selected:
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Done />}
                onClick={() => handleBulkRelease("Release")}
              >
                Release Selected
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Block />}
                onClick={() => handleBulkRelease("Deny")}
              >
                Deny Selected
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DoneAll />}
                onClick={() => handleBulkRelease("Release", true)}
              >
                Release & Allow All
              </Button>
            </Stack>
          )}
          <CippDataTable
            title="Quarantine Results"
            columns={quarantineColumns}
            data={displayedQuarantineResults}
            isFetching={searchApi.isPending}
            refreshFunction={() => onSubmit()}
            actions={quarantineActions}
            onChange={(rows) => setSelectedQuarantineRows(rows)}
          />
        </>
      )}

      {/* Delivery Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ py: 2 }}>
          Delivery Details
          <IconButton
            onClick={() => setDetailDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {traceDetailApi.isPending && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 4 }}>
              <CircularProgress size={20} />
              <Typography variant="body1">Loading delivery details...</Typography>
            </Stack>
          )}
          {traceDetailApi.isSuccess && (
            <>
              <AuthSummaryCard summary={authSummary} />
              <DeliveryTimeline events={traceDetailData ?? []} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Viewer Dialog */}
      <Dialog
        open={messageViewerOpen}
        onClose={() => setMessageViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ py: 2 }}>
          Quarantine Message
          <IconButton
            onClick={() => setMessageViewerOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {getMessageContents.isSuccess ? (
            <CippMessageViewer emailSource={getMessageContents?.data?.Message} />
          ) : (
            <Skeleton variant="rectangular" height={400} />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
