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
  IconButton,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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
// Rendered via customComponent action pattern from CippDataTable
const CrossDriveTransferDrawer = (row, { drawerVisible, setDrawerVisible }, actionType) => {
  return (
    <CrossDriveTransferDialog
      open={drawerVisible}
      onClose={() => setDrawerVisible(false)}
      item={row}
      actionType={actionType}
    />
  );
};

const CrossDriveTransferDialog = ({ open, onClose, item, actionType }) => {
  const tenantFilter = useSettings().currentTenant;
  const formControl = useForm({ mode: "onChange" });
  const theme = useTheme();

  const [locationType, setLocationType] = useState("onedrive");
  const [destLocation, setDestLocation] = useState(null);
  const [destFolderId, setDestFolderId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: "Root", id: null }]);
  const prevValueRef = useRef(null);

  const transferMutation = ApiPostCall({ onResult: () => {} });

  // Watch form values for location selection
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

  // Folder browser for destination
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
    return raw.filter((item) => item.isFolder);
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

  const handleExecute = () => {
    const action = actionType === "move" ? "CrossMove" : "CrossCopy";
    const destIdentity = {};
    if (destLocation.type === "onedrive") {
      destIdentity.DestinationUserId = destLocation.userId;
    } else {
      destIdentity.DestinationSiteId = destLocation.siteId;
    }

    transferMutation.mutate({
      url: "/api/ExecOneDriveFileAction",
      data: {
        TenantFilter: tenantFilter,
        ItemId: item.id,
        ItemName: item.name,
        Action: action,
        ...destIdentity,
        ...(destFolderId ? { DestinationFolderId: destFolderId } : {}),
      },
    });
  };

  const handleClose = () => {
    onClose();
    transferMutation.reset();
    setDestLocation(null);
    setDestFolderId(null);
    setCurrentFolderId(null);
    setBreadcrumbs([{ label: "Root", id: null }]);
    formControl.reset();
    prevValueRef.current = null;
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          {actionType === "move" ? <DriveFileMove color="primary" /> : <ContentCopy color="primary" />}
          <span>{actionType === "move" ? "Move" : "Copy"} to Another Drive</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info" variant="outlined">
            {actionType === "move" ? "Move" : "Copy"} <strong>{item?.name}</strong> to a different
            user&apos;s OneDrive or a SharePoint site.
          </Alert>

          {/* Destination type toggle */}
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

          {/* User/Site picker */}
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

          {/* Folder browser */}
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

          {/* Results */}
          <CippApiResults apiObject={transferMutation} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}
          disabled={!destLocation || transferMutation.isPending}
          startIcon={
            transferMutation.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : actionType === "move" ? (
              <DriveFileMove />
            ) : (
              <ContentCopy />
            )
          }
        >
          {transferMutation.isPending
            ? "Transferring..."
            : actionType === "move"
            ? "Move Here"
            : "Copy Here"}
        </Button>
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
  const driveIdentity = useMemo(() => {
    if (driveId) return { DriveId: `!${driveId}` };
    if (userId) return { UserId: `!${userId}` };
    if (siteId) return { SiteId: `!${siteId}` };
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
        // No FolderId = root children
      },
      queryKey: `onedrive-root-folders-${siteId || userId || driveId}`,
      dataKey: "Results",
      labelField: (item) => item.name,
      valueField: "id",
      dataFilter: (data) => data.filter((item) => item.isFolder),
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
        customComponent: (row, opts) => CrossDriveTransferDrawer(row, opts, "move"),
        category: "manage",
      },
      {
        label: "Copy to Another Drive",
        icon: <ContentCopy />,
        customComponent: (row, opts) => CrossDriveTransferDrawer(row, opts, "copy"),
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

      // -- Create Folder (toolbar-level, applies to current directory) --
      {
        label: "New Folder",
        type: "POST",
        icon: <CreateNewFolder />,
        url: "/api/ExecOneDriveFileAction",
        data: {
          ...driveIdentity,
          Action: "!CreateFolder",
          ...(folderId ? { ParentId: `!${folderId}` } : {}),
        },
        confirmText: "Create a new folder in the current directory.",
        fields: [
          {
            type: "textField",
            name: "FolderName",
            label: "Folder Name",
            required: true,
          },
        ],
        relatedQueryKeys: [currentQueryKey],
        multiPost: false,
        // No row data needed - this is a toolbar action
        noSelectionRequired: true,
        category: "edit",
      },
    ],
    [driveIdentity, folderPickerApi, currentQueryKey, folderId]
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
        </Stack>
      </Paper>

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
    </Box>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
