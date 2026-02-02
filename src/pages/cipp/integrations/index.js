import { Layout as DashboardLayout } from "../../../layouts/index.js";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Skeleton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import extensions from "../../../data/Extensions";
import { Sync, Search, CheckCircle, Cancel, Settings } from "@mui/icons-material";
import { useSettings } from "../../../hooks/use-settings";
import { ApiGetCall } from "../../../api/ApiCall";
import Link from "next/link";
import { CippHead } from "../../../components/CippComponents/CippHead";
import { CippInfoBar } from "../../../components/CippCards/CippInfoBar";
import {
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useState, useMemo } from "react";

const Page = () => {
  const settings = useSettings();
  const preferredTheme = settings.currentTheme?.value;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const integrations = ApiGetCall({
    url: "/api/ListExtensionsConfig",
    queryKey: "Integrations",
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!integrations.isSuccess) return { enabled: 0, disabled: 0, unconfigured: 0, total: 0 };

    let enabled = 0;
    let disabled = 0;
    let unconfigured = 0;

    extensions.forEach((ext) => {
      const config = integrations.data?.[ext.id];
      const isEnabled = config?.Enabled || ext.id === "cippapi";

      if (config && isEnabled) {
        enabled++;
      } else if (config && !isEnabled) {
        disabled++;
      } else {
        unconfigured++;
      }
    });

    return { enabled, disabled, unconfigured, total: extensions.length };
  }, [integrations.isSuccess, integrations.data]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(extensions.map((ext) => ext.cat))];
    return cats.sort();
  }, []);

  // Filter extensions
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          ext.name.toLowerCase().includes(search) ||
          ext.description.toLowerCase().includes(search) ||
          ext.cat.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filterCategory !== "all" && ext.cat !== filterCategory) {
        return false;
      }

      // Status filter
      if (filterStatus !== "all" && integrations.isSuccess) {
        const config = integrations.data?.[ext.id];
        const isEnabled = config?.Enabled || ext.id === "cippapi";
        const status =
          config && isEnabled ? "enabled" : config && !isEnabled ? "disabled" : "unconfigured";
        if (filterStatus !== status) return false;
      }

      return true;
    });
  }, [searchTerm, filterCategory, filterStatus, integrations.isSuccess, integrations.data]);

  // Group extensions by category
  const groupedExtensions = useMemo(() => {
    const groups = {};
    filteredExtensions.forEach((ext) => {
      if (!groups[ext.cat]) {
        groups[ext.cat] = [];
      }
      groups[ext.cat].push(ext);
    });
    return groups;
  }, [filteredExtensions]);

  const infoBarData = [
    {
      name: "Total Integrations",
      data: stats.total,
      icon: <LinkIcon />,
      color: "primary",
    },
    {
      name: "Enabled",
      data: stats.enabled,
      icon: <CheckCircleIcon />,
      color: "success",
    },
    {
      name: "Disabled",
      data: stats.disabled,
      icon: <XCircleIcon />,
      color: "warning",
    },
    {
      name: "Not Configured",
      data: stats.unconfigured,
      icon: <CogIcon />,
      color: "default",
    },
  ];

  const getStatusInfo = (extension) => {
    const config = integrations.data?.[extension.id];
    const isEnabled = config?.Enabled || extension.id === "cippapi";

    if (config && isEnabled) {
      return { status: "Enabled", color: "success", icon: <CheckCircle fontSize="small" /> };
    } else if (config && !isEnabled) {
      return { status: "Disabled", color: "warning", icon: <Cancel fontSize="small" /> };
    }
    return { status: "Not Configured", color: "default", icon: <Settings fontSize="small" /> };
  };

  return (
    <Container maxWidth={"xl"}>
      <CippHead title="Integrations" noTenant={true} />

      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Typography variant="h4">Integrations</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Sync />}
            LinkComponent={Link}
            href="/cipp/integrations/sync"
          >
            Sync Jobs
          </Button>
        </Stack>

        {/* Status Summary */}
        <CippInfoBar data={infoBarData} isFetching={integrations.isFetching} />

        {/* Filters */}
        <Card variant="outlined">
          <CardContent sx={{ py: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                size="small"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  Status:
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={filterStatus}
                  exclusive
                  onChange={(e, value) => value && setFilterStatus(value)}
                >
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="enabled">Enabled</ToggleButton>
                  <ToggleButton value="disabled">Disabled</ToggleButton>
                  <ToggleButton value="unconfigured">Not Configured</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  Category:
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={filterCategory}
                  exclusive
                  onChange={(e, value) => value && setFilterCategory(value)}
                  sx={{ flexWrap: "wrap" }}
                >
                  <ToggleButton value="all">All</ToggleButton>
                  {categories.map((cat) => (
                    <ToggleButton key={cat} value={cat}>
                      {cat}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* No results */}
        {filteredExtensions.length === 0 && (
          <Alert severity="info">
            No integrations found matching your filters. Try adjusting your search or filter criteria.
          </Alert>
        )}

        {/* Integration Cards by Category */}
        {Object.entries(groupedExtensions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryExtensions]) => (
            <Box key={category}>
              <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>
                {category}
                <Chip
                  label={categoryExtensions.length}
                  size="small"
                  sx={{ ml: 1 }}
                  color="default"
                />
              </Typography>
              <Grid container spacing={2}>
                {categoryExtensions.map((extension) => {
                  let logo = extension.logo;
                  if (preferredTheme === "dark" && extension?.logoDark) {
                    logo = extension.logoDark;
                  }

                  const statusInfo = integrations.isSuccess
                    ? getStatusInfo(extension)
                    : { status: "Loading", color: "default", icon: null };

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }} key={extension.id}>
                      <CardActionArea
                        component={Link}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                        href={`/cipp/integrations/configure?id=${extension.id}`}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%",
                            transition: "all 0.2s",
                            borderColor:
                              statusInfo.status === "Enabled" ? "success.main" : "divider",
                            borderWidth: statusInfo.status === "Enabled" ? 2 : 1,
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: 2,
                            },
                          }}
                        >
                          <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {/* Logo */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: 80,
                                mb: 2,
                              }}
                            >
                              {extension?.logo ? (
                                <Box
                                  component="img"
                                  src={logo}
                                  alt={extension.name}
                                  sx={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              ) : (
                                <Typography variant="h5" color="text.secondary">
                                  {extension.name}
                                </Typography>
                              )}
                            </Box>

                            {/* Description */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                flex: 1,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {extension.description}
                            </Typography>

                            {/* Status */}
                            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                {integrations.isSuccess ? (
                                  <Chip
                                    label={statusInfo.status}
                                    size="small"
                                    color={statusInfo.color}
                                    variant={statusInfo.status === "Enabled" ? "filled" : "outlined"}
                                    icon={statusInfo.icon}
                                  />
                                ) : (
                                  <Skeleton variant="rounded" width={80} height={24} />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {extension.cat}
                                </Typography>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      </CardActionArea>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
      </Stack>
    </Container>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
