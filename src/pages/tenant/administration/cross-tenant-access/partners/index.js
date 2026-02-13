import { Layout as DashboardLayout } from "../../../../../layouts/index.js";
import { CippTablePage } from "../../../../../components/CippComponents/CippTablePage.jsx";
import { Button, Chip } from "@mui/material";
import { Add } from "@mui/icons-material";
import Link from "next/link";

const Page = () => {
  const pageTitle = "Partner Organizations";

  const actions = [
    {
      label: "Edit Partner",
      link: "/tenant/administration/cross-tenant-access/partners/partner?tenantId=[tenantId]",
      color: "info",
      icon: "Edit",
    },
    {
      label: "Remove Partner",
      type: "POST",
      url: "/api/ExecRemoveCrossTenantPartner",
      data: {
        partnerTenantId: "tenantId",
      },
      confirmText: "Are you sure you want to remove this partner configuration?",
      color: "danger",
      icon: "Delete",
      relatedQueryKeys: ["CrossTenantPartners"],
    },
  ];

  const columns = [
    {
      header: "Partner Tenant ID",
      accessorKey: "tenantId",
      size: 300,
    },
    {
      header: "Partner Name",
      accessorKey: "partnerName",
      size: 200,
    },
    {
      header: "Service Provider",
      accessorKey: "isServiceProvider",
      size: 120,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue() ? "Yes" : "No"}
          size="small"
          color={cell.getValue() ? "info" : "default"}
        />
      ),
    },
    {
      header: "Multi-Tenant Org",
      accessorKey: "isInMultiTenantOrganization",
      size: 120,
      Cell: ({ cell }) => (
        <Chip
          label={cell.getValue() ? "Yes" : "No"}
          size="small"
          color={cell.getValue() ? "info" : "default"}
        />
      ),
    },
    {
      header: "B2B Collab Inbound",
      accessorKey: "b2bCollaborationInbound",
      size: 150,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        const access = val?.usersAndGroups?.accessType ?? "inherited";
        return (
          <Chip
            label={access.charAt(0).toUpperCase() + access.slice(1)}
            size="small"
            color={access === "allowed" ? "success" : access === "blocked" ? "error" : "default"}
          />
        );
      },
    },
    {
      header: "B2B Collab Outbound",
      accessorKey: "b2bCollaborationOutbound",
      size: 150,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        const access = val?.usersAndGroups?.accessType ?? "inherited";
        return (
          <Chip
            label={access.charAt(0).toUpperCase() + access.slice(1)}
            size="small"
            color={access === "allowed" ? "success" : access === "blocked" ? "error" : "default"}
          />
        );
      },
    },
    {
      header: "B2B Direct Connect In",
      accessorKey: "b2bDirectConnectInbound",
      size: 150,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        const access = val?.usersAndGroups?.accessType ?? "inherited";
        return (
          <Chip
            label={access.charAt(0).toUpperCase() + access.slice(1)}
            size="small"
            color={access === "allowed" ? "success" : access === "blocked" ? "error" : "default"}
          />
        );
      },
    },
    {
      header: "Trust MFA",
      accessorKey: "inboundTrust",
      size: 100,
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return (
          <Chip
            label={val?.isMfaAccepted ? "Yes" : "No"}
            size="small"
            color={val?.isMfaAccepted ? "success" : "default"}
          />
        );
      },
    },
  ];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListCrossTenantPartners"
      apiDataKey="Results"
      columns={columns}
      actions={actions}
      queryKey="CrossTenantPartners"
      cardButton={
        <Link href="/tenant/administration/cross-tenant-access/partners/partner" passHref>
          <Button variant="contained" startIcon={<Add />} size="small">
            Add Partner Organization
          </Button>
        </Link>
      }
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
