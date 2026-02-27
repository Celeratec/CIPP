import { useState, useCallback, useEffect, memo } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import PropTypes from "prop-types";
import {
  Box,
  ButtonBase,
  Collapse,
  Divider,
  Drawer,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@heroicons/react/24/outline/ChevronRightIcon";
import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { Scrollbar } from "../components/scrollbar";
import { SideNavItem } from "./side-nav-item";
import { useSettings } from "../hooks/use-settings";

const SIDE_NAV_WIDTH = 270;
const SIDE_NAV_COLLAPSED_WIDTH = 73; // icon size + padding + border right
const TOP_NAV_HEIGHT = 64;

// Find all parent menus that should be open based on current path
// Returns an array of menu titles that form the path to the active item
const findActiveMenuPath = (items, pathname, parentPath = []) => {
  if (!items || !pathname) return [];
  
  for (const item of items) {
    const hasChildren = item.items && item.items.length > 0;
    
    if (hasChildren) {
      // Recursively check children
      const childResult = findActiveMenuPath(item.items, pathname, [...parentPath, item.title]);
      // If we found a match in children, return it (includes this parent)
      if (childResult.length > 0) {
        return childResult;
      }
    } else if (item.path) {
      // This is a leaf item - check if it matches
      const exactMatch = pathname === item.path;
      // For partial match, ensure the path is followed by / or end of string
      // This prevents /identity matching /identity-other
      const partialMatch = item.path !== "/" && (
        pathname.startsWith(item.path + "/") || pathname === item.path
      );
      
      if (exactMatch || partialMatch) {
        // Found matching leaf - return the parent path (not including this leaf)
        return parentPath;
      }
    }
  }
  
  // No match found in this branch
  return [];
};

const renderItems = ({ collapse = false, depth = 0, items, pathname, openMenus, onMenuToggle }) =>
  items.reduce((acc, item) => reduceChildRoutes({ acc, collapse, depth, item, pathname, openMenus, onMenuToggle, siblings: items }), []);

const reduceChildRoutes = ({ acc, collapse, depth, item, pathname, openMenus, onMenuToggle, siblings = [] }) => {
  const hasChildren = item.items && item.items.length > 0;
  
  // Determine if this item is "active" (currently selected page)
  let isActive = false;
  if (item.path && pathname && !hasChildren) {
    const exactMatch = pathname === item.path;
    // More precise partial match - ensure path boundary
    let partialMatch = item.path !== "/" && (
      pathname.startsWith(item.path + "/") || pathname === item.path
    );
    // If partial match, check that no sibling has a longer/more-specific match
    // This prevents /teams-share/onedrive from highlighting when /teams-share/onedrive/file-browser is the actual match
    if (partialMatch && !exactMatch) {
      const allLeafPaths = [];
      const collectLeafPaths = (items) => {
        for (const sibling of items) {
          if (sibling.items && sibling.items.length > 0) {
            collectLeafPaths(sibling.items);
          } else if (sibling.path) {
            allLeafPaths.push(sibling.path);
          }
        }
      };
      collectLeafPaths(siblings);
      const hasMoreSpecificMatch = allLeafPaths.some(
        (p) => p !== item.path && p.length > item.path.length && (pathname === p || pathname.startsWith(p + "/"))
      );
      if (hasMoreSpecificMatch) {
        partialMatch = false;
      }
    }
    isActive = exactMatch || partialMatch;
  }
  
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

export const SideNav = memo((props) => {
  const { items, onPin, pinned = false } = props;
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const collapse = !(pinned || hovered);
  const { bookmarks = [] } = useSettings();
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);

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
        if (prev.includes(title)) {
          return [];
        }
        return [title];
      } else {
        if (prev.includes(title)) {
          return prev.filter((t) => t !== title);
        }
        return [...prev, title];
      }
    });
  }, []);

  return (
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
            <li>
              <ButtonBase
                onClick={() => setQuickAccessOpen((prev) => !prev)}
                sx={{
                  alignItems: "center",
                  borderRadius: 1,
                  display: "flex",
                  fontFamily: (theme) => theme.typography.fontFamily,
                  fontSize: 14,
                  fontWeight: 500,
                  justifyContent: "flex-start",
                  px: "6px",
                  py: "12px",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  width: "100%",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.04)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    alignItems: "center",
                    color: "neutral.400",
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                    height: 24,
                    justifyContent: "center",
                    width: 24,
                  }}
                >
                  <SvgIcon fontSize="small">
                    <BookmarkIcon />
                  </SvgIcon>
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: "text.primary",
                    flexGrow: 1,
                    fontSize: 14,
                    mx: "12px",
                    transition: "opacity 250ms ease-in-out",
                    ...(collapse && { opacity: 0 }),
                  }}
                >
                  Quick Access
                </Box>
                <Tooltip
                  title="Hover over any menu item and click the bookmark icon to add it here"
                  arrow
                  placement="right"
                >
                  <SvgIcon
                    sx={{
                      color: "neutral.500",
                      fontSize: 16,
                      transition: "opacity 250ms ease-in-out",
                      mr: 0.5,
                      cursor: "default",
                      "&:hover": { color: "primary.main" },
                      ...(collapse && { opacity: 0 }),
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InfoOutlined />
                  </SvgIcon>
                </Tooltip>
                <SvgIcon
                  sx={{
                    color: "neutral.500",
                    fontSize: 16,
                    transition: "opacity 250ms ease-in-out",
                    ...(collapse && { opacity: 0 }),
                  }}
                >
                  {quickAccessOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </SvgIcon>
              </ButtonBase>
              <Collapse in={!collapse && quickAccessOpen} unmountOnExit>
                <Stack
                  component="ul"
                  spacing={0.5}
                  sx={{ listStyle: "none", m: 0, p: 0 }}
                >
                  {bookmarks.length === 0 ? (
                    <li>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ px: "18px", py: "8px", fontSize: 13 }}
                      >
                        No items yet
                      </Typography>
                    </li>
                  ) : (
                    bookmarks.map((bookmark, idx) => (
                      <li key={bookmark.path || idx}>
                        <ButtonBase
                          component={NextLink}
                          href={bookmark.path}
                          sx={{
                            alignItems: "center",
                            borderRadius: 1,
                            display: "flex",
                            fontFamily: (theme) => theme.typography.fontFamily,
                            fontSize: 13,
                            fontWeight: 500,
                            justifyContent: "flex-start",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                            width: "100%",
                            px: "9px",
                            py: "8px",
                            ml: "24px",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "rgba(0, 0, 0, 0.04)",
                              transform: "translateX(4px)",
                            },
                            ...(pathname === bookmark.path && {
                              backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(83, 165, 219, 0.12)"
                                  : "rgba(83, 165, 219, 0.08)",
                            }),
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              color:
                                pathname === bookmark.path
                                  ? "primary.main"
                                  : "text.secondary",
                              flexGrow: 1,
                              fontSize: 13,
                              transition: "opacity 250ms ease-in-out",
                              ...(collapse && { opacity: 0 }),
                            }}
                          >
                            {bookmark.label}
                          </Box>
                        </ButtonBase>
                      </li>
                    ))
                  )}
                </Stack>
              </Collapse>
            </li>
            <Divider sx={{ my: 1, transition: "opacity 250ms ease-in-out", ...(collapse && { opacity: 0 }) }} />
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
  );
});

SideNav.displayName = "SideNav";

SideNav.propTypes = {
  onPin: PropTypes.func,
  pinned: PropTypes.bool,
};
