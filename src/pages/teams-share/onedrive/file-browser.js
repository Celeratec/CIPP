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
  Skeleton,
  Button,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  Folder,
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
} from "@mui/icons-material";
import { CippTablePage } from "../../../components/CippComponents/CippTablePage.jsx";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

// Map file extensions to icons
const getFileIcon = (extension, isFolder) => {
  if (isFolder) return <Folder />;
  const iconMap = {
    pdf: <PictureAsPdf />,
    jpg: <Image />,
    jpeg: <Image />,
    png: <Image />,
    gif: <Image />,
    svg: <Image />,
    webp: <Image />,
    bmp: <Image />,
    xlsx: <TableChart />,
    xls: <TableChart />,
    csv: <TableChart />,
    mp4: <VideoFile />,
    avi: <VideoFile />,
    mov: <VideoFile />,
    mkv: <VideoFile />,
    mp3: <AudioFile />,
    wav: <AudioFile />,
    flac: <AudioFile />,
    zip: <Archive />,
    rar: <Archive />,
    "7z": <Archive />,
    tar: <Archive />,
    gz: <Archive />,
    js: <Code />,
    ts: <Code />,
    py: <Code />,
    json: <Code />,
    xml: <Code />,
    html: <Code />,
    css: <Code />,
  };
  return iconMap[extension?.toLowerCase()] || <InsertDriveFile />;
};

const UserPicker = () => {
  const router = useRouter();
  const theme = useTheme();
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
      // folderPath format: "folderName1/folderId1/folderName2/folderId2/..."
      for (let i = 0; i < parts.length; i += 2) {
        crumbs.push({
          label: parts[i],
          folderId: parts[i + 1] || null,
        });
      }
    }
    return crumbs;
  }, [folderPath, name]);

  const navigateToFolder = (itemId, itemName) => {
    const newPath = folderPath ? `${folderPath}/${itemName}/${itemId}` : `${itemName}/${itemId}`;
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
  };

  const navigateToBreadcrumb = (index) => {
    const crumb = breadcrumbs[index];
    if (index === 0) {
      // Root - keep siteId/driveId/userId/name, remove folderId/folderPath
      const { folderId: _f, folderPath: _fp, ...rest } = router.query;
      router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    } else {
      // Rebuild folderPath up to this crumb
      const parts = folderPath.split("/").filter(Boolean);
      const newPath = parts.slice(0, (index) * 2).join("/");
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
        simpleColumns={["name", "type", "sizeFormatted", "lastModified", "createdBy"]}
        cardConfig={{
          title: "name",
          avatar: {
            field: "fileExtension",
            customRender: (value, item) => {
              const icon = getFileIcon(value, item?.isFolder);
              const color = item?.isFolder ? "info" : "primary";
              return (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette[color].main, 0.1),
                    color: (t) => t.palette[color].main,
                  }}
                >
                  {icon}
                </Box>
              );
            },
          },
          extraFields: [
            { field: "sizeFormatted", label: "Size" },
            { field: "lastModified", label: "Modified" },
          ],
          cardGridProps: { md: 6, lg: 4 },
        }}
        options={{
          onRowClick: (row) => {
            if (row.isFolder) {
              navigateToFolder(row.id, row.name);
            }
          },
        }}
      />
    </Box>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
