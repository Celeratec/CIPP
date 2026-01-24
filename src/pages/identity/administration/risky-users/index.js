import { Layout as DashboardLayout } from "/src/layouts/index.js";
import { CippTablePage } from "/src/components/CippComponents/CippTablePage.jsx";
import { CippQuickActions } from "/src/components/CippComponents/CippActionMenu";
import { getCippFormatting } from "/src/utils/get-cipp-formatting";
import { Chip, Divider, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AccessTime,
  Clear,
  Key,
  Password,
  PhonelinkSetup,
  PersonOff,
  Search,
  WarningAmber,
  ReportProblem,
} from "@mui/icons-material";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { ApiGetCall } from "/src/api/ApiCall";

const Page = () => {
  const pageTitle = "Risky Users";
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down("md"));
  const auth = ApiGetCall({ url: "/api/me", queryKey: "authmecipp" });
  const currentUser = auth.data?.clientPrincipal?.userDetails || "anonymous";

  const actions = [
    {
      label: "Dismiss Risk",
      type: "POST",
      icon: <Clear />,
      url: "/api/ExecDismissRiskyUser",
      data: { userId: "id", userDisplayName: "userDisplayName" },
      confirmText: "Are you sure you want to dismiss the risk for this user?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
    {
      label: "Research Compromised Account",
      type: "GET",
      icon: <Search />,
      link: "/identity/administration/users/user/bec?userId=[id]",
      confirmText: "Are you sure you want to research this compromised account?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
    {
      label: "Remediate User",
      type: "POST",
      icon: <ShieldCheckIcon />,
      url: "/api/execBecRemediate",
      data: { userId: "id", username: "userPrincipalName" },
      confirmText:
        "This will remediate this user, blocking their signin, resetting their password, disconnecting their sessions, and disabling all their inbox rules. Are you sure you want to continue?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
    {
      label: "Reset Password",
      type: "POST",
      icon: <Password />,
      url: "/api/ExecResetPass",
      data: { ID: "userPrincipalName", displayName: "userDisplayName" },
      fields: [
        {
          type: "switch",
          name: "MustChange",
          label: "Must Change Password at Next Logon",
        },
      ],
      confirmText: "Are you sure you want to reset the password for [userPrincipalName]?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
    {
      label: "Re-require MFA registration",
      type: "POST",
      icon: <PhonelinkSetup />,
      url: "/api/ExecResetMFA",
      data: { ID: "userPrincipalName" },
      confirmText: "Are you sure you want to reset MFA for [userPrincipalName]?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
    {
      label: "Revoke all user sessions",
      type: "POST",
      icon: <PersonOff />,
      url: "/api/ExecRevokeSessions",
      data: { ID: "id", Username: "userPrincipalName" },
      confirmText: "Are you sure you want to revoke all sessions for [userPrincipalName]?",
      multiPost: false,
      category: "security",
      quickAction: true,
    },
  ];

  const offCanvas = {
    extendedInfoFields: [
      "id",
      "userDisplayName",
      "userPrincipalName",
      "riskLastUpdatedDateTime",
      "riskLevel",
      "riskState",
      "riskDetail",
    ],
    actions: actions,
    title: "Risky User Details",
    children: (row) => (
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{row.userDisplayName || "Unknown User"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {row.userPrincipalName}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            size="small"
            label={`State: ${formatLabel(row.riskState)}`}
            color={riskStateColor(row.riskState)}
            variant="filled"
          />
          <Chip
            size="small"
            label={`Level: ${formatLabel(row.riskLevel)}`}
            color={riskLevelColor(row.riskLevel)}
            variant="outlined"
          />
        </Stack>
        <Divider />
        <Stack spacing={0.75}>
          <Typography variant="subtitle2">Risk Detail</Typography>
          <Typography variant="body2" color="text.secondary">
            {row.riskDetail || "—"}
          </Typography>
        </Stack>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2">Last Updated</Typography>
          <Typography variant="body2" color="text.secondary">
            {getCippFormatting(row.riskLastUpdatedDateTime, "riskLastUpdatedDateTime")}
          </Typography>
        </Stack>
      </Stack>
    ),
  };

  const formatLabel = (value) => {
    if (!value) return "Unknown";
    return String(value)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (match) => match.toUpperCase());
  };

  const riskStateColor = (state) => {
    switch (String(state || "").toLowerCase()) {
      case "atrisk":
      case "confirmedcompromised":
        return "error";
      case "remediated":
        return "success";
      case "dismissed":
        return "default";
      default:
        return "warning";
    }
  };

  const riskLevelColor = (level) => {
    switch (String(level || "").toLowerCase()) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      case "none":
        return "default";
      default:
        return "secondary";
    }
  };

  const riskPriority = (row) => {
    const state = String(row?.riskState || "").toLowerCase();
    if (state === "atrisk" || state === "confirmedcompromised") return 0;
    if (state === "remediated") return 1;
    if (state === "dismissed") return 2;
    return 3;
  };

  const columns = [
    {
      id: "riskPriority",
      header: "Risk Priority",
      accessorFn: (row) => riskPriority(row),
      sortingFn: "basic",
    },
    {
      id: "user",
      header: "User",
      accessorFn: (row) => row.userDisplayName || row.userPrincipalName || "",
      Cell: ({ row }) => (
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {row.original.userDisplayName || "Unknown User"}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {row.original.userPrincipalName}
          </Typography>
        </Stack>
      ),
      size: 220,
    },
    {
      id: "riskBadges",
      header: "Risk",
      accessorFn: (row) => `${row.riskState || ""}-${row.riskLevel || ""}`,
      enableSorting: false,
      Cell: ({ row }) => (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            size="small"
            label={formatLabel(row.original.riskState)}
            color={riskStateColor(row.original.riskState)}
            variant="filled"
          />
          <Chip
            size="small"
            label={formatLabel(row.original.riskLevel)}
            color={riskLevelColor(row.original.riskLevel)}
            variant="outlined"
          />
        </Stack>
      ),
      size: 180,
    },
    {
      id: "riskDetail",
      accessorKey: "riskDetail",
      header: "Details",
      Cell: ({ row }) => (
        <Typography
          variant="body2"
          color="text.secondary"
          title={row.original.riskDetail || ""}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {row.original.riskDetail || "—"}
        </Typography>
      ),
      size: 260,
    },
    {
      id: "riskLastUpdatedDateTime",
      accessorKey: "riskLastUpdatedDateTime",
      header: "Last Updated",
      Cell: ({ row }) =>
        getCippFormatting(row.original.riskLastUpdatedDateTime, "riskLastUpdatedDateTime"),
      size: 160,
    },
    {
      id: "rowActions",
      header: "Actions",
      enableSorting: false,
      Cell: ({ row }) => (
        <CippQuickActions
          actions={actions}
          data={row.original}
          maxActions={4}
          size="small"
          variant="button"
        />
      ),
      size: 220,
    },
  ];

  const cardConfig = {
    title: "userDisplayName",
    subtitle: "userPrincipalName",
    avatar: {
      field: "userDisplayName",
      photoField: false,
    },
    badges: [
      {
        field: "riskState",
        tooltip: "Risk State",
        iconOnly: true,
        conditions: {
          atRisk: { color: "error", icon: <WarningAmber fontSize="small" /> },
          confirmedCompromised: { color: "error", icon: <WarningAmber fontSize="small" /> },
          remediated: { color: "success", icon: <WarningAmber fontSize="small" /> },
          dismissed: { color: "secondary", icon: <WarningAmber fontSize="small" /> },
        },
      },
      {
        field: "riskLevel",
        tooltip: "Risk Level",
        iconOnly: true,
        conditions: {
          high: { color: "error", icon: <ReportProblem fontSize="small" /> },
          medium: { color: "warning", icon: <ReportProblem fontSize="small" /> },
          low: { color: "info", icon: <ReportProblem fontSize="small" /> },
          none: { color: "secondary", icon: <ReportProblem fontSize="small" /> },
        },
      },
    ],
    extraFields: [
      { field: "riskState", icon: <WarningAmber />, label: "Risk State" },
      { field: "riskLevel", icon: <ReportProblem />, label: "Risk Level" },
    ],
    extraFieldsMax: 2,
    desktopFields: [
      { field: "riskDetail", icon: <Key />, label: "Details" },
      { field: "riskLastUpdatedDateTime", icon: <AccessTime />, label: "Updated" },
    ],
    desktopFieldsLayout: "column",
    desktopFieldsMax: 2,
    maxQuickActions: 6,
    quickActionsVariant: "button",
    cardGridProps: {
      md: 6,
      lg: 4,
    },
  };

  const filterList = [
    {
      filterName: "Users at Risk",
      value: [{ id: "riskState", value: "atRisk" }],
      type: "column",
    },
    {
      filterName: "Dismissed Users",
      value: [{ id: "riskState", value: "dismissed" }],
      type: "column",
    },
    {
      filterName: "Remediated Users",
      value: [{ id: "riskState", value: "remediated" }],
      type: "column",
    },
  ];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListGraphRequest"
      apiData={{
        Endpoint: "identityProtection/riskyUsers",
        manualPagination: true,
        $count: true,
        $orderby: "riskLastUpdatedDateTime desc",
        $top: 500,
      }}
      apiDataKey="Results"
      actions={[]}
      offCanvas={offCanvas}
      columns={columns}
      columnVisibility={{ riskPriority: false }}
      defaultSorting={[
        { id: "riskPriority", desc: false },
        { id: "riskLastUpdatedDateTime", desc: true },
      ]}
      cardConfig={cardConfig}
      defaultViewMode="cards"
      viewModeStorageKey={`cipp-view-mode-${currentUser}-risky-users`}
      rowSx={(row) => {
        const color = riskStateColor(row?.riskState);
        if (color === "default") {
          return {
            backgroundColor: alpha(theme.palette.grey[200], 0.35),
            "&:hover": { backgroundColor: alpha(theme.palette.grey[200], 0.5) },
          };
        }
        return {
          backgroundColor: alpha(theme.palette[color].main, 0.08),
          "&:hover": { backgroundColor: alpha(theme.palette[color].main, 0.12) },
        };
      }}
      filters={filterList}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
