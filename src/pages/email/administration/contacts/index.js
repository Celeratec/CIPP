import { useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { CloudSync, Edit, Business, Work, Badge } from "@mui/icons-material";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { CippAddContactDrawer } from "../../../../components/CippComponents/CippAddContactDrawer";
import { CippDeployContactTemplateDrawer } from "../../../../components/CippComponents/CippDeployContactTemplateDrawer";

const Page = () => {
  const pageTitle = "Contacts";
  const cardButtonPermissions = ["Exchange.Contact.ReadWrite"];
  const router = useRouter();

  const handleCardClick = useCallback((contact) => {
    router.push(`/email/administration/contacts/edit?id=${encodeURIComponent(contact.Guid || contact.id || "")}`);
  }, [router]);

  // Card view configuration (works for both mobile and desktop)
  const cardConfig = {
    title: "DisplayName",
    subtitle: "WindowsEmailAddress",
    avatar: {
      field: "DisplayName",
    },
    badges: [
      {
        field: "IsDirSynced",
        conditions: {
          true: { label: "Synced from On-Premises", color: "info", icon: <CloudSync fontSize="small" /> },
          false: { label: "Cloud-Only Contact", color: "default" },
        },
      },
    ],
    extraFields: [
      { field: "Company", icon: <Business />, maxLines: 1 },
      { field: "Title", icon: <Work />, maxLines: 1 },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "Department", label: "Department", icon: <Badge /> },
    ],
    // Grid sizing for consistent card widths
    cardGridProps: {
      xs: 12,
      sm: 6,
      md: 4,
      lg: 3,
    },
    mobileQuickActions: [
      "Edit Contact",
      "Remove Contact",
    ],
    maxQuickActions: 8,
  };

  const actions = useMemo(
    () => [
      {
        label: "Edit Contact",
        link: "/email/administration/contacts/edit?id=[Guid]",
        multiPost: false,
        postEntireRow: true,
        icon: <Edit />,
        color: "warning",
        condition: (row) => !row.IsDirSynced,
        category: "edit",
        quickAction: true,
      },
      {
        label: "Set Source of Authority",
        type: "POST",
        url: "/api/ExecSetCloudManaged",
        icon: <CloudSync />,
        data: {
          ID: "graphId",
          displayName: "DisplayName",
          type: "!Contact",
        },
        fields: [
          {
            type: "radio",
            name: "isCloudManaged",
            label: "Source of Authority",
            options: [
              { label: "Cloud Managed", value: true },
              { label: "On-Premises Managed", value: false },
            ],
            validators: { required: "Please select a source of authority" },
          },
        ],
        confirmText:
          "Are you sure you want to change the source of authority for '[DisplayName]'? Setting it to On-Premises Managed will take until the next sync cycle to show the change.",
        multiPost: false,
        category: "manage",
      },
      {
        label: "Remove Contact",
        type: "POST",
        url: "/api/RemoveContact",
        data: {
          GUID: "Guid",
          mail: "WindowsEmailAddress",
        },
        confirmText:
          "Are you sure you want to delete this contact? Remember this will not work if the contact is AD Synced.",
        color: "danger",
        icon: <TrashIcon />,
        condition: (row) => !row.IsDirSynced,
        category: "danger",
        quickAction: true,
      },
    ],
    []
  );

  const simpleColumns = ["DisplayName", "WindowsEmailAddress", "Company", "IsDirSynced"];
  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListContacts"
      actions={actions}
      simpleColumns={simpleColumns}
      cardButton={
        <>
          <CippAddContactDrawer requiredPermissions={cardButtonPermissions} />
          <CippDeployContactTemplateDrawer requiredPermissions={cardButtonPermissions} />
        </>
      }
      cardConfig={cardConfig}
      onCardClick={handleCardClick}
      offCanvasOnRowClick={true}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout allTenantsSupport={false}>{page}</DashboardLayout>;
export default Page;
