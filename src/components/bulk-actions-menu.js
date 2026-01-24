import PropTypes from "prop-types";
import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import { Button, Divider, Link, ListItemText, ListSubheader, Menu, MenuItem, SvgIcon } from "@mui/material";
import { useMemo } from "react";
import { usePopover } from "../hooks/use-popover";
import { FilePresent, Laptop, Mail, Share, Shield, ShieldMoon, PrecisionManufacturing, BarChart } from "@mui/icons-material";
import { GlobeAltIcon, UsersIcon, ServerIcon } from "@heroicons/react/24/outline";

function getIconByName(iconName) {
  switch (iconName) {
    case "GlobeAltIcon":
      return <GlobeAltIcon />;
    case "Mail":
      return <Mail />;
    case "UsersIcon":
      return <UsersIcon />;
    case "FilePresent":
      return <FilePresent />;
    case "ServerIcon":
      return <ServerIcon />;
    case "Laptop":
      return <Laptop />;
    case "Share":
      return <Share />;
    case "Shield":
      return <Shield />;
    case "ShieldMoon":
      return <ShieldMoon />;
    case "PrecisionManufacturing":
      return <PrecisionManufacturing />;
    case "BarChart":
      return <BarChart />;
    default:
      return null;
  }
}

export const BulkActionsMenu = (props) => {
  const { buttonName, sx, row, actions = [], ...other } = props;
  const popover = usePopover();
  const groupedActions = useMemo(() => {
    const grouped = actions.reduce((acc, action) => {
      const category =
        typeof action.category === "string" && action.category.trim().length > 0
          ? action.category.trim()
          : "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(action);
      return acc;
    }, {});
    return Object.entries(grouped);
  }, [actions]);

  const getCategoryLabel = (category) =>
    category
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (match) => match.toUpperCase());

  const getActionColor = (action, category) => {
    if (action.color) return action.color;
    switch (category.toLowerCase()) {
      case "view":
        return "success";
      case "edit":
        return "info";
      case "security":
        return "warning";
      case "manage":
        return "secondary";
      case "danger":
        return "error";
      default:
        return "text.secondary";
    }
  };

  return (
    <>
      <Button
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        startIcon={
          <SvgIcon fontSize="small">
            <ChevronDownIcon />
          </SvgIcon>
        }
        variant="outlined"
        sx={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          ...sx,
        }}
        {...other}
      >
        {buttonName}
      </Button>
      <Menu
        anchorEl={popover.anchorRef.current}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        MenuListProps={{
          dense: true,
          sx: { p: 1 },
        }}
        onClose={popover.handleClose}
        open={popover.open}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
      >
        {groupedActions.map(([category, categoryActions], groupIndex) => (
          <div key={category}>
            <ListSubheader
              disableSticky
              sx={{
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                fontWeight: 600,
                lineHeight: 1.8,
              }}
            >
              {getCategoryLabel(category)}
            </ListSubheader>
            {categoryActions.map((action, index) => {
              const actionColor = getActionColor(action, category);
              const iconSx =
                actionColor === "text.secondary"
                  ? { mr: 1, color: actionColor }
                  : { mr: 1, color: (theme) => theme.palette[actionColor].main };

              if (action.link) {
                return (
                  <MenuItem
                    key={`${category}-${index}`}
                    onClick={popover.handleClose}
                    component={Link}
                    href={action.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <SvgIcon sx={iconSx}>{getIconByName(action.icon)}</SvgIcon>
                    <ListItemText primary={action.label} />
                  </MenuItem>
                );
              }
              return (
                <MenuItem key={`${category}-${index}`} onClick={action.onClick}>
                  <SvgIcon sx={iconSx}>{getIconByName(action.icon)}</SvgIcon>
                  <ListItemText primary={action.label} />
                </MenuItem>
              );
            })}
            {groupIndex < groupedActions.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </div>
        ))}
      </Menu>
    </>
  );
};

BulkActionsMenu.propTypes = {
  onArchive: PropTypes.func,
  onDelete: PropTypes.func,
  selectedCount: PropTypes.number,
};
