import { usePathname, useRouter } from "next/navigation";
import { Box, Divider, Stack, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { useSearchParams } from "next/navigation";

export const TabbedLayout = (props) => {
  const { tabOptions, children } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTabsChange = (event, value) => {
    // Preserve existing query parameters when changing tabs
    const currentParams = new URLSearchParams(searchParams.toString());
    const queryString = currentParams.toString();
    const newPath = queryString ? `${value}?${queryString}` : value;
    router.push(newPath);
  };

  const currentTab = tabOptions.find((option) => option.path === pathname);

  return (
    <Box
      sx={{
        flexGrow: 1,
        pb: smDown ? 2 : 4,
        mt: -1,
      }}
    >
      <Stack spacing={smDown ? 1 : 2}>
        <Box sx={{ ml: smDown ? 1 : 3 }}>
          <Tabs
            onChange={handleTabsChange}
            value={currentTab?.path}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: smDown ? 40 : 48,
              "& .MuiTab-root": {
                minHeight: smDown ? 40 : 48,
                py: smDown ? 1 : 1.5,
                px: smDown ? 1.5 : 2,
                fontSize: smDown ? "0.8125rem" : "0.875rem",
              },
              "& .MuiTab-root:first-of-type": {
                ml: smDown ? 0 : 1,
              },
            }}
          >
            {tabOptions.map((option) => (
              <Tab key={option.path} label={option.label} value={option.path} />
            ))}
          </Tabs>
          <Divider />
        </Box>
        {children}
      </Stack>
    </Box>
  );
};
