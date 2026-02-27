import { useCallback, useEffect, memo } from "react";
import NextLink from "next/link";
import PropTypes from "prop-types";
import Bars3Icon from "@heroicons/react/24/outline/Bars3Icon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import SunIcon from "@heroicons/react/24/outline/SunIcon";
import {
  Box,
  Divider,
  IconButton,
  Stack,
  SvgIcon,
  useMediaQuery,
} from "@mui/material";
import { Logo } from "../components/logo";
import { useSettings } from "../hooks/use-settings";
import { paths } from "../paths";
import { AccountPopover } from "./account-popover";
import { CippTenantSelector } from "../components/CippComponents/CippTenantSelector";
import { NotificationsPopover } from "./notifications-popover";
import { useDialog } from "../hooks/use-dialog";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CippCentralSearch } from "../components/CippComponents/CippCentralSearch";

const TOP_NAV_HEIGHT = 64;

export const TopNav = memo((props) => {
  const searchDialog = useDialog();
  const { onNavOpen } = props;
  const settings = useSettings();
  const mdDown = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const handleThemeSwitch = useCallback(() => {
    const themeName = settings.currentTheme?.value === "light" ? "dark" : "light";
    settings.handleUpdate({
      currentTheme: { value: themeName, label: themeName },
      paletteMode: themeName,
    });
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const openSearch = () => {
    searchDialog.handleOpen();
  };

  return (
    <Box
      component="header"
      sx={{
        // Frosted glass effect like Apple
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.3)' 
            : 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: (theme) => 
          `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)'}`,
        color: (theme) => theme.palette.text.primary,
        position: "fixed",
        width: "100%",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{
          minHeight: TOP_NAV_HEIGHT,
          px: mdDown ? 1.5 : 3,
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={3}
          divider={
            <Divider
              orientation="vertical"
              sx={{
                borderColor: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 0, 0, 0.2)',
                height: 36,
              }}
            />
          }
        >
          <Box
            component={NextLink}
            href={paths.index}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              width: "auto",
            }}
          >
            <Logo height={48} />
          </Box>
          {!mdDown && <CippTenantSelector refreshButton={true} tenantButton={true} />}
          {mdDown && (
            <IconButton 
              onClick={onNavOpen}
              sx={{ 
                color: 'text.primary',
                // Minimum 44px touch target for mobile accessibility
                minWidth: 44,
                minHeight: 44,
              }}
            >
              <SvgIcon fontSize="medium">
                <Bars3Icon />
              </SvgIcon>
            </IconButton>
          )}
        </Stack>
        <Stack alignItems="center" direction="row" spacing={mdDown ? 0.5 : 1.5}>
          {!mdDown && (
            <IconButton 
              onClick={handleThemeSwitch}
              sx={{ color: 'text.secondary' }}
            >
              <SvgIcon fontSize="small">
                {settings?.currentTheme?.value === "dark" ? <SunIcon /> : <MoonIcon />}
              </SvgIcon>
            </IconButton>
          )}
          <IconButton 
            onClick={() => openSearch()}
            sx={{ 
              color: 'text.secondary',
              // Minimum 44px touch target for mobile
              ...(mdDown && { minWidth: 44, minHeight: 44 }),
            }}
          >
            <SvgIcon fontSize={mdDown ? "medium" : "small"}>
              <MagnifyingGlassIcon />
            </SvgIcon>
          </IconButton>
          <CippCentralSearch open={searchDialog.open} handleClose={searchDialog.handleClose} />
          <NotificationsPopover />
          <AccountPopover
            onThemeSwitch={handleThemeSwitch}
            paletteMode={settings.currentTheme?.value === "light" ? "dark" : "light"}
          />
        </Stack>
      </Stack>
    </Box>
  );
});

TopNav.displayName = "TopNav";

TopNav.propTypes = {
  onNavOpen: PropTypes.func,
  openNav: PropTypes.bool,
};
