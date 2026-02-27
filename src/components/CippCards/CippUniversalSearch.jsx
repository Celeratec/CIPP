import React, { useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { Grid } from "@mui/system";
import { ApiGetCall } from "../../api/ApiCall";
import { useSettings } from "../../hooks/use-settings";

export const CippUniversalSearch = React.forwardRef(
  ({ onConfirm = () => {}, onChange = () => {}, maxResults = 10, value = "" }, ref) => {
    const [searchValue, setSearchValue] = useState(value);
    const [searchType, setSearchType] = useState("Users");
    const [searchScope, setSearchScope] = useState("currentTenant");
    const { currentTenant } = useSettings();

    const handleChange = (event) => {
      const newValue = event.target.value;
      setSearchValue(newValue);
      onChange(newValue);
    };

    const searchData = {
      searchTerms: searchValue,
      limit: maxResults,
      type: searchType,
    };
    if (searchScope === "currentTenant" && currentTenant) {
      searchData.tenantFilter = currentTenant;
    }

    const search = ApiGetCall({
      url: "/api/ExecUniversalSearchV2",
      data: searchData,
      queryKey: `searchV2-${searchType}-${searchScope}-${searchScope === "currentTenant" ? currentTenant : "all"}-${searchValue}`,
      waiting: false,
    });

    const handleKeyDown = (event) => {
      if (event.key === "Enter" && searchValue.length > 0) {
        search.refetch();
      }
    };

    const handleSearch = () => {
      if (searchValue.length > 0) {
        search.refetch();
      }
    };

    const handleTypeChange = (_event, newType) => {
      if (newType !== null) {
        setSearchType(newType);
      }
    };

    const handleScopeChange = (_event, newScope) => {
      if (newScope !== null) {
        setSearchScope(newScope);
      }
    };

    const label =
      searchType === "Users"
        ? "Search users by UPN or Display Name"
        : "Search groups by Display Name";

    return (
      <Box sx={{ p: 0.5 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <ToggleButtonGroup
            value={searchType}
            exclusive
            onChange={handleTypeChange}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="Users" sx={{ px: 1.5, textTransform: "none", gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 18 }} />
              Users
            </ToggleButton>
            <ToggleButton value="Groups" sx={{ px: 1.5, textTransform: "none", gap: 0.5 }}>
              <GroupIcon sx={{ fontSize: 18 }} />
              Groups
            </ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={searchScope}
            exclusive
            onChange={handleScopeChange}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="currentTenant" sx={{ px: 1.5, textTransform: "none", gap: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 18 }} />
              Current Tenant
            </ToggleButton>
            <ToggleButton value="allTenants" sx={{ px: 1.5, textTransform: "none", gap: 0.5 }}>
              <LanguageIcon sx={{ fontSize: 18 }} />
              All Tenants
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            ref={ref}
            fullWidth
            size="small"
            type="text"
            label={label}
            placeholder="Press Enter to search..."
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            value={searchValue}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                      }}
                    >
                      {search.isFetching ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SearchIcon fontSize="small" color="action" />
                      )}
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searchValue.length === 0 || search.isFetching}
            size="small"
            sx={{ flexShrink: 0, textTransform: "none", minWidth: "auto", px: 2 }}
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </Button>
        </Box>

        {search.isFetching && (
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Typography variant="caption" color="text.secondary">
              {searchScope === "currentTenant"
                ? `Searching ${currentTenant}...`
                : "Searching across all tenants..."}
            </Typography>
          </Box>
        )}
        {search.isError && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
            <Typography variant="caption">
              Search failed. This feature requires Lighthouse onboarding to be configured.
            </Typography>
          </Alert>
        )}
        {search.isSuccess && Array.isArray(search.data) && search.data.length > 0 ? (
          <Results items={search.data} searchValue={searchValue} searchType={searchType} />
        ) : (
          search.isSuccess &&
          !search.isFetching && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              No results found.
            </Typography>
          )
        )}
      </Box>
    );
  }
);

CippUniversalSearch.displayName = "CippUniversalSearch";

const Results = ({ items = [], searchValue, searchType }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;
  const totalResults = items.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const displayedResults = items.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          {totalResults} result{totalResults !== 1 ? "s" : ""} found
        </Typography>
        {totalPages > 1 && (
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="text"
              size="small"
              disabled={currentPage === 1}
              onClick={handlePreviousPage}
              sx={{ minWidth: "auto", px: 1 }}
            >
              Prev
            </Button>
            <Typography variant="caption" color="text.secondary">
              {currentPage}/{totalPages}
            </Typography>
            <Button
              variant="text"
              size="small"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              sx={{ minWidth: "auto", px: 1 }}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>
      <Grid container spacing={1}>
        {displayedResults.map((item, key) => (
          <Grid size={{ lg: 4, md: 6, xs: 12 }} key={item.RowKey || key}>
            <ResultCard match={item} searchValue={searchValue} searchType={searchType} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const highlightMatch = (text, searchValue) => {
  if (!text || !searchValue) return text;
  try {
    const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedSearch})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchValue.toLowerCase() ? (
        <Typography
          component="span"
          fontWeight="bold"
          key={index}
          sx={{ color: "primary.main" }}
        >
          {part}
        </Typography>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
};

const ResultCard = ({ match, searchValue, searchType }) => {
  const itemData = match.Data || {};
  const tenantDomain = match.Tenant || "";

  const isUser = searchType === "Users";
  const displayName = itemData.displayName || "";
  const subtitle = isUser ? itemData.userPrincipalName : itemData.mail;
  const detailUrl = isUser
    ? `identity/administration/users/user?tenantFilter=${tenantDomain}&userId=${itemData.id}`
    : `identity/administration/groups/group?groupId=${itemData.id}&tenantFilter=${tenantDomain}`;
  const tenantUrl = isUser
    ? `identity/administration/users?tenantFilter=${tenantDomain}`
    : `identity/administration/groups?tenantFilter=${tenantDomain}`;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: 1,
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
          {isUser ? (
            <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          ) : (
            <GroupIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
            title={displayName}
          >
            {highlightMatch(displayName, searchValue)}
          </Typography>
        </Box>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mb: 0.5,
            }}
            title={subtitle}
          >
            {highlightMatch(subtitle, searchValue)}
          </Typography>
        )}
        {!isUser && itemData.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mb: 0.5,
            }}
            title={itemData.description}
          >
            {highlightMatch(itemData.description, searchValue)}
          </Typography>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mb: 1,
          }}
          title={tenantDomain}
        >
          Tenant: {tenantDomain}
        </Typography>
        <Box display="flex" gap={0.5}>
          <Button
            component={Link}
            href={detailUrl}
            variant="contained"
            color="primary"
            size="small"
            sx={{
              flex: 1,
              fontSize: "0.7rem",
              py: 0.5,
              textTransform: "none",
            }}
          >
            {isUser ? "View User" : "View Group"}
          </Button>
          <Button
            component={Link}
            href={tenantUrl}
            variant="outlined"
            color="primary"
            size="small"
            sx={{
              flex: 1,
              fontSize: "0.7rem",
              py: 0.5,
              textTransform: "none",
            }}
          >
            View Tenant
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
