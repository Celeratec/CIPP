import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  SvgIcon,
  useMediaQuery,
  useTheme,
  Avatar,
  Typography,
  Chip,
  Stack,
  IconButton,
  TextField,
  InputAdornment,
  Skeleton,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { ResourceUnavailable } from "../resource-unavailable";
import { ResourceError } from "../resource-error";
import { Scrollbar } from "../scrollbar";
import { useEffect, useMemo, useState, useCallback, isValidElement } from "react";
import { ApiGetCallWithPagination } from "../../api/ApiCall";
import { utilTableMode } from "./util-tablemode";
import { utilColumnsFromAPI, resolveSimpleColumnVariables } from "./util-columnsFromAPI";
import { CIPPTableToptoolbar } from "./CIPPTableToptoolbar";
import { Info, More, MoreHoriz, Search, CheckCircle, Cancel, Refresh, ViewModule, TableChart, Email, Phone, Business, CalendarToday, Badge } from "@mui/icons-material";
import { CippOffCanvas } from "../CippComponents/CippOffCanvas";
import { useDialog } from "../../hooks/use-dialog";
import { CippApiDialog } from "../CippComponents/CippApiDialog";
import { getCippError } from "../../utils/get-cipp-error";
import { CippQuickActions } from "../CippComponents/CippActionMenu";
import { Box } from "@mui/system";
import { useSettings } from "../../hooks/use-settings";
import { isEqual } from "lodash"; // Import lodash for deep comparison
import { useRouter } from "next/router";
import { getCippTranslation } from "../../utils/get-cipp-translation";
import CippUserAvatar from "../CippComponents/CippUserAvatar";

// Resolve dot-delimited property paths against arbitrary data objects.
const getNestedValue = (source, path) => {
  if (!source) {
    return undefined;
  }
  if (!path) {
    return source;
  }

  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    if (typeof acc !== "object") {
      return undefined;
    }
    return acc[key];
  }, source);
};

// Resolve dot-delimited column ids against the original row data so nested fields can sort/filter properly.
const getRowValueByColumnId = (row, columnId) => {
  if (!row?.original || !columnId) {
    return undefined;
  }

  if (columnId.includes("@odata")) {
    return row.original[columnId];
  }

  return getNestedValue(row.original, columnId);
};

const compareNullable = (aVal, bVal) => {
  if (aVal === null && bVal === null) {
    return 0;
  }
  if (aVal === null) {
    return 1;
  }
  if (bVal === null) {
    return -1;
  }
  if (aVal === bVal) {
    return 0;
  }
  return aVal > bVal ? 1 : -1;
};

// Get initials from a name string
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Generate a consistent color from a string
const stringToColor = (string) => {
  if (!string) return "#757575";
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#1976d2", "#388e3c", "#d32f2f", "#7b1fa2", "#c2185b",
    "#0288d1", "#00796b", "#f57c00", "#5d4037", "#455a64",
  ];
  return colors[Math.abs(hash) % colors.length];
};

