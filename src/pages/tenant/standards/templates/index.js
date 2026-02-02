import { Alert, Button } from "@mui/material";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { TabbedLayout } from "../../../../layouts/TabbedLayout";
import Link from "next/link";
import { CopyAll, Delete, PlayArrow, AddBox, Edit, GitHub, ContentCopy } from "@mui/icons-material";
import { ApiGetCall, ApiPostCall } from "../../../../api/ApiCall";
import { Grid, Stack } from "@mui/system";
import { CippApiResults } from "../../../../components/CippComponents/CippApiResults";
import { EyeIcon } from "@heroicons/react/24/outline";
import tabOptions from "../tabOptions.json";
import { useSettings } from "../../../../hooks/use-settings.js";
import { CippPolicyImportDrawer } from "../../../../components/CippComponents/CippPolicyImportDrawer.jsx";
import { PermissionButton } from "../../../../utils/permissions.js";
import { CippRemovableTenantChips } from "../../../../components/CippComponents/CippRemovableTenantChips";
import { getCippFormatting } from "../../../../utils/get-cipp-formatting";
import { getCippTranslation } from "../../../../utils/get-cipp-translation";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage";

const Page = () => {
  const oldStandards = ApiGetCall({ url: "/api/ListStandards", queryKey: "ListStandards-legacy" });
  const integrations = ApiGetCall({
    url: "/api/ListExtensionsConfig",
    queryKey: "Integrations",
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const currentTenant = useSettings().currentTenant;
  const pageTitle = "Templates";
  const cardButtonPermissions = ["Tenant.Standards.ReadWrite"];
  const actions = [
    {
      label: "View Tenant Report",
      link: "/tenant/manage/applied-standards/?templateId=[GUID]",
      icon: <EyeIcon />,
      color: "info",
      target: "_self",
    },
    {
      label: "Edit Template",
      //when using a link it must always be the full path /identity/administration/users/[id] for example.
      link: "/tenant/standards/templates/template?id=[GUID]&type=[type]",
      icon: <Edit />,
      color: "success",
      target: "_self",
    },
    {
      label: "Clone & Edit Template",
      link: "/tenant/standards/templates/template?id=[GUID]&clone=true&type=[type]",
      icon: <CopyAll />,
      color: "success",
      target: "_self",
    },
    {
      label: "Create Drift Clone",
      type: "POST",
      url: "/api/ExecDriftClone",
      icon: <ContentCopy />,
      color: "warning",
      data: {
        id: "GUID",
      },
      confirmText:
        "Are you sure you want to create a drift clone of [templateName]? This will create a new drift template based on this template.",
      multiPost: false,
    },
    {
      label: `Run Template Now (${currentTenant || "Currently Selected Tenant"})`,
      type: "GET",
      url: "/api/ExecStandardsRun",
      icon: <PlayArrow />,
      data: {
        TemplateId: "GUID",
      },
      confirmText: "Are you sure you want to force a run of this template?",
      multiPost: false,
    },
    {
      label: "Run Template Now (All Tenants in Template)",
      type: "GET",
      url: "/api/ExecStandardsRun",
      icon: <PlayArrow />,
      data: {
        TemplateId: "GUID",
        tenantFilter: "allTenants",
      },
      confirmText: "Are you sure you want to force a run of this template?",
      multiPost: false,
    },
    {
      label: "Save to GitHub",
      type: "POST",
      url: "/api/ExecCommunityRepo",
      icon: <GitHub />,
      data: {
        Action: "UploadTemplate",
        GUID: "GUID",
      },
      fields: [
        {
          label: "Repository",
          name: "FullName",
          type: "select",
          api: {
            url: "/api/ListCommunityRepos",
            data: {
              WriteAccess: true,
            },
            queryKey: "CommunityRepos-Write",
            dataKey: "Results",
            valueField: "FullName",
            labelField: "FullName",
          },
          multiple: false,
          creatable: false,
          required: true,
          validators: {
            required: { value: true, message: "This field is required" },
          },
        },
        {
          label: "Commit Message",
          placeholder: "Enter a commit message for adding this file to GitHub",
          name: "Message",
          type: "textField",
          multiline: true,
          required: true,
          rows: 4,
        },
      ],
      confirmText: "Are you sure you want to save this template to the selected repository?",
      condition: () => integrations.isSuccess && integrations?.data?.GitHub?.Enabled,
    },
    {
      label: "Delete Template",
      type: "POST",
      url: "/api/RemoveStandardTemplate",
      icon: <Delete />,
      data: {
        ID: "GUID",
      },
      confirmText: "Are you sure you want to delete [templateName]?",
      multiPost: false,
    },
  ];
  const conversionApi = ApiPostCall({ relatedQueryKeys: "listStandardTemplates" });
  const handleConversion = () => {
    conversionApi.mutate({
      url: "/api/execStandardConvert",
      data: {},
    });
  };
  const queryKey = "listStandardTemplates";

  // Custom columns with removable tenant chips
  const columns = [
    {
      header: getCippTranslation("templateName"),
      id: "templateName",
      accessorKey: "templateName",
      Cell: ({ row }) => getCippFormatting(row.original.templateName, "templateName"),
    },
    {
      header: getCippTranslation("type"),
      id: "type",
      accessorKey: "type",
      Cell: ({ row }) => getCippFormatting(row.original.type, "type"),
    },
    {
      header: "Included Tenants",
      id: "tenantFilter",
      accessorKey: "tenantFilter",
      enableSorting: false,
      Cell: ({ row }) => (
        <CippRemovableTenantChips
          tenants={row.original.tenantFilter}
          templateId={row.original.GUID}
          templateName={row.original.templateName}
          templateData={row.original}
          fieldName="tenantFilter"
          queryKey={queryKey}
          maxDisplay={3}
          emptyMessage="No tenants"
        />
      ),
    },
    {
      header: "Excluded Tenants",
      id: "excludedTenants",
      accessorKey: "excludedTenants",
      enableSorting: false,
      Cell: ({ row }) => (
        <CippRemovableTenantChips
          tenants={row.original.excludedTenants}
          templateId={row.original.GUID}
          templateName={row.original.templateName}
          templateData={row.original}
          fieldName="excludedTenants"
          queryKey={queryKey}
          maxDisplay={3}
          emptyMessage="None"
        />
      ),
    },
    {
      header: getCippTranslation("updatedAt"),
      id: "updatedAt",
      accessorKey: "updatedAt",
      Cell: ({ row }) => getCippFormatting(row.original.updatedAt, "updatedAt"),
    },
    {
      header: getCippTranslation("updatedBy"),
      id: "updatedBy",
      accessorKey: "updatedBy",
      Cell: ({ row }) => getCippFormatting(row.original.updatedBy, "updatedBy"),
    },
    {
      header: getCippTranslation("runManually"),
      id: "runManually",
      accessorKey: "runManually",
      Cell: ({ row }) => getCippFormatting(row.original.runManually, "runManually"),
    },
    {
      header: getCippTranslation("standards"),
      id: "standards",
      accessorKey: "standards",
      Cell: ({ row }) => getCippFormatting(row.original.standards, "standards"),
    },
  ];

  const tableFilter = oldStandards.isSuccess && oldStandards.data.length !== 0 && (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Alert
          severity="warning"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ width: "100%" }}>
            <span>
              You have legacy standards available. Press the button to convert these standards to
              the new format. This will create a new template for each standard you had, but will
              disable the schedule. After conversion, please check the new templates to ensure
              they are correct and re-enable the schedule.
            </span>
            <Button onClick={() => handleConversion()} variant="contained" sx={{ flexShrink: 0 }}>
              Convert Legacy Standards
            </Button>
          </Stack>
        </Alert>
      </Grid>
      {conversionApi.isSuccess && (
        <Grid size={12}>
          <CippApiResults apiObject={conversionApi} />
        </Grid>
      )}
    </Grid>
  );

  const cardButton = (
    <Stack direction="row" spacing={1}>
      <Button
        component={Link}
        href="/tenant/standards/templates/template"
        startIcon={<AddBox />}
      >
        Add Template
      </Button>
      <Button
        component={Link}
        href="/tenant/standards/templates/template?type=drift"
        startIcon={<AddBox />}
      >
        Create Drift Template
      </Button>
      <CippPolicyImportDrawer
        buttonText="Browse Catalog"
        requiredPermissions={cardButtonPermissions}
        PermissionButton={PermissionButton}
        mode="Standards"
      />
    </Stack>
  );

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/listStandardTemplates"
      apiDataKey="Results"
      cardButton={cardButton}
      columns={columns}
      actions={actions}
      queryKey={queryKey}
      tableFilter={tableFilter}
      tenantInTitle={false}
    />
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
