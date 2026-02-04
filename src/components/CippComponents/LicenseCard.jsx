import { Box, Card, CardHeader, CardContent, Typography, Skeleton, LinearProgress, Tooltip } from "@mui/material";
import { CardMembership as CardMembershipIcon } from "@mui/icons-material";

export const LicenseCard = ({ data, isLoading, compact = false }) => {
  const titleVariant = compact ? "subtitle1" : "h6";
  const statValueVariant = compact ? "h5" : "h4";

  const getLicenseName = (license) =>
    license?.License || license?.skuPartNumber || license?.SkuPartNumber || "Unknown License";

  const getTotalLicenses = (license) => parseInt(license?.TotalLicenses || 0) || 0;

  // Filter out trial, free, and developer licenses - we only want paid licenses
  const isPaidLicense = (license) => {
    const termInfoArray = Array.isArray(license?.TermInfo) ? license.TermInfo : [];
    const name = getLicenseName(license);
    const nameLower = name.toLowerCase();
    
    // Check for trial licenses
    const isTrial = termInfoArray.some((term) => term?.IsTrial === true) || nameLower.includes("trial");
    
    // Check for free/developer licenses
    const isFreeOrDev = 
      nameLower.includes("free") ||
      nameLower.includes("developer") ||
      nameLower.includes("for developer") ||
      nameLower.includes("_dev") ||
      nameLower.includes("dev_") ||
      nameLower.includes("sandbox") ||
      nameLower.includes("viral") ||
      nameLower.includes("self-service");
    
    return !isTrial && !isFreeOrDev;
  };

  // Get all paid licenses sorted by total count
  const paidLicenses = (data || [])
    .filter(
      (license) =>
        license &&
        getTotalLicenses(license) > 0 &&
        isPaidLicense(license)
    )
    .sort((a, b) => getTotalLicenses(b) - getTotalLicenses(a))
    .map((license) => {
      const name = getLicenseName(license);
      const total = getTotalLicenses(license);
      const assigned = parseInt(license?.CountUsed || 0) || 0;
      const available = parseInt(license?.CountAvailable || 0) || 0;
      const percentage = total > 0 ? Math.round((assigned / total) * 100) : 0;
      return { name, total, assigned, available, percentage };
    });

  const filteredStats = paidLicenses.reduce(
    (acc, lic) => ({
      total: acc.total + lic.total,
      assigned: acc.assigned + lic.assigned,
      available: acc.available + lic.available,
    }),
    { total: 0, assigned: 0, available: 0 }
  );

  const overallPercentage = filteredStats.total > 0 
    ? Math.round((filteredStats.assigned / filteredStats.total) * 100) 
    : 0;

  // Pastel blue for assigned licenses, pastel red for available (over-provisioned)
  const barColor = "hsl(210, 55%, 72%)";
  const barBackgroundColor = "hsl(0, 50%, 85%)"; // Pastel red for unused/available licenses

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
      <CardContent sx={{ pb: compact ? 1.5 : 2, pt: compact ? 1 : 2, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
            <Box sx={{ width: "30%" }}>
              <Skeleton variant="rectangular" height={100} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={20} sx={{ mb: 1 }} />
              <Skeleton height={20} />
            </Box>
          </Box>
        ) : data && Array.isArray(data) && data.length > 0 && paidLicenses.length > 0 ? (
          <Box sx={{ display: "flex", gap: compact ? 2 : 3, flex: 1, minHeight: 0 }}>
            {/* Left side - Stats summary */}
            <Box sx={{ 
              width: compact ? "28%" : "30%", 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center",
              pr: 2,
              borderRight: 1,
              borderColor: "divider",
              flexShrink: 0
            }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant={statValueVariant} fontWeight="bold" sx={{ lineHeight: 1 }}>
                  {overallPercentage}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overall Usage
                </Typography>
              </Box>
              
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="caption" fontWeight="bold">{filteredStats.total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Assigned</Typography>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: "hsl(210, 55%, 58%)" }}>
                    {filteredStats.assigned.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Available</Typography>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: "hsl(140, 50%, 55%)" }}>
                    {filteredStats.available.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
                {paidLicenses.length} license{paidLicenses.length !== 1 ? "s" : ""}
              </Typography>
            </Box>

            {/* Right side - Scrollable license bars */}
            <Box sx={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              gap: compact ? 0.75 : 1,
              overflowY: "auto",
              pr: 1,
              minHeight: 0,
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "hsl(0, 0%, 80%)",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "hsl(0, 0%, 70%)",
              },
            }}>
              {paidLicenses.map((license) => (
                <Tooltip 
                  key={license.name}
                  title={`${license.name}: ${license.assigned.toLocaleString()} / ${license.total.toLocaleString()} (${license.percentage}% used, ${license.available.toLocaleString()} available)`}
                  arrow
                  placement="top"
                >
                  <Box sx={{ flexShrink: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                      <Typography variant="caption" noWrap sx={{ flex: 1, mr: 1, fontSize: compact ? "0.7rem" : "0.75rem" }}>
                        {license.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: compact ? "0.7rem" : "0.75rem", flexShrink: 0 }}>
                        {license.assigned}/{license.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={license.percentage}
                      sx={{
                        height: compact ? 5 : 6,
                        borderRadius: 1,
                        backgroundColor: barBackgroundColor,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: barColor,
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
              No paid license data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
