import { Box, Card, CardHeader, CardContent, Typography, Divider, Skeleton } from "@mui/material";
import { CardMembership as CardMembershipIcon } from "@mui/icons-material";
import { CippSankey } from "./CippSankey";

export const LicenseCard = ({ data, isLoading, compact = false }) => {
  const chartHeight = compact ? 160 : 300;
  const titleVariant = compact ? "subtitle1" : "h6";
  const listTextVariant = compact ? "caption" : "body2";
  const listTitleVariant = compact ? "subtitle2" : "subtitle1";

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
  const processData = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const topLicenses = data
      .filter(
        (license) =>
          license &&
          getTotalLicenses(license) > 0 &&
          !isTrialOrFreeLicense(license)
      )
      .sort((a, b) => getTotalLicenses(b) - getTotalLicenses(a))
      .slice(0, 5);

    if (topLicenses.length === 0) {
      return null;
    }

    const nodes = [];
    const links = [];

    topLicenses.forEach((license, index) => {
      if (license) {
        const licenseName = getLicenseName(license);
        const shortName =
          licenseName.length > 30 ? licenseName.substring(0, 27) + "..." : licenseName;

        const assigned = parseInt(license?.CountUsed || 0) || 0;
        const available = parseInt(license?.CountAvailable || 0) || 0;

        nodes.push({
          id: shortName,
          nodeColor: `hsl(${210 + index * 25}, 55%, 75%)`,
        });

        const assignedId = `${shortName} - Assigned`;
        const availableId = `${shortName} - Available`;

        if (assigned > 0) {
          nodes.push({
            id: assignedId,
            nodeColor: "hsl(140, 50%, 72%)",
          });

          links.push({
            source: shortName,
            target: assignedId,
            value: assigned,
          });
        }

        if (available > 0) {
          nodes.push({
            id: availableId,
            nodeColor: "hsl(35, 60%, 75%)",
          });

          links.push({
            source: shortName,
            target: availableId,
            value: available,
          });
        }
      }
    });

    if (nodes.length === 0 || links.length === 0) {
      return null;
    }

    return { nodes, links };
  };

  const processedData = processData();

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

  return (
    <Card sx={{ flex: 1, height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CardMembershipIcon sx={{ fontSize: compact ? 20 : 24 }} />
            <Typography variant={titleVariant}>License Overview</Typography>
          </Box>
        }
        sx={{ pb: compact ? 0.5 : 1 }}
      />
      <CardContent sx={{ pb: compact ? 1 : 2, pt: compact ? 1 : 2 }}>
        <Box sx={{ height: chartHeight }}>
          {isLoading ? (
            <Skeleton variant="rectangular" width="100%" height={chartHeight} />
          ) : processedData ? (
            <CippSankey data={{ nodes: processedData.nodes, links: processedData.links }} />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No license data available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
      <Divider />
      <CardContent sx={{ pt: compact ? 1 : 2, pb: compact ? 1 : 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", gap: compact ? 1.5 : 2 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={20} sx={{ mb: 1 }} />
              <Skeleton width={60} height={32} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={20} sx={{ mb: 1 }} />
              <Skeleton width={60} height={32} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={20} sx={{ mb: 1 }} />
              <Skeleton width={60} height={32} />
            </Box>
          </Box>
        ) : data && Array.isArray(data) && data.length > 0 ? (
          <Box sx={{ display: "flex", gap: compact ? 1.5 : 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Licenses
              </Typography>
              <Typography variant={listTitleVariant} fontWeight="bold">
                {filteredStats.total.toLocaleString()}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Assigned
              </Typography>
              <Typography variant={listTitleVariant} fontWeight="bold">
                {filteredStats.assigned.toLocaleString()}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Available
              </Typography>
              <Typography variant={listTitleVariant} fontWeight="bold">
                {filteredStats.available.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No license statistics available
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider />
      <CardContent sx={{ pt: compact ? 1 : 2, pb: compact ? 1.5 : 2 }}>
        <Typography variant={listTitleVariant}>Trial / Free licenses</Typography>
        {isLoading ? (
          <Box sx={{ mt: compact ? 0.5 : 1 }}>
            <Skeleton height={18} sx={{ mb: 0.5 }} />
            <Skeleton height={18} sx={{ mb: 0.5 }} />
            <Skeleton height={18} />
          </Box>
        ) : trialFreeLicenses.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: compact ? 0.25 : 0.5, mt: compact ? 0.5 : 1 }}>
            {trialFreeLicenses.map((license) => (
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
          </Box>
        ) : (
          <Typography variant={listTextVariant} color="text.secondary" sx={{ mt: compact ? 0.5 : 1 }}>
            No trial or free licenses found
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
