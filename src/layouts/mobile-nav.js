import NextLink from "next/link";
import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { Box, Drawer, Stack, IconButton, SvgIcon, Divider, Typography } from "@mui/material";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import SunIcon from "@heroicons/react/24/outline/SunIcon";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { Logo } from "../components/logo";
import { Scrollbar } from "../components/scrollbar";
import { paths } from "../paths";
import { MobileNavItem } from "./mobile-nav-item";
import { CippTenantSelector } from "../components/CippComponents/CippTenantSelector";
import { useSettings } from "../hooks/use-settings";
import { useCallback } from "react";

const MOBILE_NAV_WIDTH = "80%";

const renderItems = ({ depth = 0, items, pathname }) =>
  items.reduce(
    (acc, item) =>
      reduceChildRoutes({
        acc,
        depth,
        item,
        pathname,
      }),
    []
  );

const reduceChildRoutes = ({ acc, depth, item, pathname }) => {
  const checkPath = !!(item.path && pathname);
  // Special handling for root path "/" to avoid matching all paths
  const partialMatch = checkPath && item.path !== "/" ? pathname.includes(item.path) : false;
  const exactMatch = checkPath ? pathname === item.path : false;

  if (item.items) {
    acc.push(
      <MobileNavItem
        active={partialMatch}
        depth={depth}
        external={item.external}
        icon={item.icon}
        key={item.title}
        openImmediately={partialMatch}
        path={item.path}
        title={item.title}
      >
        <Stack
          component="ul"
          spacing={0.5}
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
          }}
        >
          {renderItems({
            depth: depth + 1,
            items: item.items,
            pathname,
          })}
        </Stack>
      </MobileNavItem>
    );
  } else {
    acc.push(
      <MobileNavItem
        active={exactMatch}
        depth={depth}
        external={item.external}
        icon={item.icon}
        key={item.title}
        path={item.path}
        title={item.title}
      />
    );
  }

  return acc;
};

export const MobileNav = (props) => {
  const { open, onClose, items } = props;
  const pathname = usePathname();
  const settings = useSettings();

  const handleThemeSwitch = useCallback(() => {
    const themeName = settings.currentTheme?.value === "light" ? "dark" : "light";
    settings.handleUpdate({
      currentTheme: { value: themeName, label: themeName },
      paletteMode: themeName,
    });
  }, [settings]);

  const displayBookmarks = settings.bookmarks || [];

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          width: MOBILE_NAV_WIDTH,
          // Safe area for notched phones
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
      }}
      variant="temporary"
    >
      <Scrollbar
        sx={{
          height: "100%",
          "& .simplebar-content": {
            height: "100%",
          },
        }}
      >
        <Box
          sx={{
            pt: 2,
            px: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            component={NextLink}
            href={paths.index}
            onClick={onClose}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              width: "auto",
            }}
          >
            <Logo height={48} />
          </Box>
          <IconButton 
            onClick={handleThemeSwitch}
            sx={{ 
              minWidth: 44, 
              minHeight: 44,
              color: 'text.secondary',
            }}
          >
            <SvgIcon fontSize="medium">
              {settings?.currentTheme?.value === "dark" ? <SunIcon /> : <MoonIcon />}
            </SvgIcon>
          </IconButton>
        </Box>
        <Box sx={{ mx: 2, mt: 2 }}>
          <CippTenantSelector refreshButton={true} tenantButton={false} />
        </Box>
        
        {/* Bookmarks section for mobile */}
        {displayBookmarks.length > 0 && (
          <Box sx={{ mx: 2, mt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <SvgIcon fontSize="small" sx={{ color: 'text.secondary' }}>
                <BookmarkIcon />
              </SvgIcon>
              <Typography variant="subtitle2" color="text.secondary">
                Bookmarks
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              {displayBookmarks.slice(0, 5).map((bookmark, idx) => (
                <Box
                  key={idx}
                  component={NextLink}
                  href={bookmark.path}
                  onClick={onClose}
                  sx={{
                    display: 'block',
                    py: 1,
                    px: 1.5,
                    borderRadius: 1,
                    textDecoration: 'none',
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    backgroundColor: 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  {bookmark.label}
                </Box>
              ))}
            </Stack>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}
        
        <Box
          component="nav"
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 2,
          }}
        >
          <Box
            component="ul"
            sx={{
              flexGrow: 1,
              listStyle: "none",
              m: 0,
              p: 0,
            }}
          >
            {renderItems({
              depth: 0,
              items,
              pathname,
            })}
          </Box>
        </Box>
      </Scrollbar>
    </Drawer>
  );
};

MobileNav.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
