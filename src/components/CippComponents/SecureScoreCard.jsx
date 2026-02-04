import { Box, Card, CardHeader, CardContent, Typography, Divider, Skeleton } from "@mui/material";
import { Security as SecurityIcon } from "@mui/icons-material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useState, useEffect, useRef, useCallback } from "react";

export const SecureScoreCard = ({ data, isLoading, compact = false }) => {
  const chartContainerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const chartHeight = compact ? 190 : 250;
  const titleVariant = compact ? "subtitle1" : "h6";
  const statVariant = compact ? "subtitle1" : "h6";
  const descriptionVariant = compact ? "caption" : "body2";

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

  // Synchronous check during render - if state says ready but dimensions are invalid, don't render chart
  const canRenderChart = containerReady && hasValidDimensions();
  return (
    <Card sx={{ flex: 1, height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon sx={{ fontSize: compact ? 20 : 24 }} />
            <Typography variant={titleVariant}>Secure Score</Typography>
          </Box>
        }
        sx={{ pb: compact ? 0.5 : 1 }}
      />
      <CardContent sx={{ pt: compact ? 1.5 : 2, pb: compact ? 1.5 : 2 }}>
        {isLoading ? (
          <>
            <Box sx={{ height: chartHeight }}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: compact ? 1.5 : 2, p: 2 }}
              >
                <Skeleton variant="rectangular" width="100%" height={chartHeight - 50} />
              </Box>
            </Box>
            <Typography variant={descriptionVariant} color="text.secondary" sx={{ mt: 1.5 }}>
              The Secure Score measures your security posture across your tenant.
            </Typography>
          </>
        ) : !data || !Array.isArray(data) || data.length === 0 ? (
          <>
            <Box sx={{ height: chartHeight }}>
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
            </Box>
            <Typography variant={descriptionVariant} color="text.secondary" sx={{ mt: 1.5 }}>
              The Secure Score measures your security posture across your tenant.
            </Typography>
          </>
        ) : (
          <>
            <Box ref={chartContainerRef} sx={{ height: chartHeight, minWidth: 0 }}>
              {canRenderChart ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                  debounce={50}
                >
                  {(() => {
                    const sortedData = [...data].sort(
                      (a, b) => new Date(a.createdDateTime) - new Date(b.createdDateTime)
                    );
                    const chartData = sortedData.map((score) => ({
                      date: new Date(score.createdDateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                      score: score.currentScore,
                      percentage: Math.round((score.currentScore / score.maxScore) * 100),
                    }));
                    const ticks = chartData.map((d) => d.date);
                    const maxScore = Math.max(...sortedData.map((score) => score.maxScore || 0), 0);
                    return (
                      <LineChart
                        data={chartData}
                        margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickMargin={6}
                          ticks={ticks}
                          interval={compact ? 1 : 0}
                          height={compact ? 40 : 50}
                          tickFormatter={(value) => value.replace(" ", "\n")}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickMargin={8}
                          domain={[0, maxScore]}
                          tickFormatter={(value) => Math.round(value)}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.85)",
                            color: "inherit",
                            border: "1px solid #bbb",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            backdropFilter: "blur(2px)",
                          }}
                          labelStyle={{
                            color: "#000000",
                          }}
                          formatter={(value, name) => {
                            if (name === "score") return [value.toFixed(2), "Score"];
                            if (name === "percentage") return [value + "%", "Percentage"];
                            return value;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(140, 50%, 65%)"
                          strokeWidth={2}
                          dot={{ fill: "hsl(140, 50%, 65%)", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    );
                  })()}
                </ResponsiveContainer>
              ) : (
                <Skeleton variant="rectangular" width="100%" height={250} />
              )}
            </Box>
            <Typography variant={descriptionVariant} color="text.secondary" sx={{ mt: 1.5 }}>
              The Secure Score measures your security posture across your tenant.
            </Typography>
          </>
        )}
      </CardContent>
      <Divider />
      <CardContent sx={{ pt: compact ? 1.5 : 2, pb: compact ? 1.5 : 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", gap: compact ? 1.5 : 2 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={60} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={60} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={60} />
            </Box>
          </Box>
        ) : !data || !Array.isArray(data) || data.length === 0 ? (
          <Typography variant={descriptionVariant} color="text.secondary">
            Enable secure score monitoring in your tenant
          </Typography>
        ) : (
          <Box sx={{ display: "flex", gap: compact ? 1.5 : 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Latest %
              </Typography>
              <Typography variant={statVariant} fontWeight="bold">
                {Math.round(
                  (data[data.length - 1].currentScore / data[data.length - 1].maxScore) * 100
                )}
                %
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Current Score
              </Typography>
              <Typography variant={statVariant} fontWeight="bold">
                {data[data.length - 1].currentScore.toFixed(2)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Max Score
              </Typography>
              <Typography variant={statVariant} fontWeight="bold">
                {data[data.length - 1].maxScore.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
