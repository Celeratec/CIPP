import { Box, Card, CardHeader, CardContent, Typography, Divider, Skeleton } from "@mui/material";
import { Security as SecurityIcon, TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";
import {
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useState, useEffect, useRef, useCallback } from "react";

export const SecureScoreCard = ({ data, isLoading, compact = false }) => {
  const chartContainerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const titleVariant = compact ? "subtitle1" : "h6";
  const descriptionVariant = compact ? "caption" : "body2";

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

    checkContainer();
    const timer = setTimeout(checkContainer, 100);

    const resizeObserver = new ResizeObserver(checkContainer);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isLoading, hasValidDimensions]);

  const canRenderChart = containerReady && hasValidDimensions();

  // Process data for charts
  const processedData = data && Array.isArray(data) && data.length > 0 ? (() => {
    const sortedData = [...data].sort(
      (a, b) => new Date(a.createdDateTime) - new Date(b.createdDateTime)
    );
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;
    
    const currentPercentage = Math.round((latest.currentScore / latest.maxScore) * 100);
    const previousPercentage = previous 
      ? Math.round((previous.currentScore / previous.maxScore) * 100)
      : currentPercentage;
    
    const trend = currentPercentage - previousPercentage;
    
    const sparklineData = sortedData.map((score) => ({
      date: new Date(score.createdDateTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      percentage: Math.round((score.currentScore / score.maxScore) * 100),
    }));

    return {
      currentPercentage,
      currentScore: latest.currentScore,
      maxScore: latest.maxScore,
      trend,
      sparklineData,
      gaugeData: [{ name: "Score", value: currentPercentage, fill: "hsl(140, 50%, 65%)" }],
    };
  })() : null;

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp sx={{ fontSize: 16, color: "hsl(140, 50%, 50%)" }} />;
    if (trend < 0) return <TrendingDown sx={{ fontSize: 16, color: "hsl(0, 55%, 60%)" }} />;
    return <TrendingFlat sx={{ fontSize: 16, color: "text.secondary" }} />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "hsl(140, 50%, 50%)";
    if (trend < 0) return "hsl(0, 55%, 60%)";
    return "text.secondary";
  };

  const gaugeHeight = compact ? 140 : 180;
  const sparklineHeight = compact ? 50 : 60;

  return (
    <Card sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon sx={{ fontSize: compact ? 20 : 24 }} />
            <Typography variant={titleVariant}>Secure Score</Typography>
          </Box>
        }
        sx={{ pb: compact ? 0.5 : 1, flexShrink: 0 }}
      />
      <CardContent
        sx={{
          pt: compact ? 1 : 1.5,
          pb: compact ? 1 : 1.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Skeleton variant="circular" width={gaugeHeight} height={gaugeHeight} />
            <Skeleton variant="rectangular" width="80%" height={sparklineHeight} />
          </Box>
        ) : !processedData ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant={descriptionVariant} color="text.secondary">
              No secure score data available
            </Typography>
          </Box>
        ) : (
          <Box ref={chartContainerRef} sx={{ minWidth: 0 }}>
            {canRenderChart && (
              <>
                {/* Gauge Chart with percentage in center */}
                <Box sx={{ position: "relative", height: gaugeHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="70%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                      data={processedData.gaugeData}
                      barSize={compact ? 12 : 16}
                    >
                      <RadialBar
                        background={{ fill: "hsl(0, 0%, 90%)" }}
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {/* Center text overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant={compact ? "h4" : "h3"}
                      fontWeight="bold"
                      sx={{ lineHeight: 1 }}
                    >
                      {processedData.currentPercentage}%
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 0.5 }}>
                      {getTrendIcon(processedData.trend)}
                      <Typography
                        variant="caption"
                        sx={{ color: getTrendColor(processedData.trend) }}
                      >
                        {processedData.trend > 0 ? "+" : ""}
                        {processedData.trend}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Sparkline for trend */}
                <Box sx={{ height: sparklineHeight, mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={processedData.sparklineData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(140, 50%, 65%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(140, 50%, 65%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value}%`, "Score"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="hsl(140, 50%, 65%)"
                        strokeWidth={2}
                        fill="url(#sparklineGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>

                <Typography
                  variant={descriptionVariant}
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: "center" }}
                >
                  {processedData.currentScore.toFixed(1)} / {processedData.maxScore.toFixed(1)} points
                </Typography>
              </>
            )}
            {!canRenderChart && (
              <Skeleton variant="rectangular" width="100%" height={gaugeHeight + sparklineHeight} />
            )}
          </Box>
        )}
      </CardContent>
      <Divider sx={{ flexShrink: 0 }} />
      <CardContent sx={{ pt: compact ? 1 : 1.5, pb: compact ? 1.5 : 2, flexShrink: 0 }}>
        {isLoading ? (
          <Typography variant={descriptionVariant} color="text.secondary" sx={{ textAlign: "center" }}>
            Loading secure score data...
          </Typography>
        ) : !processedData ? (
          <Typography variant={descriptionVariant} color="text.secondary" sx={{ textAlign: "center" }}>
            Enable secure score monitoring in your tenant
          </Typography>
        ) : (
          <Typography variant={descriptionVariant} color="text.secondary" sx={{ textAlign: "center" }}>
            Secure Score measures your security posture across your tenant
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
