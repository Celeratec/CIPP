import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import { CippTablePage } from "../../../../components/CippComponents/CippTablePage.jsx";
import { Button } from "@mui/material";
import { Delete, GroupAdd, Public, PublicOff, Description, Fingerprint } from "@mui/icons-material";
import Link from "next/link";
import { Edit } from "@mui/icons-material";

const Page = () => {
  const pageTitle = "Teams";

  // Card view configuration (works for both mobile and desktop)
  const cardConfig = {
    title: "displayName",
    subtitle: "mailNickname",
    avatar: {
      field: "displayName",
    },
    badges: [
      {
        field: "visibility",
        conditions: {
          Public: { label: "Public Team - Anyone in org can join", color: "success", icon: <Public fontSize="small" /> },
          Private: { label: "Private Team - Invite only", color: "warning", icon: <PublicOff fontSize="small" /> },
        },
      },
    ],
    extraFields: [
      { field: "description", icon: <Description />, maxLines: 2 },
    ],
    // Additional fields shown only on desktop cards
    desktopFields: [
      { field: "id", label: "Team ID", icon: <Fingerprint /> },
    ],
    // Grid sizing for consistent card widths
    cardGridProps: {
      xs: 12,
      sm: 6,
      md: 4,
      lg: 3,
    },
  };

  const actions = [
    {
      label: "Edit Group",
      link: "/identity/administration/groups/edit?groupId=[id]&groupType=Microsoft 365",
      multiPost: false,
      color: "warning",
      icon: <Edit />,
      category: "edit",
    },
    {
      label: "Delete Team",
      type: "POST",
      url: "/api/ExecGroupsDelete",
      icon: <Delete />,
      data: {
        ID: "id",
        GroupType: "!Microsoft 365",
        DisplayName: "displayName",
      },
      confirmText: "Are you sure you want to delete this team?",
      multiPost: false,
      category: "danger",
    },
  ];

  return (
    <CippTablePage
      title={pageTitle}
      apiUrl="/api/ListTeams?type=list"
      actions={actions}
      simpleColumns={["displayName", "description", "visibility", "mailNickname", "id"]}
      cardButton={
        <>
          <Button component={Link} href="/teams-share/teams/list-team/add" startIcon={<GroupAdd />}>
            Add Team
          </Button>
        </>
      }
      cardConfig={cardConfig}
      offCanvasOnRowClick={true}
    />
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
