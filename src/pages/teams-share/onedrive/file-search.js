import { Layout as DashboardLayout } from "../../../layouts/index.js";
import { useRouter } from "next/router";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Pagination,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/system";
import {
  Search,
  OpenInNew,
  FolderOpen,
  Clear,
  Info,
  ExpandMore,
  LightbulbOutlined,
  ContentCopy,
  Check,
} from "@mui/icons-material";
import { CippHead } from "../../../components/CippComponents/CippHead";
import { ApiPostCall } from "../../../api/ApiCall";
import { useSettings } from "../../../hooks/use-settings";
import { useState, useMemo, useCallback } from "react";
import { getFileIcon } from "../../../utils/get-file-icon";

const PAGE_SIZE = 25;

const Page = () => {
  const router = useRouter();
  const theme = useTheme();
  const tenantFilter = useSettings().currentTenant;

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const searchMutation = ApiPostCall({});

  const executeSearch = (query, from = 0) => {
    if (!query.trim() || !tenantFilter) return;
    setActiveQuery(query.trim());
    setCurrentPage(from / PAGE_SIZE);
    searchMutation.mutate({
      url: "/api/ExecSearchFiles",
      data: {
        TenantFilter: tenantFilter,
        SearchQuery: query.trim(),
        From: from,
        Size: PAGE_SIZE,
      },
    });
  };

  const handleSearch = () => executeSearch(searchInput, 0);

  const handlePageChange = (_e, page) => {
    const from = (page - 1) * PAGE_SIZE;
    executeSearch(activeQuery, from);
  };

  const results = searchMutation.data?.data?.Results || [];
  const totalCount = searchMutation.data?.data?.TotalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleBrowseLocation = (item) => {
    const query = {};
    if (item.siteId) {
      query.siteId = item.siteId;
    } else if (item.driveId) {
      query.driveId = item.driveId;
    }
    query.name = item.siteName || item.driveName || "Location";
    if (item.parentId && item.parentId !== item.driveId) {
      query.folderId = item.parentId;
    }
    router.push({
      pathname: "/teams-share/onedrive/file-browser",
      query,
    });
  };

  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = useCallback((item) => {
    if (!item.webUrl) return;
    navigator.clipboard.writeText(item.webUrl).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const columns = useMemo(
    () => [
      { id: "name", label: "Name", width: "30%" },
      { id: "location", label: "Location", width: "25%" },
      { id: "sizeFormatted", label: "Size", width: "10%" },
      { id: "lastModified", label: "Modified", width: "15%" },
      { id: "lastModifiedBy", label: "Modified By", width: "12%" },
      { id: "actions", label: "", width: "8%" },
    ],
    []
  );

  return (
    <>
      <CippHead title="File Search" />
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">Search Files & Folders</Typography>
            <Typography variant="body2" color="text.secondary">
              Search across all SharePoint sites and OneDrive accounts in the
              selected tenant. Enter keywords, file names, or use advanced
              filters to find what you need.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                placeholder="Search by file name, content, or keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchInput.trim()) handleSearch();
                }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchInput("")}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={
                  !searchInput.trim() ||
                  !tenantFilter ||
                  searchMutation.isPending
                }
                startIcon={
                  searchMutation.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Search />
                  )
                }
                sx={{ whiteSpace: "nowrap", px: 3 }}
              >
                {searchMutation.isPending ? "Searching..." : "Search"}
              </Button>
            </Stack>

            {!tenantFilter && (
              <Alert severity="warning" variant="outlined">
                Please select a tenant from the dropdown above to search.
              </Alert>
            )}

            <Accordion
              disableGutters
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "8px !important",
                "&::before": { display: "none" },
                bgcolor: alpha(theme.palette.info.main, 0.03),
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ minHeight: 40, "& .MuiAccordionSummary-content": { my: 0.75 } }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LightbulbOutlined fontSize="small" color="info" />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Search Tips
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.primary">
                    Basic Search
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Simple keywords</strong> &mdash; Type any word or phrase.
                        E.g. <code>budget report</code> finds files containing both words.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Exact phrase</strong> &mdash; Use quotes for exact matches.
                        E.g. <code>&quot;quarterly budget report&quot;</code>
                      </Typography>
                    </li>
                  </Box>

                  <Typography variant="subtitle2" color="text.primary">
                    Filter by File Properties
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>filename:report</code> &mdash; Match files with
                        &quot;report&quot; in the file name
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>filetype:pdf</code> &mdash; Only PDF files
                        (also works with <code>xlsx</code>, <code>docx</code>,
                        <code>pptx</code>, etc.)
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>author:&quot;John Smith&quot;</code> &mdash; Files
                        created by a specific person
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>path:&quot;https://contoso.sharepoint.com/sites/HR&quot;</code>{" "}
                        &mdash; Limit search to a specific SharePoint site
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>lastmodifiedtime&gt;2025-01-01</code> &mdash; Files
                        modified after a specific date
                      </Typography>
                    </li>
                  </Box>

                  <Typography variant="subtitle2" color="text.primary">
                    Combine Filters
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 0.5 } }}>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>annual report filetype:pdf</code> &mdash; PDFs
                        containing &quot;annual&quot; and &quot;report&quot;
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>filename:invoice filetype:xlsx author:&quot;Jane&quot;</code>{" "}
                        &mdash; Excel files named &quot;invoice&quot; by Jane
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" color="text.secondary">
                        <code>contract OR agreement filetype:docx</code> &mdash;{" "}
                        Word docs containing either word
                      </Typography>
                    </li>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    This search uses Microsoft&apos;s{" "}
                    <MuiLink
                      href="https://learn.microsoft.com/en-us/sharepoint/dev/general-development/keyword-query-language-kql-syntax-reference"
                      target="_blank"
                      rel="noopener"
                    >
                      KQL syntax
                    </MuiLink>
                    . Results come from Microsoft&apos;s search index, which may take a
                    few minutes to reflect very recently uploaded files.
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Paper>

        {/* Results */}
        {searchMutation.isError && (
          <Alert severity="error">
            {searchMutation.error?.message ||
              "Search failed. Please try again."}
          </Alert>
        )}

        {searchMutation.isSuccess &&
          typeof searchMutation.data?.data?.Results === "string" && (
            <Alert severity="error" variant="outlined">
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Search failed
              </Typography>
              <Typography variant="body2">
                {searchMutation.data.data.Results}
              </Typography>
              {(searchMutation.data.data.Results.includes("403") ||
                searchMutation.data.data.Results.includes("Forbidden") ||
                searchMutation.data.data.Results.includes("Access") ||
                searchMutation.data.data.Results.includes("permission") ||
                searchMutation.data.data.Results.includes("Authorization")) && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This usually means the <strong>Files.Read.All</strong>{" "}
                  permission has not been granted for this tenant. Go to{" "}
                  <strong>
                    CIPP Settings &gt; SAM Permissions &gt; CPV Refresh
                  </strong>{" "}
                  to push the updated permissions to this tenant, then try again.
                </Typography>
              )}
            </Alert>
          )}

        {searchMutation.isSuccess &&
          Array.isArray(searchMutation.data?.data?.Results) && (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Results Header */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">
                  {totalCount > 0
                    ? `${totalCount.toLocaleString()} result${totalCount !== 1 ? "s" : ""}`
                    : "No results"}
                </Typography>
                {activeQuery && (
                  <Chip
                    label={activeQuery}
                    size="small"
                    variant="outlined"
                    onDelete={() => {
                      setActiveQuery("");
                      setSearchInput("");
                    }}
                  />
                )}
              </Stack>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={currentPage + 1}
                  onChange={handlePageChange}
                  size="small"
                  shape="rounded"
                />
              )}
            </Box>

            {results.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Info
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography variant="body1" color="text.secondary">
                  No files or folders matched your search.
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Try different keywords or check the KQL syntax guide.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Column Headers */}
                <Box
                  sx={{
                    display: "flex",
                    px: 2,
                    py: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                  }}
                >
                  {columns.map((col) => (
                    <Box key={col.id} sx={{ width: col.width, px: 1 }}>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        {col.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Result Rows */}
                {results.map((item, idx) => {
                  const { icon, color } = getFileIcon(
                    item.fileExtension,
                    item.isFolder
                  );
                  const colorValue =
                    color === "action"
                      ? theme.palette.action.active
                      : theme.palette[color]?.main ||
                        theme.palette.primary.main;

                  const locationLabel = [
                    item.siteName,
                    item.folderPath && item.folderPath !== "/"
                      ? item.folderPath
                      : null,
                  ]
                    .filter(Boolean)
                    .join("");

                  return (
                    <Box
                      key={`${item.id}-${idx}`}
                      sx={{
                        display: "flex",
                        px: 2,
                        py: 1.25,
                        alignItems: "center",
                        borderBottom: `1px solid ${alpha(
                          theme.palette.divider,
                          0.5
                        )}`,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                        },
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      {/* Name */}
                      <Box
                        sx={{
                          width: "30%",
                          px: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          minWidth: 0,
                        }}
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
                        <Tooltip title={item.name} enterDelay={500}>
                          <Typography
                            variant="body2"
                            fontWeight={item.isFolder ? 600 : 400}
                            noWrap
                          >
                            {item.name}
                          </Typography>
                        </Tooltip>
                      </Box>

                      {/* Location */}
                      <Box sx={{ width: "25%", px: 1, minWidth: 0 }}>
                        <Tooltip
                          title={locationLabel || "Root"}
                          enterDelay={500}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {locationLabel || "Root"}
                          </Typography>
                        </Tooltip>
                      </Box>

                      {/* Size */}
                      <Box sx={{ width: "10%", px: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.sizeFormatted}
                        </Typography>
                      </Box>

                      {/* Modified */}
                      <Box sx={{ width: "15%", px: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.lastModified
                            ? new Date(item.lastModified).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : ""}
                        </Typography>
                      </Box>

                      {/* Modified By */}
                      <Box sx={{ width: "12%", px: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {item.lastModifiedBy || ""}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box
                        sx={{
                          width: "8%",
                          px: 1,
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "flex-end",
                        }}
                      >
                        {item.webUrl && (
                          <Tooltip
                            title={
                              copiedId === item.id
                                ? "Copied!"
                                : "Copy shareable link"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(item)}
                              color={
                                copiedId === item.id ? "success" : "default"
                              }
                            >
                              {copiedId === item.id ? (
                                <Check fontSize="small" />
                              ) : (
                                <ContentCopy fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        {(item.siteId || item.driveId) && (
                          <Tooltip title="Browse in File Browser">
                            <IconButton
                              size="small"
                              onClick={() => handleBrowseLocation(item)}
                            >
                              <FolderOpen fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.webUrl && (
                          <Tooltip title="Open in SharePoint">
                            <IconButton
                              size="small"
                              component="a"
                              href={item.webUrl}
                              target="_blank"
                              rel="noopener"
                            >
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 2,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Pagination
                      count={totalPages}
                      page={currentPage + 1}
                      onChange={handlePageChange}
                      size="small"
                      shape="rounded"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        )}
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
