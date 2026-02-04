import { Card, CardHeader, CardContent, Box, Typography, Skeleton } from "@mui/material";
import { Security as SecurityIcon } from "@mui/icons-material";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { CippTimeAgo } from "../CippComponents/CippTimeAgo";
import { useState, useEffect, useRef, useCallback } from "react";

export const AssessmentCard = ({ data, isLoading }) => {
  const chartContainerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);

  // Check if container has valid dimensions - used both in effect and during render
  const hasValidDimensions = useCallback(() => {
    if (!chartContainerRef.current) return false;
    const { width, height } = chartContainerRef.current.getBoundingClientRect();
    return width > 0 && height > 0;
  }, []);

  useEffect(() => {
    const checkContainer = () => {
      if (hasValidDimensions()) {
        setContainerReady(true);
      } else {
        setContainerReady(false);
      }
    };
    
    // Check immediately and after a short delay to handle layout timing
    checkContainer();
    const timer = setTimeout(checkContainer, 100);
    
    // Also observe resize changes
    const resizeObserver = new ResizeObserver(checkContainer);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isLoading, hasValidDimensions]);

  // Synchronous check during render - if state says ready but dimensions are invalid, don't render chart
  const canRenderChart = containerReady && hasValidDimensions();
  // Extract data with null safety
  const identityPassed = data?.TestResultSummary?.IdentityPassed || 0;
  const identityTotal = data?.TestResultSummary?.IdentityTotal || 1;
  const devicesPassed = data?.TestResultSummary?.DevicesPassed || 0;
  const devicesTotal = data?.TestResultSummary?.DevicesTotal || 0;

  // Determine if we should show devices section
  const hasDeviceTests = devicesTotal > 0;

  // Calculate percentages for the radial chart
  // If no device tests, set devices to 100% (complete)
  const devicesPercentage = hasDeviceTests ? (devicesPassed / devicesTotal) * 100 : 100;
  const identityPercentage = (identityPassed / identityTotal) * 100;

  const chartData = [
    {
      value: devicesPercentage,
      fill: "#22c55e",
    },
    {
      value: identityPercentage,
      fill: "#3b82f6",
    },
  ];

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <SecurityIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>Assessment</Typography>
          </Box>
        }
        sx={{ py: 1, px: 1.5 }}
      />
      <CardContent sx={{ pt: 0, px: 1.5, pb: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                Identity
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" fontSize="0.95rem" lineHeight={1.2}>
                {isLoading ? (
                  <Skeleton width={60} />
                ) : (
                  <>
                    {identityPassed}/{identityTotal}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                      fontSize="0.65rem"
                    >
                      tests
                    </Typography>
                  </>
                )}
              </Typography>
            </Box>
            {hasDeviceTests && (
              <Box sx={{ mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                  Devices
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" fontSize="0.95rem" lineHeight={1.2}>
                  {isLoading ? (
                    <Skeleton width={60} />
                  ) : (
                    <>
                      {devicesPassed}/{devicesTotal}
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                        fontSize="0.65rem"
                      >
                        tests
                      </Typography>
                    </>
                  )}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                Last Data Collection
              </Typography>
              <Typography variant="body2" fontSize="0.7rem" lineHeight={1.3}>
                {isLoading ? (
                  <Skeleton width={80} />
                ) : data?.ExecutedAt ? (
                  <CippTimeAgo data={data?.ExecutedAt} />
                ) : (
                  "Not Available"
                )}
              </Typography>
            </Box>
          </Box>
          <Box
            ref={chartContainerRef}
            sx={{
              width: 70,
              height: 70,
              flexShrink: 0,
              display: "flex",
            }}
          >
            {isLoading ? (
              <Skeleton variant="circular" width={70} height={70} />
            ) : canRenderChart ? (
              <Box sx={{ width: "100%", height: "100%", minWidth: 0, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                  <RadialBarChart
                    innerRadius="20%"
                    outerRadius="100%"
                    data={chartData}
                    startAngle={90}
                    endAngle={450}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" background cornerRadius={5} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Skeleton variant="circular" width={70} height={70} />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
