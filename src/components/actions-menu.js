import ChevronDownIcon from "@heroicons/react/24/outline/ChevronDownIcon";
import PropTypes from "prop-types";
import {
  Button,
  Divider,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  SvgIcon,
} from "@mui/material";
import { useMemo, useState } from "react";
import { usePopover } from "../hooks/use-popover";
import { useDialog } from "../hooks/use-dialog";
import { CippApiDialog } from "./CippComponents/CippApiDialog";

export const ActionsMenu = (props) => {
  const { actions = [], label = "Actions", data, queryKeys, ...other } = props;
  const popover = usePopover();
  const [actionData, setActionData] = useState({ data: {}, action: {}, ready: false });
  const createDialog = useDialog();

  const groupedActions = useMemo(() => {
    const filtered = actions?.filter((action) => !action.link || action.showInActionsMenu) || [];
    const grouped = filtered.reduce((acc, action) => {
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
  const handleActionDisabled = (row, action) => {
    //add nullsaftey for row. It can sometimes be undefined(still loading) or null(no data)
    if (!row) {
      return true;
    }
    if (action?.condition) {
      return !action?.condition(row);
    }
    return false;
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
        }}
      >
        {label}
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
                  ? { minWidth: "30px", color: actionColor }
                  : { minWidth: "30px", color: (theme) => theme.palette[actionColor].main };

              return (
                <MenuItem
                  disabled={handleActionDisabled(data, action)}
                  key={`${category}-${index}`}
                  onClick={() => {
                    setActionData({
                      data: data,
                      action: action,
                      ready: true,
                    });

                    if (action?.noConfirm && action.customFunction) {
                      action.customFunction(data, action, {});
                    } else {
                      createDialog.handleOpen();
                      popover.handleClose();
                    }
                  }}
                >
                  <SvgIcon fontSize="small" sx={iconSx}>
                    {action.icon}
                  </SvgIcon>
                  <ListItemText>{action.label}</ListItemText>
                </MenuItem>
              );
            })}
            {groupIndex < groupedActions.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </div>
        ))}
      </Menu>
      {actionData.ready && (
        <CippApiDialog
          createDialog={createDialog}
          title="Confirmation"
          fields={actionData.action?.fields}
          api={actionData.action}
          row={actionData.data}
          relatedQueryKeys={queryKeys}
          {...actionData.action}
        />
      )}
    </>
  );
};

ActionsMenu.propTypes = {
  actions: PropTypes.array,
  label: PropTypes.string,
};
