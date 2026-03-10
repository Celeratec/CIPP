import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { useRouter } from "next/router";
import {
  Alert,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  Folder,
  ArrowBack,
  Home,
  OpenInNew,
  CloudQueue,
  Search,
  Edit,
  DriveFileMove,
  ContentCopy,
  Delete,
  Download,
  CreateNewFolder,
  Language,
  PersonOutline,
  SwapHoriz,
} from "@mui/icons-material";
import { CippTablePage } from "../../../components/CippComponents/CippTablePage.jsx";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { CippApiResults } from "../../../components/CippComponents/CippApiResults";
import { ApiGetCall, ApiPostCall } from "../../../api/ApiCall";
import { useSettings } from "../../../hooks/use-settings";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { getFileIcon } from "../../../utils/get-file-icon";

// ─── Cross-Drive Transfer Dialog ─────────────────────────────────────────────
// Rendered via customComponent action pattern from CippDataTable (single item)
const CrossDriveTransferDrawer = (row, { drawerVisible, setDrawerVisible }, actionType, sourceIdentity) => {
  return (
    <CrossDriveTransferDialog
      open={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      items={[row]}
      actionType={actionType}
      sourceIdentity={sourceIdentity}
    />
  );
};

const CrossDriveTransferDialog = ({ open, onClose, items = [], actionType, sourceIdentity = {} }) => {
  const tenantFilter = useSettings().currentTenant;
  const formControl = useForm({ mode: "onChange" });
  const theme = useTheme();

  const [locationType, setLocationType] = useState("onedrive");
  const [destLocation, setDestLocation] = useState(null);
  const [destFolderId, setDestFolderId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Root", id: null }]);
  const prevValueRef = useRef(null);

  // Bulk transfer progress state
  const [isTransferring, setIsTransferring] = useState(false);
  const [itemStatuses, setItemStatuses] = useState({});
  const [transferComplete, setTransferComplete] = useState(false);
  const [conflictBehavior, setConflictBehavior] = useState("rename");

  const userValue = formControl.watch("destUser");
  const siteValue = formControl.watch("destSite");

  useEffect(() => {
    if (locationType === "onedrive") {
      const key = userValue?.value || null;
      if (key !== prevValueRef.current) {
        prevValueRef.current = key;
        if (userValue?.value) {
          setDestLocation({ type: "onedrive", userId: userValue.value, label: userValue.label });
        } else {
          setDestLocation(null);
        }
        setDestFolderId(null);
        setCurrentFolderId(null);
        setBreadcrumbs([{ label: userValue?.label || "Root", id: null }]);
      }
    }
  }, [userValue, locationType]);

  useEffect(() => {
    if (locationType === "sharepoint") {
      const key = siteValue?.value || null;
      if (key !== prevValueRef.current) {
        prevValueRef.current = key;
        if (siteValue?.value) {
          setDestLocation({ type: "sharepoint", siteId: siteValue.value, label: siteValue.label });
        } else {
          setDestLocation(null);
        }
        setDestFolderId(null);
        setCurrentFolderId(null);
        setBreadcrumbs([{ label: siteValue?.label || "Root", id: null }]);
      }
    }
  }, [siteValue, locationType]);

  const handleTypeChange = (_e, val) => {
    if (!val) return;
    setLocationType(val);
    formControl.setValue("destUser", null);
    formControl.setValue("destSite", null);
    prevValueRef.current = null;
    setDestLocation(null);
    setDestFolderId(null);
    setCurrentFolderId(null);
    setBreadcrumbs([{ label: "Root", id: null }]);
  };

  const folderApiParams = useMemo(() => {
    if (!destLocation) return null;
    const params = { TenantFilter: tenantFilter };
    if (destLocation.type === "onedrive") params.UserId = destLocation.userId;
    if (destLocation.type === "sharepoint") params.SiteId = destLocation.siteId;
    if (currentFolderId) params.FolderId = currentFolderId;
    return params;
  }, [tenantFilter, destLocation, currentFolderId]);

  const folderQueryKey = `xdrive-folders-${destLocation?.userId || destLocation?.siteId}-${currentFolderId || "root"}`;

  const foldersQuery = ApiGetCall({
    url: "/api/ListOneDriveFiles",
    data: folderApiParams || {},
    queryKey: folderQueryKey,
    waiting: !!destLocation,
  });

  const folders = useMemo(() => {
    const raw = Array.isArray(foldersQuery.data) ? foldersQuery.data : [];
    return raw.filter((f) => f.isFolder);
  }, [foldersQuery.data]);

  const navigateToFolder = (fId, fName) => {
    setCurrentFolderId(fId);
    setDestFolderId(fId);
    setBreadcrumbs((prev) => [...prev, { label: fName, id: fId }]);
  };

  const navigateToBreadcrumb = (index) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setDestFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleExecute = async () => {
    const action = actionType === "move" ? "CrossMove" : "CrossCopy";
    const destIdentity = {};
    if (destLocation.type === "onedrive") {
      destIdentity.DestinationUserId = destLocation.userId;
    } else {
      destIdentity.DestinationSiteId = destLocation.siteId;
    }

    setIsTransferring(true);
    setTransferComplete(false);
    const statuses = {};
    items.forEach((it) => { statuses[it.id || it.Id || it.ItemId || it.name] = { status: "pending" }; });
    setItemStatuses({ ...statuses });

    if (conflictBehavior === "skip") {
      try {
        const destParams = new URLSearchParams({ TenantFilter: tenantFilter });
        if (destLocation.type === "onedrive") destParams.set("UserId", destLocation.userId);
        if (destLocation.type === "sharepoint") destParams.set("SiteId", destLocation.siteId);
        if (destFolderId) destParams.set("FolderId", destFolderId);

        const checkResp = await fetch(`/api/ListOneDriveFiles?${destParams.toString()}`);
        if (checkResp.ok) {
          const destItems = await checkResp.json();
          if (Array.isArray(destItems)) {
            const destNames = new Set(destItems.map((d) => d.name?.toLowerCase()));
            for (const it of items) {
              const key = it.id || it.Id || it.ItemId || it.name;
              if (destNames.has(it.name?.toLowerCase())) {
                statuses[key] = {
                  status: "skipped",
                  message: `Skipped '${it.name}' — already exists at the destination.`,
                };
              }
            }
            setItemStatuses({ ...statuses });
          }
        }
      } catch {
        // Pre-check failed; per-item backend check will still handle skip
      }
    }

    for (const it of items) {
      const itemId = it.id || it.Id || it.ItemId;
      const key = itemId ?? it.name;

      if (statuses[key]?.status === "skipped") continue;

      statuses[key] = { status: "in_progress" };
      setItemStatuses({ ...statuses });

      if (!itemId) {
        statuses[it.name] = { status: "error", message: `No item ID found. Keys: ${Object.keys(it).join(", ")}` };
        setItemStatuses({ ...statuses });
        continue;
      }

      try {
        const payload = {
          TenantFilter: tenantFilter,
          ...sourceIdentity,
          ItemId: itemId,
          ItemName: it.name,
          Action: action,
          ConflictBehavior: conflictBehavior,
          ...destIdentity,
          ...(destFolderId ? { DestinationFolderId: destFolderId } : {}),
        };
        const resp = await fetch("/api/ExecOneDriveFileAction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (resp.ok) {
          const msg = data?.Results || "Done";
          const isSkipped = msg.toLowerCase().startsWith("skipped");
          statuses[itemId] = { status: isSkipped ? "skipped" : "success", message: msg };
        } else {
          statuses[itemId] = { status: "error", message: data?.Results || `HTTP ${resp.status}` };
        }
      } catch (err) {
        statuses[itemId] = { status: "error", message: err.message || "Network error" };
      }
      setItemStatuses({ ...statuses });
    }

    setIsTransferring(false);
    setTransferComplete(true);
  };

  const handleClose = () => {
    onClose();
    setDestLocation(null);
    setDestFolderId(null);
    setCurrentFolderId(null);
    setBreadcrumbs([{ label: "Root", id: null }]);
    formControl.reset();
    prevValueRef.current = null;
    setIsTransferring(false);
    setItemStatuses({});
    setConflictBehavior("rename");
    setTransferComplete(false);
  };

  const successCount = Object.values(itemStatuses).filter((s) => s.status === "success").length;
  const skippedCount = Object.values(itemStatuses).filter((s) => s.status === "skipped").length;
  const errorCount = Object.values(itemStatuses).filter((s) => s.status === "error").length;
  const completedCount = successCount + skippedCount + errorCount;
  const isBulk = items.length > 1;

  return (
    <Dialog open={open} onClose={isTransferring ? undefined : handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          {actionType === "move" ? <DriveFileMove color="primary" /> : <ContentCopy color="primary" />}
          <span>{actionType === "move" ? "Move" : "Copy"} to Another Drive</span>
          {isBulk && (
            <Chip label={`${items.length} items`} size="small" color="primary" variant="outlined" />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info" variant="outlined">
            {actionType === "move" ? "Move" : "Copy"}{" "}
            {isBulk ? (
              <><strong>{items.length} items</strong> to a different user&apos;s OneDrive or a SharePoint site.</>
            ) : (
              <><strong>{items[0]?.name}</strong> to a different user&apos;s OneDrive or a SharePoint site.</>
            )}
          </Alert>

          {/* Item list for bulk transfers */}
          {isBulk && !transferComplete && !isTransferring && (
            <Paper variant="outlined" sx={{ maxHeight: 120, overflow: "auto", p: 1 }}>
              {items.map((it) => (
                <Typography key={it.id} variant="body2" color="text.secondary" noWrap sx={{ py: 0.25 }}>
                  {it.isFolder ? "📁" : "📄"} {it.name}
                </Typography>
              ))}
            </Paper>
          )}

          {/* Transfer progress */}
          {(isTransferring || transferComplete) && (
            <Stack spacing={1}>
              {transferComplete && (
                <Alert severity={errorCount === 0 ? "success" : errorCount === items.length ? "error" : "warning"}>
                  {errorCount === 0 && skippedCount === 0
                    ? `All ${successCount} item${successCount !== 1 ? "s" : ""} transferred successfully.`
                    : [
                        successCount > 0 && `${successCount} succeeded`,
                        skippedCount > 0 && `${skippedCount} skipped`,
                        errorCount > 0 && `${errorCount} failed`,
                      ].filter(Boolean).join(", ") + "."}
                </Alert>
              )}
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: "auto" }}>
                <Table size="small">
                  <TableBody>
                    {items.map((it) => {
                      const key = it.id || it.Id || it.ItemId || it.name;
                      const st = itemStatuses[key] || { status: "pending" };
                      return (
                        <TableRow key={key}>
                          <TableCell sx={{ py: 0.5, width: "50%" }}>
                            <Typography variant="body2" noWrap>{it.name}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            {st.status === "pending" && (
                              <Chip label="Waiting" size="small" variant="outlined" sx={{ height: 22 }} />
                            )}
                            {st.status === "in_progress" && (
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CircularProgress size={14} />
                                <Typography variant="caption" color="text.secondary">Transferring...</Typography>
                              </Stack>
                            )}
                            {st.status === "success" && (
                              <Chip label="Done" size="small" color="success" sx={{ height: 22 }} />
                            )}
                            {st.status === "skipped" && (
                              <Tooltip title={st.message}>
                                <Chip label="Skipped" size="small" color="info" sx={{ height: 22 }} />
                              </Tooltip>
                            )}
                            {st.status === "error" && (
                              <Tooltip title={st.message}>
                                <Chip label="Failed" size="small" color="error" sx={{ height: 22 }} />
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
              {isTransferring && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {completedCount} of {items.length} complete...
                </Typography>
              )}
            </Stack>
          )}

          {/* Destination picker (hidden during/after transfer) */}
          {!isTransferring && !transferComplete && (
            <>
              <ToggleButtonGroup
                value={locationType}
                exclusive
                onChange={handleTypeChange}
                size="small"
                fullWidth
              >
                <ToggleButton value="onedrive">
                  <PersonOutline sx={{ mr: 1 }} /> OneDrive User
                </ToggleButton>
                <ToggleButton value="sharepoint">
                  <Language sx={{ mr: 1 }} /> SharePoint Site
                </ToggleButton>
              </ToggleButtonGroup>

              <FormControl size="small" fullWidth>
                <InputLabel>If a file or folder already exists</InputLabel>
                <Select
                  value={conflictBehavior}
                  label="If a file or folder already exists"
                  onChange={(e) => setConflictBehavior(e.target.value)}
                >
                  <MenuItem value="rename">Rename (keep both)</MenuItem>
                  <MenuItem value="replace">Replace existing</MenuItem>
                  <MenuItem value="skip">Skip duplicates</MenuItem>
                </Select>
              </FormControl>

              {locationType === "onedrive" && (
                <CippFormComponent
                  type="autoComplete"
                  name="destUser"
                  label="Destination User"
                  formControl={formControl}
                  multiple={false}
                  api={{
                    tenantFilter,
                    url: "/api/ListGraphRequest",
                    data: {
                      Endpoint: "users",
                      $filter: "accountEnabled eq true",
                      $top: 999,
                      $count: true,
                      $orderby: "displayName",
                      $select: "id,displayName,userPrincipalName",
                    },
                    dataKey: "Results",
                    labelField: (u) => `${u.displayName} (${u.userPrincipalName})`,
                    valueField: "id",
                    queryKey: `xdrive-users-${tenantFilter}`,
                  }}
                />
              )}
              {locationType === "sharepoint" && (
                <CippFormComponent
                  type="autoComplete"
                  name="destSite"
                  label="Destination SharePoint Site"
                  formControl={formControl}
                  multiple={false}
                  api={{
                    tenantFilter,
                    url: "/api/ListSites",
                    data: { Type: "SharePointSiteUsage" },
                    queryKey: `xdrive-sites-${tenantFilter}`,
                    labelField: (s) => s.displayName || s.webUrl || s.siteId,
                    valueField: "siteId",
                  }}
                />
              )}

              {destLocation && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">
                    Navigate to select a destination folder, or leave at root.
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: alpha(theme.palette.info.main, 0.04),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {breadcrumbs.length > 1 && (
                        <Tooltip title="Go up one level">
                          <IconButton size="small" onClick={() => navigateToBreadcrumb(breadcrumbs.length - 2)}>
                            <ArrowBack fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Breadcrumbs separator="/" sx={{ flex: 1 }}>
                        {breadcrumbs.map((crumb, i) => {
                          const isLast = i === breadcrumbs.length - 1;
                          return isLast ? (
                            <Chip
                              key={i}
                              icon={i === 0 ? <Home fontSize="small" /> : <Folder fontSize="small" />}
                              label={crumb.label}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            <MuiLink
                              key={i}
                              component="button"
                              underline="hover"
                              color="text.secondary"
                              variant="body2"
                              onClick={() => navigateToBreadcrumb(i)}
                              sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
                            >
                              {i === 0 && <Home fontSize="small" />}
                              {crumb.label}
                            </MuiLink>
                          );
                        })}
                      </Breadcrumbs>
                    </Stack>
                  </Paper>

                  {foldersQuery.isLoading ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : folders.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                      No sub-folders. Files will be placed here.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                      <Table size="small" stickyHeader>
                        <TableBody>
                          {folders.map((folder) => (
                            <TableRow
                              key={folder.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => navigateToFolder(folder.id, folder.name)}
                            >
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Folder fontSize="small" color="info" />
                                  <Typography variant="body2" fontWeight={600}>
                                    {folder.name}
                                  </Typography>
                                  {folder.childCount != null && (
                                    <Chip label={`${folder.childCount}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={isTransferring}>
          {transferComplete ? "Done" : "Cancel"}
        </Button>
        {!transferComplete && (
          <Button
            variant="contained"
            onClick={handleExecute}
            disabled={!destLocation || isTransferring}
            startIcon={
              isTransferring ? (
                <CircularProgress size={18} color="inherit" />
              ) : actionType === "move" ? (
                <DriveFileMove />
              ) : (
                <ContentCopy />
              )
            }
          >
            {isTransferring
              ? `Transferring ${completedCount}/${items.length}...`
              : actionType === "move"
              ? `Move ${isBulk ? `${items.length} Items` : "Here"}`
              : `Copy ${isBulk ? `${items.length} Items` : "Here"}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const LocationPickerLanding = () => {
  const router = useRouter();
  const formControl = useForm({ mode: "onChange" });
  const [loading, setLoading] = useState(false);
  const [locationType, setLocationType] = useState("onedrive");

  const handleTypeChange = (_e, val) => {
    if (!val) return;
    setLocationType(val);
    formControl.setValue("selectedUser", null);
    formControl.setValue("selectedSite", null);
  };

  const handleBrowseUser = (values) => {
    const user = values.selectedUser;
    if (!user) return;
    setLoading(true);
    router.push({
      pathname: router.pathname,
      query: {
        userId: user.value || user,
        name: user.label || user.value || "OneDrive",
      },
    });
  };

  const handleBrowseSite = (values) => {
    const site = values.selectedSite;
    if (!site) return;
    setLoading(true);
    router.push({
      pathname: router.pathname,
      query: {
        siteId: site.value || site,
        name: site.label || site.value || "SharePoint",
      },
    });
  };

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, textAlign: "center", maxWidth: 520, width: "100%" }}>
        <CloudQueue sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Browse Files
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a user&apos;s OneDrive or a SharePoint site to browse files and folders.
        </Typography>
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={locationType}
            exclusive
            onChange={handleTypeChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="onedrive">
              <PersonOutline sx={{ mr: 1 }} /> OneDrive
            </ToggleButton>
            <ToggleButton value="sharepoint">
              <Language sx={{ mr: 1 }} /> SharePoint Site
            </ToggleButton>
          </ToggleButtonGroup>

          {locationType === "onedrive" && (
            <>
              <CippFormComponent
                type="autoComplete"
                name="selectedUser"
                label="Select User"
                formControl={formControl}
                multiple={false}
                api={{
                  url: "/api/ListGraphRequest",
                  data: {
                    Endpoint: "users",
                    $filter: "accountEnabled eq true",
                    $top: 999,
                    $count: true,
                    $orderby: "displayName",
                    $select: "id,displayName,userPrincipalName",
                  },
                  dataKey: "Results",
                  labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
                  valueField: "id",
                }}
              />
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
                onClick={formControl.handleSubmit(handleBrowseUser)}
                disabled={loading || !formControl.watch("selectedUser")}
                fullWidth
              >
                {loading ? "Loading..." : "Browse OneDrive"}
              </Button>
            </>
          )}

          {locationType === "sharepoint" && (
            <>
              <CippFormComponent
                type="autoComplete"
                name="selectedSite"
                label="Select SharePoint Site"
                formControl={formControl}
                multiple={false}
                api={{
                  url: "/api/ListSites",
                  data: { Type: "SharePointSiteUsage" },
                  queryKey: "file-browser-sites",
                  labelField: (s) => s.displayName || s.webUrl || s.siteId,
                  valueField: "siteId",
                }}
              />
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
                onClick={formControl.handleSubmit(handleBrowseSite)}
                disabled={loading || !formControl.watch("selectedSite")}
                fullWidth
              >
                {loading ? "Loading..." : "Browse SharePoint"}
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

const Page = () => {
  const router = useRouter();
  const theme = useTheme();
  const { siteId, driveId, folderId, name, folderPath, userId } = router.query;

  // Query key for the current folder view - used for cache invalidation
  const currentQueryKey = `onedrive-files-${siteId || userId || driveId}-${folderId || "root"}`;

  // New Folder dialog state
  const tenantFilter = useSettings().currentTenant;
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderMutation = ApiPostCall({
    relatedQueryKeys: [currentQueryKey],
  });

  const handleNewFolderSubmit = () => {
    if (!newFolderName.trim()) return;
    const identity = {};
    if (driveId) identity.DriveId = driveId;
    else if (userId) identity.UserId = userId;
    else if (siteId) identity.SiteId = siteId;

    newFolderMutation.mutate({
      url: "/api/ExecOneDriveFileAction",
      data: {
        tenantFilter,
        ...identity,
        Action: "CreateFolder",
        FolderName: newFolderName.trim(),
        ...(folderId ? { ParentId: folderId } : {}),
      },
    });
  };

  const handleNewFolderClose = () => {
    setNewFolderOpen(false);
    setNewFolderName("");
    newFolderMutation.reset();
  };

  // Bulk cross-drive transfer state
  const [bulkTransfer, setBulkTransfer] = useState({ open: false, items: [], actionType: "move" });

  // Location switcher state
  const currentLocationType = siteId ? "sharepoint" : "onedrive";
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherType, setSwitcherType] = useState(currentLocationType);
  const switcherForm = useForm({ mode: "onChange" });

  const handleSwitcherOpen = () => {
    setSwitcherType(currentLocationType);
    switcherForm.reset();
    setSwitcherOpen(true);
  };

  const handleSwitchLocation = (values) => {
    if (switcherType === "onedrive") {
      const user = values.switchUser;
      if (!user) return;
      router.push({
        pathname: router.pathname,
        query: { userId: user.value || user, name: user.label || user.value || "OneDrive" },
      });
    } else {
      const site = values.switchSite;
      if (!site) return;
      router.push({
        pathname: router.pathname,
        query: { siteId: site.value || site, name: site.label || site.value || "SharePoint" },
      });
    }
    setSwitcherOpen(false);
  };

  // Build breadcrumb from folderPath
  const breadcrumbs = useMemo(() => {
    const rootLabel = name || (siteId ? "SharePoint" : "OneDrive");
    const crumbs = [{ label: rootLabel, folderId: null }];
    if (folderPath) {
      const parts = folderPath.split("/").filter(Boolean);
      for (let i = 0; i < parts.length; i += 2) {
        crumbs.push({
          label: parts[i],
          folderId: parts[i + 1] || null,
        });
      }
    }
    return crumbs;
  }, [folderPath, name]);

  const navigateToFolder = useCallback(
    (itemId, itemName) => {
      const newPath = folderPath
        ? `${folderPath}/${itemName}/${itemId}`
        : `${itemName}/${itemId}`;
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...(siteId && { siteId }),
            ...(driveId && { driveId }),
            ...(userId && { userId }),
            name,
            folderId: itemId,
            folderPath: newPath,
          },
        },
        undefined,
        { shallow: true }
      );
    },
    [router, siteId, driveId, userId, name, folderPath]
  );

  const navigateToBreadcrumb = (index) => {
    const crumb = breadcrumbs[index];
    if (index === 0) {
      const { folderId: _f, folderPath: _fp, ...rest } = router.query;
      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    } else {
      const parts = folderPath.split("/").filter(Boolean);
      const newPath = parts.slice(0, index * 2).join("/");
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...(siteId && { siteId }),
            ...(driveId && { driveId }),
            ...(userId && { userId }),
            name,
            folderId: crumb.folderId,
            folderPath: newPath,
          },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const goUp = () => {
    if (breadcrumbs.length <= 1) return;
    navigateToBreadcrumb(breadcrumbs.length - 2);
  };

  // Build API query params for listing files
  const apiData = useMemo(() => {
    const data = {};
    if (siteId) data.SiteId = siteId;
    if (driveId) data.DriveId = driveId;
    if (userId) data.UserId = userId;
    if (folderId) data.FolderId = folderId;
    return data;
  }, [siteId, driveId, userId, folderId]);

  // Build the common data payload for file actions (drive identity)
  // The `!` prefix marks literal values for CippApiDialog action processing
  const driveIdentity = useMemo(() => {
    if (driveId) return { DriveId: `!${driveId}` };
    if (userId) return { UserId: `!${userId}` };
    if (siteId) return { SiteId: `!${siteId}` };
    return {};
  }, [driveId, userId, siteId]);

  // Raw identity without `!` prefix for direct API calls (cross-drive dialogs)
  const rawDriveIdentity = useMemo(() => {
    if (driveId) return { DriveId: driveId };
    if (userId) return { UserId: userId };
    if (siteId) return { SiteId: siteId };
    return {};
  }, [driveId, userId, siteId]);

  // Build folder picker API config for Move/Copy destination
  const folderPickerApi = useMemo(
    () => ({
      url: "/api/ListOneDriveFiles",
      data: {
        ...(siteId && { SiteId: siteId }),
        ...(driveId && { DriveId: driveId }),
        ...(userId && { UserId: userId }),
      },
      queryKey: `onedrive-root-folders-${siteId || userId || driveId}`,
      labelField: (item) => item.name,
      valueField: "id",
      dataFilter: (data) => data.filter((item) => item.rawData?.isFolder),
    }),
    [siteId, driveId, userId]
  );

  // Custom columns with icons and clickable folder names
  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        size: 350,
        Cell: ({ row }) => {
          const item = row.original;
          const { icon, color } = getFileIcon(item.fileExtension, item.isFolder);
          const colorValue =
            color === "action"
              ? theme.palette.action.active
              : theme.palette[color]?.main || theme.palette.primary.main;

          return (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                ...(item.isFolder && {
                  cursor: "pointer",
                  "&:hover .folder-name": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }),
              }}
              onClick={
                item.isFolder
                  ? (e) => {
                      e.stopPropagation();
                      navigateToFolder(item.id, item.name);
                    }
                  : undefined
              }
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 0.75,
                  bgcolor: alpha(colorValue, 0.1),
                  color: colorValue,
                  flexShrink: 0,
                  "& .MuiSvgIcon-root": { fontSize: 18 },
                }}
              >
                {icon}
              </Box>
              <Typography
                variant="body2"
                className="folder-name"
                sx={{
                  fontWeight: item.isFolder ? 600 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </Typography>
              {item.isFolder && item.childCount != null && (
                <Chip
                  label={`${item.childCount}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              )}
            </Stack>
          );
        },
      },
      {
        id: "sizeFormatted",
        header: "Size",
        accessorKey: "sizeFormatted",
        size: 120,
        Cell: ({ row }) => (
          <Typography
            variant="body2"
            color={row.original.isFolder ? "text.secondary" : "text.primary"}
          >
            {row.original.sizeFormatted}
          </Typography>
        ),
      },
      {
        id: "lastModified",
        header: "Modified",
        accessorKey: "lastModified",
        size: 180,
        Cell: ({ row }) => {
          const date = row.original.lastModified;
          if (!date) return null;
          try {
            return (
              <Typography variant="body2" color="text.secondary">
                {new Date(date).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            );
          } catch {
            return (
              <Typography variant="body2" color="text.secondary">
                {date}
              </Typography>
            );
          }
        },
      },
      {
        id: "createdBy",
        header: "Created By",
        accessorKey: "createdBy",
        size: 160,
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        size: 80,
        Cell: ({ row }) => {
          const item = row.original;
          if (item.isFolder) {
            return (
              <Chip
                label="Folder"
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 22, fontSize: "0.7rem" }}
              />
            );
          }
          return (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}
            >
              {item.fileExtension || "File"}
            </Typography>
          );
        },
      },
    ],
    [theme, navigateToFolder]
  );

  // File/folder actions
  const actions = useMemo(
    () => [
      // -- View --
      {
        label: "Open in Browser",
        type: "link",
        icon: <OpenInNew />,
        link: "[webUrl]",
        external: true,
        category: "view",
      },
      {
        label: "Download",
        type: "POST",
        icon: <Download />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          ItemId: "id",
          ItemName: "name",
          Action: "!Download",
        },
        confirmText: "Download '[name]'? A download link will be generated.",
        multiPost: false,
        condition: (row) => !row.isFolder,
        category: "view",
        // The backend returns a downloadUrl field - we handle it via the Results toast
        // and the user can open it from there. For a smoother UX we use onComplete below.
      },

      // -- Edit --
      {
        label: "Rename",
        type: "POST",
        icon: <Edit />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          ItemId: "id",
          ItemName: "name",
          Action: "!Rename",
        },
        confirmText: "Enter a new name for '[name]'.",
        fields: [
          {
            type: "textField",
            name: "NewName",
            label: "New Name",
            required: true,
          },
        ],
        relatedQueryKeys: [currentQueryKey],
        multiPost: false,
        category: "edit",
      },
      {
        label: "Move to Folder",
        type: "POST",
        icon: <DriveFileMove />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          ItemId: "id",
          ItemName: "name",
          Action: "!Move",
        },
        confirmText:
          "Select a destination folder to move '[name]' into. Only top-level folders are shown.",
        fields: [
          {
            type: "autoComplete",
            name: "DestinationFolderId",
            label: "Destination Folder",
            multiple: false,
            creatable: false,
            api: folderPickerApi,
          },
        ],
        relatedQueryKeys: [currentQueryKey],
        multiPost: false,
        category: "manage",
      },
      {
        label: "Copy",
        type: "POST",
        icon: <ContentCopy />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          ItemId: "id",
          ItemName: "name",
          Action: "!Copy",
        },
        confirmText:
          "Copy '[name]'. Optionally provide a new name or select a destination folder. Leave both blank to copy in the same location.",
        fields: [
          {
            type: "textField",
            name: "CopyName",
            label: "New Name (optional)",
          },
          {
            type: "autoComplete",
            name: "DestinationFolderId",
            label: "Destination Folder (optional, defaults to same location)",
            multiple: false,
            creatable: false,
            api: folderPickerApi,
          },
        ],
        relatedQueryKeys: [currentQueryKey],
        multiPost: false,
        category: "manage",
      },

      // -- Cross-drive --
      {
        label: "Move to Another Drive",
        icon: <SwapHoriz />,
        customComponent: (row, opts) => CrossDriveTransferDrawer(row, opts, "move", rawDriveIdentity),
        customBulkHandler: ({ data, clearSelection }) => {
          setBulkTransfer({ open: true, items: data, actionType: "move" });
          clearSelection();
        },
        category: "manage",
      },
      {
        label: "Copy to Another Drive",
        icon: <ContentCopy />,
        customComponent: (row, opts) => CrossDriveTransferDrawer(row, opts, "copy", rawDriveIdentity),
        customBulkHandler: ({ data, clearSelection }) => {
          setBulkTransfer({ open: true, items: data, actionType: "copy" });
          clearSelection();
        },
        category: "manage",
      },

      // -- Danger --
      {
        label: "Delete",
        type: "POST",
        icon: <Delete />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          ItemId: "id",
          ItemName: "name",
          Action: "!Delete",
        },
        confirmText:
          "Are you sure you want to delete '[name]'? It will be moved to the OneDrive recycle bin and can be restored within 93 days.",
        color: "error",
        relatedQueryKeys: [currentQueryKey],
        multiPost: false,
        category: "danger",
      },
    ],
    [driveIdentity, rawDriveIdentity, folderPickerApi, currentQueryKey]
  );

  const defaultLabel = siteId ? "SharePoint" : "OneDrive";
  const pageTitle = `Files — ${name || defaultLabel}`;

  if (!siteId && !driveId && !userId) {
    return <LocationPickerLanding />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Breadcrumb Navigation */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 1.5,
          mb: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.info.main, 0.04),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {breadcrumbs.length > 1 && (
            <Tooltip title="Go up one level">
              <IconButton size="small" onClick={goUp}>
                <ArrowBack fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Breadcrumbs separator="/" sx={{ flex: 1 }}>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return isLast ? (
                <Chip
                  key={i}
                  icon={i === 0 ? <Home fontSize="small" /> : <Folder fontSize="small" />}
                  label={crumb.label}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              ) : (
                <MuiLink
                  key={i}
                  component="button"
                  underline="hover"
                  color="text.secondary"
                  variant="body2"
                  onClick={() => navigateToBreadcrumb(i)}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {i === 0 && <Home fontSize="small" />}
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
          <Tooltip title="Switch OneDrive or SharePoint site">
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={handleSwitcherOpen}
              sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Switch
            </Button>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            startIcon={<CreateNewFolder />}
            onClick={() => setNewFolderOpen(true)}
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            New Folder
          </Button>
        </Stack>
      </Paper>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onClose={handleNewFolderClose} fullWidth maxWidth="xs">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CreateNewFolder color="primary" />
            <span>New Folder</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a new folder in the current directory.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) {
                handleNewFolderSubmit();
              }
            }}
            size="small"
          />
          <CippApiResults apiObject={newFolderMutation} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewFolderClose} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleNewFolderSubmit}
            disabled={!newFolderName.trim() || newFolderMutation.isPending}
            startIcon={
              newFolderMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <CreateNewFolder />
              )
            }
          >
            {newFolderMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Switch Location Dialog */}
      <Dialog
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SwapHoriz color="primary" />
            <span>Switch Location</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <ToggleButtonGroup
              value={switcherType}
              exclusive
              onChange={(_e, val) => {
                if (!val) return;
                setSwitcherType(val);
                switcherForm.reset();
              }}
              size="small"
              fullWidth
            >
              <ToggleButton value="onedrive">
                <PersonOutline sx={{ mr: 1 }} /> OneDrive
              </ToggleButton>
              <ToggleButton value="sharepoint">
                <Language sx={{ mr: 1 }} /> SharePoint
              </ToggleButton>
            </ToggleButtonGroup>

            {switcherType === "onedrive" && (
              <CippFormComponent
                type="autoComplete"
                name="switchUser"
                label="Select User"
                formControl={switcherForm}
                multiple={false}
                api={{
                  url: "/api/ListGraphRequest",
                  data: {
                    Endpoint: "users",
                    $filter: "accountEnabled eq true",
                    $top: 999,
                    $count: true,
                    $orderby: "displayName",
                    $select: "id,displayName,userPrincipalName",
                  },
                  dataKey: "Results",
                  labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
                  valueField: "id",
                }}
              />
            )}

            {switcherType === "sharepoint" && (
              <CippFormComponent
                type="autoComplete"
                name="switchSite"
                label="Select SharePoint Site"
                formControl={switcherForm}
                multiple={false}
                api={{
                  url: "/api/ListSites",
                  data: { Type: "SharePointSiteUsage" },
                  queryKey: "file-browser-sites",
                  labelField: (s) => s.displayName || s.webUrl || s.siteId,
                  valueField: "siteId",
                }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwitcherOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={switcherForm.handleSubmit(handleSwitchLocation)}
            disabled={
              switcherType === "onedrive"
                ? !switcherForm.watch("switchUser")
                : !switcherForm.watch("switchSite")
            }
          >
            Browse
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Table */}
      <CippTablePage
        title={pageTitle}
        apiUrl="/api/ListOneDriveFiles"
        apiData={apiData}
        actions={actions}
        queryKey={currentQueryKey}
        columns={columns}
        defaultViewMode="table"
        defaultSorting={[
          { id: "type", desc: true },
          { id: "name", desc: false },
        ]}
      />

      {/* Bulk Cross-Drive Transfer Dialog */}
      <CrossDriveTransferDialog
        open={bulkTransfer.open}
        onClose={() => setBulkTransfer({ open: false, items: [], actionType: "move" })}
        items={bulkTransfer.items}
        actionType={bulkTransfer.actionType}
        sourceIdentity={rawDriveIdentity}
      />
    </Box>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
