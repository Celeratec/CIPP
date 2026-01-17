import { Box, Button, SvgIcon, Tooltip, Typography, Divider } from "@mui/material";
import { CippPropertyListCard } from "/src/components/CippCards/CippPropertyListCard";
import { CheckCircle, SystemUpdateAlt, Warning, Error, Sync } from "@mui/icons-material";
import { ApiGetCall } from "/src/api/ApiCall";
import { useEffect } from "react";

const CippVersionProperties = () => {
  const version = ApiGetCall({
    url: "/version.json",
    queryKey: "LocalVersion",
  });

  const cippVersion = ApiGetCall({
    url: `/api/GetVersion?LocalVersion=${version?.data?.version}`,
    queryKey: "CippVersion",
    waiting: false,
  });

  useEffect(() => {
    if (version.isFetched && !cippVersion.isFetched) {
      cippVersion.waiting = true;
      cippVersion.refetch();
    }
  }, [version, cippVersion]);

  const CippVersionComponent = (version, availableVersion, outOfDate) => {
    return (
      <Box>
        <SvgIcon fontSize="inherit" style={{ marginRight: 3 }}>
          {outOfDate === true ? <Warning color="warning" /> : <CheckCircle color="success" />}
        </SvgIcon>
        <span style={{ marginRight: 10 }}>v{version}</span>{" "}
        {outOfDate === true ? `(v${availableVersion} is available)` : ""}
      </Box>
    );
  };

  // Component for showing backend app version with sync status
  const BackendAppVersion = ({ app, mainVersion }) => {
    const isOutOfSync = app?.OutOfSync;
    const isOutdated = mainVersion && app?.Version && 
      cippVersion?.data?.RemoteCIPPAPIVersion && 
      app.Version !== cippVersion?.data?.RemoteCIPPAPIVersion;
    
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title={isOutOfSync ? "Out of sync with main API" : "In sync"}>
          <SvgIcon fontSize="inherit" sx={{ mr: 0.5 }}>
            {isOutOfSync ? <Sync color="warning" /> : <CheckCircle color="success" />}
          </SvgIcon>
        </Tooltip>
        <Typography variant="body2" component="span">
          v{app?.Version || "Unknown"}
        </Typography>
        {isOutOfSync && (
          <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
            (out of sync)
          </Typography>
        )}
      </Box>
    );
  };

  // Build property items including backend versions
  const buildPropertyItems = () => {
    const items = [
      {
        label: "Frontend",
        value: CippVersionComponent(
          version?.data?.version,
          cippVersion?.data?.RemoteCIPPVersion,
          cippVersion?.data?.OutOfDateCIPP
        ),
      },
    ];

    // Add backend versions
    const backendVersions = cippVersion?.data?.BackendVersions || [];
    
    if (backendVersions.length > 0) {
      // Find the main API version
      const mainApp = backendVersions.find(app => app.IsMainApp);
      const mainVersion = mainApp?.Version;
      
      // Add each backend app
      backendVersions.forEach((app, index) => {
        items.push({
          label: app.FriendlyName || app.Name,
          value: <BackendAppVersion app={app} mainVersion={mainVersion} />,
        });
      });
      
      // Check if any are out of sync
      const outOfSyncCount = backendVersions.filter(app => app.OutOfSync).length;
      if (outOfSyncCount > 0) {
        items.push({
          label: "Sync Status",
          value: (
            <Box sx={{ display: "flex", alignItems: "center", color: "warning.main" }}>
              <SvgIcon fontSize="inherit" sx={{ mr: 0.5 }}>
                <Warning />
              </SvgIcon>
              <Typography variant="body2">
                {outOfSyncCount} app{outOfSyncCount > 1 ? "s" : ""} out of sync
              </Typography>
            </Box>
          ),
        });
      }
    } else {
      // Fallback to single backend version if no detailed info
      items.push({
        label: "Backend",
        value: CippVersionComponent(
          cippVersion?.data?.LocalCIPPAPIVersion,
          cippVersion?.data?.RemoteCIPPAPIVersion,
          cippVersion?.data?.OutOfDateCIPPAPI
        ),
      });
    }

    return items;
  };

  return (
    <CippPropertyListCard
      showDivider={false}
      cardButton={
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            version.refetch();
            cippVersion.refetch();
          }}
        >
          <SvgIcon fontSize="small" style={{ marginRight: 4 }}>
            <SystemUpdateAlt />
          </SvgIcon>
          Check For Updates
        </Button>
      }
      title="Version"
      isFetching={cippVersion.isFetching}
      cardSx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}
      propertyItems={buildPropertyItems()}
    />
  );
};

export default CippVersionProperties;
