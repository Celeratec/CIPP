import { Box, Card, CardHeader, CardContent, Typography, Divider, Skeleton, LinearProgress, Tooltip } from "@mui/material";
import { CardMembership as CardMembershipIcon } from "@mui/icons-material";

export const LicenseCard = ({ data, isLoading, compact = false }) => {
  const titleVariant = compact ? "subtitle1" : "h6";
  const listTextVariant = compact ? "caption" : "body2";
  const listTitleVariant = compact ? "subtitle2" : "subtitle1";
  const statValueVariant = compact ? "h5" : "h4";

  const getLicenseName = (license) =>
    license?.License || license?.skuPartNumber || license?.SkuPartNumber || "Unknown License";

  const getTotalLicenses = (license) => parseInt(license?.TotalLicenses || 0) || 0;

  const isTrialOrFreeLicense = (license) => {
    const termInfoArray = Array.isArray(license?.TermInfo) ? license.TermInfo : [];
    const name = getLicenseName(license);
    const nameLower = name.toLowerCase();
    const isTrial = termInfoArray.some((term) => term?.IsTrial === true) || nameLower.includes("trial");
    const isFree = nameLower.includes("free");
    return isTrial || isFree;
  };

  // Get top licenses for the bar chart
  const topLicenses = (data || [])
    .filter(
      (license) =>
        license &&
        getTotalLicenses(license) > 0 &&
        !isTrialOrFreeLicense(license)
    )
    .sort((a, b) => getTotalLicenses(b) - getTotalLicenses(a))
    .slice(0, 5)
    .map((license) => {
      const name = getLicenseName(license);
      const shortName = name.length > 25 ? name.substring(0, 22) + "..." : name;
      const total = getTotalLicenses(license);
      const assigned = parseInt(license?.CountUsed || 0) || 0;
      const available = parseInt(license?.CountAvailable || 0) || 0;
      const percentage = total > 0 ? Math.round((assigned / total) * 100) : 0;
      return { name, shortName, total, assigned, available, percentage };
    });

  const trialFreeLicenses = (data || [])
    .filter((license) => license && getTotalLicenses(license) > 0 && isTrialOrFreeLicense(license))
    .map((license) => {
      const name = getLicenseName(license);
      const termInfoArray = Array.isArray(license?.TermInfo) ? license.TermInfo : [];
      const nameLower = name.toLowerCase();
      const isTrial = termInfoArray.some((term) => term?.IsTrial === true) || nameLower.includes("trial");
      const isFree = nameLower.includes("free");
      const typeLabel = isTrial && isFree ? "Trial/Free" : isTrial ? "Trial" : "Free";
      return {
        name,
        total: getTotalLicenses(license),
        typeLabel,
      };
    })
    .sort((a, b) => b.total - a.total);

  const filteredStats = (data || [])
    .filter((license) => license && getTotalLicenses(license) > 0 && !isTrialOrFreeLicense(license))
    .reduce(
      (acc, lic) => ({
        total: acc.total + (parseInt(lic?.TotalLicenses || 0) || 0),
        assigned: acc.assigned + (parseInt(lic?.CountUsed || 0) || 0),
        available: acc.available + (parseInt(lic?.CountAvailable || 0) || 0),
      }),
      { total: 0, assigned: 0, available: 0 }
    );

  const overallPercentage = filteredStats.total > 0 
    ? Math.round((filteredStats.assigned / filteredStats.total) * 100) 
    : 0;

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "hsl(0, 55%, 65%)"; // Red - critical
    if (percentage >= 75) return "hsl(35, 65%, 60%)"; // Orange - warning
    return "hsl(210, 55%, 65%)"; // Blue - normal
  };

  return (
    <Card sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CardMembershipIcon sx={{ fontSize: compact ? 20 : 24 }} />
            <Typography variant={titleVariant}>License Overview</Typography>
          </Box>
        }
        sx={{ pb: compact ? 0.5 : 1, flexShrink: 0 }}
      />
      <CardContent sx={{ pb: compact ? 1 : 2, pt: compact ? 1 : 2, flex: 1, display: "flex", flexDirection: "column" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
            <Box sx={{ width: "35%" }}>
              <Skeleton variant="rectangular" height={100} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} sx={{ mb: 1 }} />
              <Skeleton height={24} />
            </Box>
          </Box>
        ) : data && Array.isArray(data) && data.length > 0 && topLicenses.length > 0 ? (
          <Box sx={{ display: "flex", gap: compact ? 2 : 3, flex: 1 }}>
            {/* Left side - Stats summary */}
            <Box sx={{ 
              width: compact ? "30%" : "35%", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center",
              pr: 2,
              borderRight: 1,
              borderColor: "divider"
            }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant={statValueVariant} fontWeight="bold" sx={{ lineHeight: 1 }}>
                  {overallPercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overall Usage
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="caption" fontWeight="bold">{filteredStats.total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Assigned</Typography>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: "hsl(210, 55%, 55%)" }}>
                    {filteredStats.assigned.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Available</Typography>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: "hsl(140, 50%, 45%)" }}>
                    {filteredStats.available.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right side - License bars */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: compact ? 1 : 1.5 }}>
              {topLicenses.map((license) => (
                <Tooltip 
                  key={license.name}
                  title={`${license.name}: ${license.assigned.toLocaleString()} / ${license.total.toLocaleString()} (${license.percentage}% used)`}
                  arrow
                  placement="top"
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                      <Typography variant="caption" noWrap sx={{ flex: 1, mr: 1 }}>
                        {license.shortName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {license.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={license.percentage}
                      sx={{
                        height: compact ? 6 : 8,
                        borderRadius: 1,
                        backgroundColor: "hsl(0, 0%, 90%)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getUsageColor(license.percentage),
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No license data available
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider sx={{ flexShrink: 0 }} />
      <CardContent sx={{ pt: compact ? 1 : 1.5, pb: compact ? 1.5 : 2, flexShrink: 0 }}>
        <Typography variant={listTitleVariant} sx={{ mb: compact ? 0.5 : 1 }}>Trial / Free licenses</Typography>
        {isLoading ? (
          <Box>
            <Skeleton height={18} sx={{ mb: 0.5 }} />
            <Skeleton height={18} />
          </Box>
        ) : trialFreeLicenses.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {trialFreeLicenses.slice(0, 3).map((license) => (
              <Box
                key={`${license.name}-${license.typeLabel}`}
                sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
              >
                <Typography variant={listTextVariant} color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {license.name} ({license.typeLabel})
                </Typography>
                <Typography variant={listTextVariant} fontWeight="bold">
                  {license.total.toLocaleString()}
                </Typography>
              </Box>
            ))}
            {trialFreeLicenses.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{trialFreeLicenses.length - 3} more
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant={listTextVariant} color="text.secondary">
            No trial or free licenses found
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