// Unified Card View Component (works for both mobile and desktop)
const CardView = ({
  data,
  config,
  onCardClick,
  isLoading,
  searchTerm,
  onSearchChange,
  onRefresh,
  title,
  isMobile = false,
  actions = [],
  tenant = null,
}) => {
  const theme = useTheme();

  const formatFieldValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "";
    }
    if (typeof value === "object") {
      if (value.displayName) return String(value.displayName);
      if (value.name) return String(value.name);
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Filter and sort data based on search term and custom sorting
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply search filter - search across all relevant fields
    if (searchTerm && result) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const titleValue = getNestedValue(item, config.title);
        const subtitleValue = getNestedValue(item, config.subtitle);
        
        // Search all string/number values in the item for comprehensive search
        const searchAllFields = () => {
          for (const [key, value] of Object.entries(item)) {
            if (typeof value === "string" && value.toLowerCase().includes(term)) {
              return true;
            }
            if (typeof value === "number" && String(value).includes(term)) {
              return true;
            }
          }
          return false;
        };
        
        return (
          (titleValue && String(titleValue).toLowerCase().includes(term)) ||
          (subtitleValue && String(subtitleValue).toLowerCase().includes(term)) ||
          searchAllFields()
        );
      });
    }
    
    // Apply custom sorting if provided
    if (config.sortFn && result) {
      result = [...result].sort(config.sortFn);
    }
    
    return result;
  }, [data, searchTerm, config]);

  // Filter actions for mobile - use mobileQuickActions if defined, otherwise first 4
  const cardActions = useMemo(() => {
    if (!actions || actions.length === 0) return [];
    
    if (isMobile && config.mobileQuickActions) {
      // Filter to only mobile-specific actions
      return actions.filter(a => 
        config.mobileQuickActions.includes(a.label) && 
        (!a.condition || a.condition)
      );
    }
    
    return actions;
  }, [actions, isMobile, config.mobileQuickActions]);

  // Render badge based on config
  const renderBadge = (badge, item, badgeIndex, isCompact = false) => {
    let fieldValue = getNestedValue(item, badge.field);
    
    // Apply transform function if provided
    if (badge.transform && typeof badge.transform === "function") {
      fieldValue = badge.transform(fieldValue, item);
    }
    
    let badgeConfig = null;

    if (badge.conditions) {
      const key =
        fieldValue === true
          ? "true"
          : fieldValue === false
          ? "false"
          : String(fieldValue);
      badgeConfig = badge.conditions[key] || badge.conditions[fieldValue];
    }

    if (!badgeConfig) return null;

    if (badgeConfig.icon === "check") {
      return (
        <Tooltip key={badgeIndex} title={badge.tooltip || getCippTranslation(badge.field)}>
          <CheckCircle
            sx={{
              fontSize: isCompact ? 20 : 22,
              color: badgeConfig.color === "success" ? "success.main" : 
                     badgeConfig.color === "error" ? "error.main" : "text.secondary",
            }}
          />
        </Tooltip>
      );
    } else if (badgeConfig.icon === "cancel") {
      return (
        <Tooltip key={badgeIndex} title={badge.tooltip || getCippTranslation(badge.field)}>
          <Cancel
            sx={{
              fontSize: isCompact ? 20 : 22,
              color: badgeConfig.color === "error" ? "error.main" : 
                     badgeConfig.color === "warning" ? "warning.main" : "text.secondary",
            }}
          />
        </Tooltip>
      );
    }

    return (
      <Chip
        key={badgeIndex}
        label={badgeConfig.label}
        icon={
          badgeConfig.icon && isValidElement(badgeConfig.icon) ? badgeConfig.icon : undefined
        }
        size="small"
        color={badgeConfig.color || "default"}
        sx={{ height: isCompact ? 22 : 24, fontSize: isCompact ? "0.7rem" : "0.75rem" }}
      />
    );
  };

  // Fixed card height for uniform appearance
  const CARD_HEIGHT = "auto";

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={isMobile ? 12 : 6} md={4} lg={3} key={i}>
              <Card sx={{ height: CARD_HEIGHT }}>
                <CardContent sx={{ height: "100%", p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={52} height={52} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={24} />
                      <Skeleton variant="text" width="90%" height={18} />
                    </Box>
                  </Stack>
                  {!isMobile && (
                    <Box sx={{ mt: 2 }}>
                      <Skeleton variant="text" width="100%" height={18} />
                      <Skeleton variant="text" width="80%" height={18} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Search and Refresh Bar */}
      <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder={`Search ${title || "items"}...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flex: 1, minWidth: 200, maxWidth: isMobile ? "100%" : 350 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
          {onRefresh && (
            <IconButton onClick={onRefresh} size="small" title="Refresh">
              <Refresh />
            </IconButton>
          )}
          <Typography variant="body2" color="text.secondary">
            {filteredData?.length || 0} {filteredData?.length === 1 ? "result" : "results"}
          </Typography>
        </Box>
      </Box>

      {/* Card Grid - Uniform sizing */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Grid container spacing={2}>
          {filteredData?.map((item, index) => {
            const titleValue = getNestedValue(item, config.title) || "Unknown";
            const subtitleValue = getNestedValue(item, config.subtitle);
            const avatarField = config.avatar?.field
              ? getNestedValue(item, config.avatar.field)
              : titleValue;

            // Get fields to display
            const desktopFields = !isMobile && config.desktopFields ? config.desktopFields : [];
            const extraFields = config.extraFields || [];
            
            // Check license status for visual indicator
            const isLicensed = item.assignedLicenses && item.assignedLicenses.length > 0;

            return (
              <Grid 
                item 
                xs={12} 
                sm={isMobile ? 12 : 6} 
                md={4} 
                lg={3}
                key={item.id || item.RowKey || index}
              >
                <Card
                  onClick={() => onCardClick(item, index)}
                  sx={{
                    height: CARD_HEIGHT,
                    width: "100%",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `4px solid ${isLicensed ? theme.palette.primary.main : theme.palette.grey[400]}`,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[8],
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                  }}
                >
                  <CardContent 
                    sx={{ 
                      p: 2, 
                      pb: "12px !important",
                      display: "flex", 
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header: Avatar + Name + Badges */}
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      {config.avatar?.photoField && tenant && item.id ? (
                        <CippUserAvatar
                          userId={item.id}
                          tenantFilter={tenant}
                          displayName={avatarField}
                          size={48}
                          enablePhoto={true}
                          sx={{ flexShrink: 0 }}
                        />
                      ) : (
                        <Avatar
                          sx={{
                            bgcolor: stringToColor(avatarField),
                            width: 48,
                            height: 48,
                            fontSize: "1rem",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(avatarField)}
                        </Avatar>
                      )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {titleValue}
                          </Typography>
                          {/* Compact badges */}
                          {config.badges?.map((badge, badgeIndex) => 
                            renderBadge(badge, item, badgeIndex, true)
                          )}
                        </Stack>

                        {subtitleValue && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            title={subtitleValue}
                            sx={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {subtitleValue}
                          </Typography>
                        )}
                      </Box>
                    </Stack>

                    {/* Info Section */}
                    <Box sx={{ overflow: "hidden" }}>
                      {/* Extra fields (job title, department) */}
                      {extraFields.length > 0 && (
                        <Stack spacing={0.25} sx={{ mb: 1 }}>
                          {extraFields.slice(0, 2).map((field, fieldIndex) => {
                            const rawValue = getNestedValue(item, field.field || field);
                            const value = formatFieldValue(rawValue);
                            if (!value) return null;
                            return (
                              <Stack 
                                key={fieldIndex} 
                                direction="row" 
                                spacing={0.5} 
                                alignItems="center"
                              >
                                {field.icon && (
                                  <SvgIcon sx={{ fontSize: 14, color: "text.secondary" }}>
                                    {field.icon}
                                  </SvgIcon>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  title={value}
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {value}
                                </Typography>
                              </Stack>
                            );
                          })}
                        </Stack>
                      )}

                      {/* Desktop-only additional info in compact grid */}
                      {!isMobile && desktopFields.length > 0 && (
                        <Box 
                          sx={{ 
                            mt: 0.5,
                            pt: 1, 
                            borderTop: `1px dashed ${theme.palette.divider}`,
                          }}
                        >
                          <Grid container spacing={0.5}>
                            {desktopFields.slice(0, 4).map((field, fieldIndex) => {
                              const rawValue = getNestedValue(item, field.field || field);
                              const value = formatFieldValue(rawValue);
                              if (!value) return null;
                              
                              return (
                                <Grid item xs={6} key={fieldIndex}>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    {field.icon && (
                                      <SvgIcon sx={{ fontSize: 12, color: "text.disabled" }}>
                                        {field.icon}
                                      </SvgIcon>
                                    )}
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      title={value}
                                      sx={{ 
                                        fontSize: "0.7rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {value}
                                    </Typography>
                                  </Stack>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}
                    </Box>

                    {/* Quick Actions - Always at bottom */}
                    {cardActions && cardActions.length > 0 && (
                      <Box
                        sx={{
                          pt: 1,
                          borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CippQuickActions
                          actions={cardActions}
                          data={item}
                          maxActions={isMobile ? 4 : 6}
                          showOnHover={false}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {filteredData?.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1">
              {searchTerm ? `No results found for "${searchTerm}"` : "No data available"}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Legacy wrapper for backward compatibility
const MobileCardView = (props) => <CardView {...props} isMobile={true} />;

export const CippDataTable = (props) => {
  const {
    queryKey,
    data = [],
    columns = [],
    api = {},
    isFetching = false,
    columnVisibility: initialColumnVisibility = {
      id: false,
      RowKey: false,
      ETag: false,
      PartitionKey: false,
      Timestamp: false,
      TableTimestamp: false,
    },
    exportEnabled = true,
    simpleColumns = [],
    actions,
    title = "Report",
    simple = false,
    cardButton,
    offCanvas = false,
    offCanvasOnRowClick = false,
    noCard = false,
    hideTitle = false,
    refreshFunction,
    incorrectDataMessage = "Data not in correct format",
    onChange,
    filters,
    maxHeightOffset = "380px",
    defaultSorting = [],
    isInDialog = false,
    showBulkExportAction = true,
    cardConfig = null, // Configuration for card view (renamed from mobileCardConfig)
    mobileCardConfig = null, // Deprecated: use cardConfig instead
    defaultViewMode = "cards", // Default view mode: 'cards' or 'table'
    onCardClick: customOnCardClick = null, // Custom handler for card clicks (bypasses off-canvas)
  } = props;
  const [columnVisibility, setColumnVisibility] = useState(initialColumnVisibility);
  const [configuredSimpleColumns, setConfiguredSimpleColumns] = useState(simpleColumns);
  const [usedData, setUsedData] = useState(data);
  const [usedColumns, setUsedColumns] = useState([]);
  const [offcanvasVisible, setOffcanvasVisible] = useState(false);
  const [offCanvasData, setOffCanvasData] = useState({});
  const [offCanvasRowIndex, setOffCanvasRowIndex] = useState(0);
  const [filteredRows, setFilteredRows] = useState([]);
  const [customComponentData, setCustomComponentData] = useState({});
  const [customComponentVisible, setCustomComponentVisible] = useState(false);
  const [actionData, setActionData] = useState({ data: {}, action: {}, ready: false });
  const [graphFilterData, setGraphFilterData] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [cardSearchTerm, setCardSearchTerm] = useState("");
  const [debouncedCardSearchTerm, setDebouncedCardSearchTerm] = useState("");
  const waitingBool = api?.url ? true : false;

  const settings = useSettings();
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Merge cardConfig and mobileCardConfig (cardConfig takes precedence)
  const effectiveCardConfig = cardConfig || mobileCardConfig;

  // Generate storage key for view mode preference
  const viewModeStorageKey = `cipp-view-mode-${router.pathname}`;

  // Initialize view mode from localStorage or default
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(viewModeStorageKey);
      if (stored === 'cards' || stored === 'table') {
        return stored;
      }
    }
    return defaultViewMode;
  });

  // Persist view mode to localStorage
  const handleViewModeChange = useCallback((newMode) => {
    if (newMode && (newMode === 'cards' || newMode === 'table')) {
      setViewMode(newMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem(viewModeStorageKey, newMode);
      }
    }
  }, [viewModeStorageKey]);

  // Debounce card search to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCardSearchTerm(cardSearchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [cardSearchTerm]);

  // Determine if we should show card view
  // On mobile: always show cards if config exists
  // On desktop: respect viewMode setting
  const showCardView = effectiveCardConfig && (isMobile || viewMode === 'cards');
  
  // Legacy alias for backward compatibility
  const showMobileCardView = isMobile && effectiveCardConfig;

  const getRequestData = ApiGetCallWithPagination({
    url: api.url,
    data: { ...api.data },
    queryKey: queryKey ? queryKey : title,
    waiting: waitingBool,
    ...graphFilterData,
  });

  useEffect(() => {
    if (filters && Array.isArray(filters) && filters.length > 0) {
      setColumnFilters(filters);
    }
  }, [filters]);

  useEffect(() => {
    if (Array.isArray(data) && !api?.url) {
      if (!isEqual(data, usedData)) {
        setUsedData(data);
      }
    }
  }, [data, api?.url, usedData]);

  useEffect(() => {
    if (getRequestData.isSuccess && !getRequestData.isFetching) {
      const lastPage = getRequestData.data?.pages[getRequestData.data.pages.length - 1];
      const nextLinkExists = lastPage?.Metadata?.nextLink;
      if (nextLinkExists) {
        getRequestData.fetchNextPage();
      }
    }
  }, [getRequestData.data?.pages?.length, getRequestData.isFetching, queryKey]);

  useEffect(() => {
    if (getRequestData.isSuccess) {
      const allPages = getRequestData.data.pages;

      const combinedResults = allPages.flatMap((page) => {
        const nestedData = getNestedValue(page, api.dataKey);
        return nestedData !== undefined ? nestedData : [];
      });
      setUsedData(combinedResults);
    }
  }, [
    getRequestData.isSuccess,
    getRequestData.data,
    api.dataKey,
    getRequestData.isFetching,
    queryKey,
  ]);
  useEffect(() => {
    if (
      !Array.isArray(usedData) ||
      usedData.length === 0 ||
      typeof usedData[0] !== "object" ||
      usedData === null ||
      usedData === undefined
    ) {
      return;
    }
    const apiColumns = utilColumnsFromAPI(usedData);
    let finalColumns = [];
    let newVisibility = { ...columnVisibility };

    // Check if we're in AllTenants mode and data has Tenant property
    const isAllTenants = settings?.currentTenant === "AllTenants";
    const hasTenantProperty = usedData.some(
      (row) => row && typeof row === "object" && "Tenant" in row
    );
    const shouldShowTenant = isAllTenants && hasTenantProperty;

    if (columns.length === 0 && configuredSimpleColumns.length === 0) {
      finalColumns = apiColumns;
      apiColumns.forEach((col) => {
        newVisibility[col.id] = true;
      });
    } else if (configuredSimpleColumns.length > 0) {
      // Resolve any variables in the simple columns before checking visibility
      const resolvedSimpleColumns = resolveSimpleColumnVariables(configuredSimpleColumns, usedData);

      // Add Tenant to resolved columns if in AllTenants mode and not already included
      let finalResolvedColumns = [...resolvedSimpleColumns];
      if (shouldShowTenant && !resolvedSimpleColumns.includes("Tenant")) {
        finalResolvedColumns = [...resolvedSimpleColumns, "Tenant"];
      }

      finalColumns = apiColumns;
      finalColumns.forEach((col) => {
        newVisibility[col.id] = finalResolvedColumns.includes(col.id);
      });
    } else {
      const providedColumnKeys = new Set(columns.map((col) => col.id || col.header));
      finalColumns = [...columns, ...apiColumns.filter((col) => !providedColumnKeys.has(col.id))];
      finalColumns.forEach((col) => {
        newVisibility[col.accessorKey] = providedColumnKeys.has(col.id);
      });

      // Handle Tenant column for custom columns case
      if (shouldShowTenant) {
        const tenantColumn = finalColumns.find((col) => col.id === "Tenant");
        if (tenantColumn) {
          // Make tenant visible
          newVisibility["Tenant"] = true;
        }
      }
    }
    if (defaultSorting?.length > 0) {
      setSorting(defaultSorting);
    }
    setUsedColumns(finalColumns);
    setColumnVisibility(newVisibility);
  }, [columns.length, usedData, queryKey, settings?.currentTenant]);

  const createDialog = useDialog();

  // Apply the modeInfo directly
  const [modeInfo] = useState(
    utilTableMode(
      columnVisibility,
      simple,
      actions,
      configuredSimpleColumns,
      offCanvas,
      onChange,
      maxHeightOffset
    )
  );
  //create memoized version of usedColumns, and usedData
  const memoizedColumns = useMemo(() => usedColumns, [usedColumns]);
  const memoizedData = useMemo(() => usedData, [usedData]);

  const handleActionDisabled = (row, action) => {
    if (action?.condition) {
      return !action.condition(row);
    }
    return false;
  };

  const table = useMaterialReactTable({
    // Mobile-responsive layout - use grid on mobile for better stacking
    layoutMode: isMobile ? 'grid' : 'semantic',
    // Enable density toggle so users can switch to compact on mobile
    enableDensityToggle: true,
    muiTableBodyCellProps: {
      onCopy: (e) => {
        const sel = window.getSelection()?.toString() ?? "";
        if (sel) {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
          e.clipboardData.setData("text/plain", sel);
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(sel).catch(() => {});
          }
        }
      },
      sx: {
        // Better touch targets on mobile
        ...(isMobile && {
          padding: '12px 8px',
          fontSize: '0.875rem',
        }),
      },
    },
    mrtTheme: (theme) => ({
      baseBackgroundColor: theme.palette.background.paper,
    }),
    muiTablePaperProps: ({ table }) => ({
      sx: {
        ...(table.getState().isFullScreen && {
          position: 'fixed !important',
          top: '64px !important',
          bottom: '0 !important',
          left: { xs: '0 !important', lg: settings?.sidebarCollapse ? '73px !important' : '270px !important' },
          right: '0 !important',
          zIndex: '1300 !important',
          m: '0 !important',
          p: '16px !important',
          overflow: 'auto',
          bgcolor: 'background.paper',
          maxWidth: 'none !important',
          width: 'auto !important',
          height: 'auto !important',
        }),
      },
    }),
    muiTableBodyRowProps:
      offCanvasOnRowClick && offCanvas
        ? ({ row }) => ({
            onClick: () => {
              setOffCanvasData(row.original);
              // Find the index of this row in the filtered rows
              const filteredRowsArray = table.getFilteredRowModel().rows;
              const indexInFiltered = filteredRowsArray.findIndex(
                (r) => r.original === row.original
              );
              setOffCanvasRowIndex(indexInFiltered >= 0 ? indexInFiltered : 0);
              setOffcanvasVisible(true);
            },
            sx: {
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            },
          })
        : undefined,
    // Add global styles to target the specific filter components
    enableColumnFilterModes: true,
    muiTableHeadCellProps: {
      sx: {
        // Target the filter row cells
        "& .MuiTableCell-root": {
          padding: "8px 16px",
        },
        // Target the Autocomplete component in filter cells
        "& .MuiAutocomplete-root": {
          width: "100%",
        },
        // Force the tags container to be single line with ellipsis
        "& .MuiAutocomplete-root .MuiInputBase-root": {
          height: "40px !important",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "flex",
          flexWrap: "nowrap",
        },
        // Target the tags container specifically
        "& .MuiAutocomplete-root .MuiInputBase-root .MuiInputBase-input": {
          height: "24px",
          minHeight: "24px",
          maxHeight: "24px",
        },
        // Target regular input fields (not in Autocomplete)
        "& .MuiInputBase-root": {
          height: "40px !important",
        },
        // Ensure all input fields have consistent styling
        "& .MuiInputBase-input": {
          height: "24px",
          minHeight: "24px",
          maxHeight: "24px",
        },
        // Target the specific chip class mentioned
        "& .MuiChip-label.MuiChip-labelMedium": {
          maxWidth: "80px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          padding: "0 4px",
        },
        // Make chips smaller overall and add title attribute for tooltip
        "& .MuiChip-root": {
          height: "24px",
          maxHeight: "24px",
          // This adds a tooltip effect using the browser's native tooltip
          "&::before": {
            content: "attr(data-label)",
            display: "none",
          },
          "&:hover::before": {
            display: "block",
            position: "absolute",
            top: "-25px",
            left: "0",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 9999,
          },
        },
      },
    },
    // Initialize the filter chips with data attributes for tooltips
    initialState: {
      columnFilters: columnFilters,
      columnVisibility: columnVisibility,
    },
    columns: memoizedColumns,
    data: memoizedData ?? [],
    state: {
      columnVisibility,
      sorting,
      columnFilters,
      showSkeletons: getRequestData.isFetchingNextPage
        ? false
        : getRequestData.isFetching
        ? getRequestData.isFetching
        : isFetching,
    },
    onSortingChange: (newSorting) => {
      setSorting(newSorting ?? []);
    },
    onColumnFiltersChange: setColumnFilters,
    renderEmptyRowsFallback: ({ table }) =>
      getRequestData.data?.pages?.[0].Metadata?.QueueMessage ? (
        <Box sx={{ py: 4 }}>
          <center>
            <Info /> {getRequestData.data?.pages?.[0].Metadata?.QueueMessage}
          </center>
        </Box>
      ) : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    ...modeInfo,
    renderRowActionMenuItems: actions
      ? ({ closeMenu, row }) => [
          actions.map((action, index) => (
            <MenuItem
              sx={{ color: action.color }}
              key={`actions-list-row-${index}`}
              onClick={() => {
                if (settings.currentTenant === "AllTenants" && row.original?.Tenant) {
                  settings.handleUpdate({
                    currentTenant: row.original.Tenant,
                  });
                }

                if (action.noConfirm && action.customFunction) {
                  action.customFunction(row.original, action, {});
                  closeMenu();
                  return;
                }

                // Handle custom component differently
                if (typeof action.customComponent === "function") {
                  setCustomComponentData({ data: row.original, action: action });
                  setCustomComponentVisible(true);
                  closeMenu();
                  return;
                }

                // Standard dialog flow
                setActionData({
                  data: row.original,
                  action: action,
                  ready: true,
                });
                createDialog.handleOpen();
                closeMenu();
              }}
              disabled={handleActionDisabled(row.original, action)}
            >
              <SvgIcon fontSize="small" sx={{ minWidth: "30px" }}>
                {action.icon}
              </SvgIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          )),
          offCanvas && (
            <MenuItem
              key={`actions-list-row-more`}
              onClick={() => {
                closeMenu();
                setOffCanvasData(row.original);
                // Find the index of this row in the filtered rows
                const filteredRowsArray = table.getFilteredRowModel().rows;
                const indexInFiltered = filteredRowsArray.findIndex(
                  (r) => r.original === row.original
                );
                setOffCanvasRowIndex(indexInFiltered >= 0 ? indexInFiltered : 0);
                setOffcanvasVisible(true);
              }}
            >
              <SvgIcon fontSize="small" sx={{ minWidth: "30px" }}>
                <MoreHoriz />
              </SvgIcon>
              More Info
            </MenuItem>
          ),
        ]
      : offCanvas && (
          <MenuItem
            onClick={() => {
              closeMenu();
              setOffCanvasData(row.original);
              // Find the index of this row in the filtered rows
              const filteredRowsArray = table.getFilteredRowModel().rows;
              const indexInFiltered = filteredRowsArray.findIndex(
                (r) => r.original === row.original
              );
              setOffCanvasRowIndex(indexInFiltered >= 0 ? indexInFiltered : 0);
              setOffcanvasVisible(true);
            }}
          >
            <ListItemIcon>
              <More fontSize="small" />
            </ListItemIcon>
            More Info
          </MenuItem>
        ),
    renderTopToolbar: ({ table }) => {
      return (
        <>
          {!simple && (
            <CIPPTableToptoolbar
              table={table}
              api={api}
              queryKey={queryKey}
              simpleColumns={simpleColumns}
              data={data}
              columnVisibility={columnVisibility}
              getRequestData={getRequestData}
              usedColumns={memoizedColumns}
              usedData={memoizedData ?? []}
              title={title}
              actions={actions}
              exportEnabled={exportEnabled}
              refreshFunction={refreshFunction}
              setColumnVisibility={setColumnVisibility}
              filters={filters}
              queryKeys={queryKey ? queryKey : title}
              graphFilterData={graphFilterData}
              setGraphFilterData={setGraphFilterData}
              setConfiguredSimpleColumns={setConfiguredSimpleColumns}
              queueMetadata={getRequestData.data?.pages?.[0]?.Metadata}
              isInDialog={isInDialog}
              showBulkExportAction={showBulkExportAction}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              cardConfigAvailable={!!effectiveCardConfig}
            />
          )}
        </>
      );
    },
    sortingFns: {
      dateTimeNullsLast: (a, b, id) => {
        const aRaw = getRowValueByColumnId(a, id);
        const bRaw = getRowValueByColumnId(b, id);
        const aDate = aRaw ? new Date(aRaw) : null;
        const bDate = bRaw ? new Date(bRaw) : null;
        const aTime = aDate && !Number.isNaN(aDate.getTime()) ? aDate.getTime() : null;
        const bTime = bDate && !Number.isNaN(bDate.getTime()) ? bDate.getTime() : null;

        return compareNullable(aTime, bTime);
      },
      number: (a, b, id) => {
        const aRaw = getRowValueByColumnId(a, id);
        const bRaw = getRowValueByColumnId(b, id);
        const aNum = typeof aRaw === "number" ? aRaw : Number(aRaw);
        const bNum = typeof bRaw === "number" ? bRaw : Number(bRaw);
        const aVal = Number.isNaN(aNum) ? null : aNum;
        const bVal = Number.isNaN(bNum) ? null : bNum;

        return compareNullable(aVal, bVal);
      },
      boolean: (a, b, id) => {
        const aRaw = getRowValueByColumnId(a, id);
        const bRaw = getRowValueByColumnId(b, id);
        const toBool = (value) => {
          if (value === null || value === undefined) {
            return null;
          }
          if (typeof value === "boolean") {
            return value;
          }
          if (typeof value === "string") {
            const lower = value.toLowerCase();
            if (lower === "true" || lower === "yes") {
              return true;
            }
            if (lower === "false" || lower === "no") {
              return false;
            }
          }
          if (typeof value === "number") {
            return value !== 0;
          }
          return null;
        };

        const aBool = toBool(aRaw);
        const bBool = toBool(bRaw);
        const aNumeric = aBool === null ? null : aBool ? 1 : 0;
        const bNumeric = bBool === null ? null : bBool ? 1 : 0;

        return compareNullable(aNumeric, bNumeric);
      },
    },
    filterFns: {
      notContains: (row, columnId, value) => {
        const rowValue = row.getValue(columnId);
        if (rowValue === null || rowValue === undefined) {
          return false;
        }

        const stringValue = String(rowValue);
        if (
          stringValue.includes("[object Object]") ||
          !stringValue.toLowerCase().includes(value.toLowerCase())
        ) {
          return true;
        } else {
          return false;
        }
      },
      regex: (row, columnId, value) => {
        try {
          const regex = new RegExp(value, "i");
          const rowValue = row.getValue(columnId);
          if (typeof rowValue === "string" && !rowValue.includes("[object Object]")) {
            return regex.test(rowValue);
          }
          return false;
        } catch (error) {
          // If regex is invalid, don't filter
          return true;
        }
      },
    },
    globalFilterFn: "contains",
    enableGlobalFilterModes: true,
    renderGlobalFilterModeMenuItems: ({ internalFilterOptions, onSelectFilterMode }) => {
      // add custom filter options
      const customFilterOptions = [
        {
          option: "regex",
          label: "Regex",
          symbol: "(.*)",
        },
      ];

      // add to the internalFilterOptions if not already present
      customFilterOptions.forEach((filterOption) => {
        if (!internalFilterOptions.some((option) => option.option === filterOption.option)) {
          internalFilterOptions.push(filterOption);
        }
      });

      internalFilterOptions.map((filterOption) => (
        <MenuItem
          key={filterOption.option}
          onClick={() => onSelectFilterMode(filterOption.option)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ width: "20px", textAlign: "center" }}>{filterOption.symbol}</span>
          <ListItemText>{filterOption.label}</ListItemText>
        </MenuItem>
      ));
    },
    renderColumnFilterModeMenuItems: ({ internalFilterOptions, onSelectFilterMode }) => {
      // add custom filter options
      const customFilterOptions = [
        {
          option: "notContains",
          label: "Not Contains",
          symbol: "!*",
        },
        {
          option: "regex",
          label: "Regex",
          symbol: "(.*)",
        },
      ];

      // combine default and custom filter options
      const combinedFilterOptions = [...internalFilterOptions, ...customFilterOptions];

      return combinedFilterOptions.map((filterOption) => (
        <MenuItem
          key={filterOption.option}
          onClick={() => onSelectFilterMode(filterOption.option)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ width: "20px", textAlign: "center" }}>{filterOption.symbol}</span>
          <ListItemText>{filterOption.label}</ListItemText>
        </MenuItem>
      ));
    },
  });

  useEffect(() => {
    if (filters && Array.isArray(filters) && filters.length > 0 && memoizedColumns.length > 0) {
      // Make sure the table and columns are ready
      setTimeout(() => {
        if (table && typeof table.setColumnFilters === "function") {
          const formattedFilters = filters.map((filter) => ({
            id: filter.id || filter.columnId,
            value: filter.value,
          }));
          table.setColumnFilters(formattedFilters);
        }
      });
    }
  }, [filters, memoizedColumns, table]);

  useEffect(() => {
    if (onChange && table.getSelectedRowModel().rows) {
      onChange(table.getSelectedRowModel().rows.map((row) => row.original));
    }
  }, [table.getSelectedRowModel().rows]);

  useEffect(() => {
    // Update filtered rows whenever table filtering/sorting changes
    if (table && table.getFilteredRowModel) {
      const rows = table.getFilteredRowModel().rows;
      setFilteredRows(rows.map((row) => row.original));
    }
  }, [
    table,
    table.getState().columnFilters,
    table.getState().globalFilter,
    table.getState().sorting,
  ]);

  useEffect(() => {
    //check if the simplecolumns are an array,
    if (Array.isArray(simpleColumns) && simpleColumns.length > 0) {
      setConfiguredSimpleColumns(simpleColumns);
    }
  }, [simpleColumns]);

  // Handle card click for card view
  const handleCardClick = (item, index) => {
    // If custom handler provided, use it instead of opening off-canvas
    if (customOnCardClick) {
      customOnCardClick(item, index);
      return;
    }
    setOffCanvasData(item);
    setOffCanvasRowIndex(index);
    setOffcanvasVisible(true);
  };

  // Render the standalone toolbar for card view (not embedded in table)
  const renderStandaloneToolbar = () => {
    if (simple) return null;
    return (
      <CIPPTableToptoolbar
        table={null}
        api={api}
        queryKey={queryKey}
        simpleColumns={simpleColumns}
        data={data}
        columnVisibility={columnVisibility}
        getRequestData={getRequestData}
        usedColumns={memoizedColumns}
        usedData={memoizedData ?? []}
        title={title}
        actions={actions}
        exportEnabled={exportEnabled}
        refreshFunction={refreshFunction}
        setColumnVisibility={setColumnVisibility}
        filters={filters}
        queryKeys={queryKey ? queryKey : title}
        graphFilterData={graphFilterData}
        setGraphFilterData={setGraphFilterData}
        setConfiguredSimpleColumns={setConfiguredSimpleColumns}
        queueMetadata={getRequestData.data?.pages?.[0]?.Metadata}
        isInDialog={isInDialog}
        showBulkExportAction={showBulkExportAction}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        cardConfigAvailable={!!effectiveCardConfig}
        isCardView={true}
      />
    );
  };

  return (
    <>
      {/* Card View (mobile or desktop when card mode selected) */}
      {showCardView ? (
        <Card style={{ width: "100%" }} {...props.cardProps}>
          {cardButton || !hideTitle ? (
            <>
              <CardHeader
                action={cardButton}
                title={hideTitle ? "" : title}
                {...props.cardHeaderProps}
              />
              <Divider />
            </>
          ) : null}
          {/* Standalone toolbar for card view on desktop */}
          {!isMobile && (
            <Box sx={{ px: 2, pt: 2 }}>
              {renderStandaloneToolbar()}
            </Box>
          )}
          {getRequestData.isError && !getRequestData.isFetchNextPageError ? (
            <CardContent>
              <ResourceError
                onReload={() => getRequestData.refetch()}
                message={`Error Loading data: ${getCippError(getRequestData.error)}`}
              />
            </CardContent>
          ) : (
            <CardView
              data={usedData}
              config={effectiveCardConfig}
              onCardClick={handleCardClick}
              isLoading={getRequestData.isFetching || isFetching}
              searchTerm={debouncedCardSearchTerm}
              onSearchChange={setCardSearchTerm}
              onRefresh={refreshFunction || (api?.url ? () => getRequestData.refetch() : null)}
              title={title}
              isMobile={isMobile}
              actions={actions}
              tenant={settings?.currentTenant}
            />
          )}
        </Card>
      ) : noCard ? (
        <Scrollbar>
          {!Array.isArray(usedData) && usedData ? (
            <ResourceUnavailable message={incorrectDataMessage} />
          ) : (
            <>
              {(getRequestData.isSuccess || getRequestData.data?.pages.length >= 0 || data) && (
                <MaterialReactTable table={table} />
              )}
            </>
          )}
          {getRequestData.isError && !getRequestData.isFetchNextPageError && (
            <ResourceError
              onReload={() => getRequestData.refetch()}
              message={`Error Loading data:  ${getCippError(getRequestData.error)}`}
            />
          )}
        </Scrollbar>
      ) : (
        // Render the table inside a Card
        <Card style={{ width: "100%" }} {...props.cardProps}>
          {cardButton || !hideTitle ? (
            <>
              <CardHeader
                action={cardButton}
                title={hideTitle ? "" : title}
                {...props.cardHeaderProps}
              />
              <Divider />
            </>
          ) : null}
          <CardContent sx={{ padding: "1rem" }}>
            <Scrollbar>
              {!Array.isArray(usedData) && usedData ? (
                <ResourceUnavailable message={incorrectDataMessage} />
              ) : (
                <>
                  {(getRequestData.isSuccess ||
                    getRequestData.data?.pages.length >= 0 ||
                    (data && !getRequestData.isError)) && (
                    <MaterialReactTable
                      enableRowVirtualization
                      enableColumnVirtualization
                      table={table}
                    />
                  )}
                </>
              )}
              {getRequestData.isError && !getRequestData.isFetchNextPageError && (
                <ResourceError
                  onReload={() => getRequestData.refetch()}
                  message={`Error Loading data:  ${getCippError(getRequestData.error)}`}
                />
              )}
            </Scrollbar>
          </CardContent>
        </Card>
      )}
      <CippOffCanvas
        isFetching={getRequestData.isFetching}
        visible={offcanvasVisible}
        onClose={() => setOffcanvasVisible(false)}
        extendedData={offCanvasData}
        extendedInfoFields={offCanvas?.extendedInfoFields}
        actions={actions}
        title={offCanvasData?.Name || offCanvas?.title || "Extended Info"}
        children={
          offCanvas?.children ? (row) => offCanvas.children(row, offCanvasRowIndex) : undefined
        }
        customComponent={offCanvas?.customComponent}
        onNavigateUp={() => {
          const newIndex = offCanvasRowIndex - 1;
          if (newIndex >= 0 && filteredRows && filteredRows[newIndex]) {
            setOffCanvasRowIndex(newIndex);
            setOffCanvasData(filteredRows[newIndex]);
          }
        }}
        onNavigateDown={() => {
          const newIndex = offCanvasRowIndex + 1;
          if (filteredRows && newIndex < filteredRows.length) {
            setOffCanvasRowIndex(newIndex);
            setOffCanvasData(filteredRows[newIndex]);
          }
        }}
        canNavigateUp={offCanvasRowIndex > 0}
        canNavigateDown={filteredRows && offCanvasRowIndex < filteredRows.length - 1}
        {...offCanvas}
      />
      {/* Render custom component */}
      {customComponentVisible &&
        customComponentData?.action &&
        typeof customComponentData.action.customComponent === "function" &&
        customComponentData.action.customComponent(customComponentData.data, {
          drawerVisible: customComponentVisible,
          setDrawerVisible: setCustomComponentVisible,
          fromRowAction: true,
        })}

      {/* Render standard dialog */}
      {useMemo(() => {
        if (
          !actionData.ready ||
          (actionData.action && typeof actionData.action.customComponent === "function")
        )
          return null;
        return (
          <CippApiDialog
            createDialog={createDialog}
            title="Confirmation"
            fields={actionData.action?.fields}
            api={actionData.action}
            row={actionData.data}
            relatedQueryKeys={queryKey ? queryKey : title}
            {...actionData.action}
          />
        );
      }, [actionData.ready, createDialog, actionData.action, actionData.data, queryKey, title])}
    </>
  );
};
