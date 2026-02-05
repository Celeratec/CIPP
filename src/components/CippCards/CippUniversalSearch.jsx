import React, { useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
  Alert,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Grid } from "@mui/system";
import { ApiGetCall } from "../../api/ApiCall";

export const CippUniversalSearch = React.forwardRef(
  ({ onConfirm = () => {}, onChange = () => {}, maxResults = 7, value = "" }, ref) => {
    const [searchValue, setSearchValue] = useState(value);
    const handleChange = (event) => {
      const newValue = event.target.value;
      setSearchValue(newValue);
      onChange(newValue);
    };

    const search = ApiGetCall({
      url: `/api/ExecUniversalSearch?name=${searchValue}`,
      queryKey: `search-${searchValue}`,
      waiting: false,
    });
    const handleKeyDown = async (event) => {
      if (event.key === "Enter") {
        search.refetch();
      }
    };

    return (
      <Box sx={{ p: 0.5 }}>
        <TextField
          ref={ref}
          fullWidth
          size="small"
          type="text"
          label="Search users in any tenant by UPN or Display Name"
          placeholder="Press Enter to search..."
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={searchValue}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {search.isFetching ? (
                  <CircularProgress size={18} />
                ) : (
                  <SearchIcon fontSize="small" color="action" />
                )}
              </InputAdornment>
            ),
          }}
        />

        {search.isFetching && (
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Typography variant="caption" color="text.secondary">
              Searching across all tenants...
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
        {search.isSuccess && search?.data?.length > 0 ? (
          <Results items={search.data} searchValue={searchValue} />
        ) : (
          search.isSuccess && !search.isFetching && (
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

const Results = ({ items = [], searchValue }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6; // Number of results per page
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
          <Grid size={{ lg: 4, md: 6, xs: 12 }} key={key}>
            <ResultsRow match={item} searchValue={searchValue} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ResultsRow = ({ match, searchValue }) => {
  const highlightMatch = (text) => {
    if (!text || !searchValue) return text;
    try {
      const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escapedSearch})`, "gi"));
      return parts.map((part, index) =>
        part.toLowerCase() === searchValue.toLowerCase() ? (
          <Typography component="span" fontWeight="bold" key={index} sx={{ color: "primary.main" }}>
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

  const currentTenantInfo = ApiGetCall({
    url: "/api/ListTenants",
    queryKey: `ListTenants`,
  });

  const tenantDomain = currentTenantInfo.data?.find(
    (tenant) => tenant.customerId === match._tenantId
  )?.defaultDomainName || match._tenantId;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: "100%",
        "&:hover": { 
          borderColor: "primary.main",
          boxShadow: 1
        }
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography 
          variant="subtitle2" 
          fontWeight={600}
          sx={{ 
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
          title={match.displayName}
        >
          {highlightMatch(match.displayName)}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mb: 0.5
          }}
          title={match.userPrincipalName}
        >
          {highlightMatch(match.userPrincipalName)}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mb: 1
          }}
          title={tenantDomain}
        >
          Tenant: {tenantDomain}
        </Typography>
        <Box display="flex" gap={0.5}>
          <Button
            component={Link}
            href={`identity/administration/users/user?tenantFilter=${tenantDomain}&userId=${match.id}`}
            variant="contained"
            color="primary"
            size="small"
            sx={{ 
              flex: 1,
              fontSize: "0.7rem",
              py: 0.5,
              textTransform: "none"
            }}
          >
            View User
          </Button>
          <Button
            component={Link}
            href={`identity/administration/users?tenantFilter=${tenantDomain}`}
            variant="outlined"
            color="primary"
            size="small"
            sx={{ 
              flex: 1,
              fontSize: "0.7rem",
              py: 0.5,
              textTransform: "none"
            }}
          >
            View Tenant
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
