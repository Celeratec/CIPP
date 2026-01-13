import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { Box, Drawer, Stack } from "@mui/material";
import { Scrollbar } from "../components/scrollbar";
import { SideNavItem } from "./side-nav-item";
import { ApiGetCall } from "../api/ApiCall.jsx";

const SIDE_NAV_WIDTH = 270;
const SIDE_NAV_COLLAPSED_WIDTH = 73; // icon size + padding + border right
const TOP_NAV_HEIGHT = 64;

// Find all parent menus that should be open based on current path (returns array of titles)
// Only returns menus that have children - leaf items like Dashboard don't need to be "open"
const findActiveMenuPath = (items, pathname, parentPath = []) => {
  for (const item of items) {
    const checkPath = !!(item.path && pathname);
    const exactMatch = checkPath ? pathname === item.path : false;
    const partialMatch = checkPath && item.path !== "/" ? pathname.startsWith(item.path) : false;
    const hasChildren = item.items && item.items.length > 0;
    
    // If this is a leaf item that matches, return only the parent path (not this item)
    if ((exactMatch || partialMatch) && !hasChildren) {
      return parentPath;
    }
    
    // Check children - if match found, include this parent in the path
    if (hasChildren) {
      const childPath = findActiveMenuPath(item.items, pathname, [...parentPath, item.title]);
      if (childPath.length > parentPath.length) {
        // Found a match in children, return path including this parent
        return childPath;
      }
    }
  }
  return parentPath;
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
  
  // Check if this menu should be open (works for all depths)
  const isOpen = openMenus.includes(item.title);

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

  // Track open menus - initialized empty, updated by effect when path changes
  const [openMenus, setOpenMenus] = useState([]);

  // Update open menus when pathname changes (e.g., navigating to Dashboard collapses all)
  useEffect(() => {
    const activeMenuPath = findActiveMenuPath(items, pathname);
    setOpenMenus(activeMenuPath);
  }, [pathname, items]);

  // Handle menu toggle
  // - Top-level (depth 0): accordion behavior - only one can be open, closes nested too
  // - Nested (depth > 0): independent toggle
  const handleMenuToggle = useCallback((title, depth) => {
    setOpenMenus((prev) => {
      if (depth === 0) {
        // Top-level: accordion behavior - close all others (including nested), toggle this one
        if (prev.includes(title)) {
          return []; // Close everything if clicking open top-level menu
        }
        return [title]; // Open only this top-level menu
      } else {
        // Nested: toggle independently
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
