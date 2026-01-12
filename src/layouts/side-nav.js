import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { Box, Drawer, Stack } from "@mui/material";
import { Scrollbar } from "../components/scrollbar";
import { SideNavItem } from "./side-nav-item";
import { ApiGetCall } from "../api/ApiCall.jsx";

const SIDE_NAV_WIDTH = 270;
const SIDE_NAV_COLLAPSED_WIDTH = 73; // icon size + padding + border right
const TOP_NAV_HEIGHT = 64;

// Find which top-level menu should be open based on current path
const findActiveTopLevelMenu = (items, pathname) => {
  for (const item of items) {
    const checkPath = !!(item.path && pathname);
    const exactMatch = checkPath ? pathname === item.path : false;
    const partialMatch = checkPath && item.path !== "/" ? pathname.startsWith(item.path) : false;
    
    if (exactMatch || partialMatch) {
      return item.title;
    }
    
    if (item.items && item.items.length > 0) {
      const childMatch = findActiveInChildren(item.items, pathname);
      if (childMatch) {
        return item.title;
      }
    }
  }
  return null;
};

const findActiveInChildren = (items, pathname) => {
  for (const item of items) {
    const checkPath = !!(item.path && pathname);
    const exactMatch = checkPath ? pathname === item.path : false;
    const partialMatch = checkPath && item.path !== "/" ? pathname.startsWith(item.path) : false;
    
    if (exactMatch || partialMatch) {
      return true;
    }
    
    if (item.items && item.items.length > 0) {
      if (findActiveInChildren(item.items, pathname)) {
        return true;
      }
    }
  }
  return false;
};

const renderItems = ({ collapse = false, depth = 0, items, pathname, openMenus, onMenuToggle }) =>
  items.reduce((acc, item) => reduceChildRoutes({ acc, collapse, depth, item, pathname, openMenus, onMenuToggle }), []);

const reduceChildRoutes = ({ acc, collapse, depth, item, pathname, openMenus, onMenuToggle }) => {
  const checkPath = !!(item.path && pathname);
  const exactMatch = checkPath && pathname === item.path;
  // Special handling for root path "/" to avoid matching all paths
  const partialMatch = checkPath && item.path !== "/" ? pathname.startsWith(item.path) : false;

  const hasChildren = item.items && item.items.length > 0;
  const isActive = exactMatch || (partialMatch && !hasChildren);
  
  // For top-level items (depth 0), use accordion behavior
  // For nested items, they follow their parent's state
  const isOpen = depth === 0 ? openMenus.includes(item.title) : true;

  if (hasChildren) {
    acc.push(
      <SideNavItem
        active={isActive}
        collapse={collapse}
        depth={depth}
        external={item.external}
        icon={item.icon}
        key={item.title}
        open={isOpen}
        onToggle={() => onMenuToggle(item.title, depth)}
        path={item.path}
        title={item.title}
        type={item.type}
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
            collapse,
            depth: depth + 1,
            items: item.items,
            pathname,
            openMenus,
            onMenuToggle,
          })}
        </Stack>
      </SideNavItem>
    );
  } else {
    acc.push(
      <SideNavItem
        active={isActive}
        collapse={collapse}
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

export const SideNav = (props) => {
  const { items, onPin, pinned = false } = props;
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const collapse = !(pinned || hovered);
  const { data: profile } = ApiGetCall({ url: "/api/me", queryKey: "authmecipp" });

  // Initialize open menus based on current path - only the active menu should be open
  const activeMenu = findActiveTopLevelMenu(items, pathname);
  const [openMenus, setOpenMenus] = useState(activeMenu ? [activeMenu] : []);

  // Handle menu toggle - accordion behavior for top-level, allow multiple for nested
  const handleMenuToggle = useCallback((title, depth) => {
    setOpenMenus((prev) => {
      if (depth === 0) {
        // Top-level: accordion behavior - close others, toggle this one
        if (prev.includes(title)) {
          return []; // Close if already open
        }
        return [title]; // Open only this one
      } else {
        // Nested: toggle independently (though nested menus auto-open with parent)
        if (prev.includes(title)) {
          return prev.filter((t) => t !== title);
        }
        return [...prev, title];
      }
    });
  }, []);

  return (
    <>
      {profile?.clientPrincipal && profile?.clientPrincipal?.userRoles?.length > 2 && (
        <Drawer
          open
          variant="permanent"
          PaperProps={{
            onMouseEnter: () => {
              setHovered(true);
            },
            onMouseLeave: () => {
              setHovered(false);
            },
            sx: {
              backgroundColor: "background.default",
              height: `calc(100% - ${TOP_NAV_HEIGHT}px)`,
              overflowX: "hidden",
              top: TOP_NAV_HEIGHT,
              transition: "width 250ms ease-in-out",
              width: collapse ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_WIDTH,
              zIndex: (theme) => theme.zIndex.appBar - 100,
            },
          }}
        >
          <Scrollbar
            sx={{
              height: "100%",
              overflowX: "hidden",
              "& .simplebar-content": {
                height: "100%",
              },
            }}
          >
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
                  collapse,
                  depth: 0,
                  items,
                  pathname,
                  openMenus,
                  onMenuToggle: handleMenuToggle,
                })}
              </Box>
            </Box>
          </Scrollbar>
        </Drawer>
      )}
    </>
  );
};

SideNav.propTypes = {
  onPin: PropTypes.func,
  pinned: PropTypes.bool,
};
