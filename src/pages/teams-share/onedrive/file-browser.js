import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Chip,
  Breadcrumbs,
  useTheme,
  Tooltip,
  IconButton,
  Link as MuiLink,
  Button,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  Folder,
  FolderOpen,
  InsertDriveFile,
  ArrowBack,
  Home,
  OpenInNew,
  CloudQueue,
  Image,
  PictureAsPdf,
  TableChart,
  Code,
  VideoFile,
  AudioFile,
  Archive,
  Search,
  Description,
  SlideshowOutlined,
  TextSnippet,
} from "@mui/icons-material";
import { CippTablePage } from "../../../components/CippComponents/CippTablePage.jsx";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";

// Map file extensions to icons and colors
const getFileIcon = (extension, isFolder) => {
  if (isFolder) return { icon: <Folder />, color: "info" };
  const iconMap = {
    pdf: { icon: <PictureAsPdf />, color: "error" },
    doc: { icon: <Description />, color: "primary" },
    docx: { icon: <Description />, color: "primary" },
    txt: { icon: <TextSnippet />, color: "action" },
    rtf: { icon: <TextSnippet />, color: "action" },
    jpg: { icon: <Image />, color: "success" },
    jpeg: { icon: <Image />, color: "success" },
    png: { icon: <Image />, color: "success" },
    gif: { icon: <Image />, color: "success" },
    svg: { icon: <Image />, color: "success" },
    webp: { icon: <Image />, color: "success" },
    bmp: { icon: <Image />, color: "success" },
    xlsx: { icon: <TableChart />, color: "success" },
    xls: { icon: <TableChart />, color: "success" },
    csv: { icon: <TableChart />, color: "success" },
    pptx: { icon: <SlideshowOutlined />, color: "warning" },
    ppt: { icon: <SlideshowOutlined />, color: "warning" },
    mp4: { icon: <VideoFile />, color: "secondary" },
    avi: { icon: <VideoFile />, color: "secondary" },
    mov: { icon: <VideoFile />, color: "secondary" },
    mkv: { icon: <VideoFile />, color: "secondary" },
    mp3: { icon: <AudioFile />, color: "secondary" },
    wav: { icon: <AudioFile />, color: "secondary" },
    flac: { icon: <AudioFile />, color: "secondary" },
    zip: { icon: <Archive />, color: "warning" },
    rar: { icon: <Archive />, color: "warning" },
    "7z": { icon: <Archive />, color: "warning" },
    tar: { icon: <Archive />, color: "warning" },
    gz: { icon: <Archive />, color: "warning" },
    js: { icon: <Code />, color: "warning" },
    ts: { icon: <Code />, color: "info" },
    py: { icon: <Code />, color: "info" },
    json: { icon: <Code />, color: "warning" },
    xml: { icon: <Code />, color: "warning" },
    html: { icon: <Code />, color: "warning" },
    css: { icon: <Code />, color: "info" },
  };
  return iconMap[extension?.toLowerCase()] || { icon: <InsertDriveFile />, color: "action" };
};

const UserPicker = () => {
  const router = useRouter();
  const formControl = useForm({ mode: "onChange" });
  const [loading, setLoading] = useState(false);

  const handleBrowse = (values) => {
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

  return (
    <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, textAlign: "center", maxWidth: 500, width: "100%" }}>
        <CloudQueue sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Browse OneDrive Files
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a user to browse their OneDrive files and folders.
        </Typography>
        <Stack spacing={2}>
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
            onClick={formControl.handleSubmit(handleBrowse)}
            disabled={loading || !formControl.watch("selectedUser")}
            fullWidth
          >
            {loading ? "Loading..." : "Browse Files"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

const Page = () => {
  const router = useRouter();
  const theme = useTheme();
  const { siteId, driveId, folderId, name, folderPath, userId } = router.query;

  // Build breadcrumb from folderPath
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: name || "OneDrive", folderId: null }];
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

  // Build API query params
  const apiData = useMemo(() => {
    const data = {};
    if (siteId) data.SiteId = siteId;
    if (driveId) data.DriveId = driveId;
    if (userId) data.UserId = userId;
    if (folderId) data.FolderId = folderId;
    return data;
  }, [siteId, driveId, userId, folderId]);

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
          const colorValue = color === "action"
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
                  sx={{ height: 20, fontSize: "0.7rem", "& .MuiChip-label": { px: 0.75 } }}
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
          <Typography variant="body2" color={row.original.isFolder ? "text.secondary" : "text.primary"}>
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
            return <Typography variant="body2" color="text.secondary">{date}</Typography>;
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
              <Chip label="Folder" size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
            );
          }
          return (
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}>
              {item.fileExtension || "File"}
            </Typography>
          );
        },
      },
    ],
    [theme, navigateToFolder]
  );

  const actions = useMemo(
    () => [
      {
        label: "Open in Browser",
        type: "link",
        icon: <OpenInNew />,
        link: "[webUrl]",
        external: true,
        category: "view",
      },
    ],
    []
  );

  const pageTitle = `Files — ${name || "OneDrive"}`;

  if (!siteId && !driveId && !userId) {
    return <UserPicker />;
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

      {/* File Table */}
      <CippTablePage
        title={pageTitle}
        apiUrl="/api/ListOneDriveFiles"
        apiData={apiData}
        actions={actions}
        queryKey={`onedrive-files-${siteId || userId || driveId}-${folderId || "root"}`}
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
