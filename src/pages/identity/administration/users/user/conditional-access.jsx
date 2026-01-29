import { useState } from "react";
import { Layout as DashboardLayout } from "../../../../../layouts/index.js";
import { useSettings } from "../../../../../hooks/use-settings";
import { useRouter } from "next/router";
import CippFormSkeleton from "../../../../../components/CippFormPages/CippFormSkeleton";
import CalendarIcon from "@heroicons/react/24/outline/CalendarIcon";
import { 
  Mail, 
  Fingerprint, 
  Launch,
  Apps,
  LocationOn,
  Devices,
  Warning,
} from "@mui/icons-material";
import { HeaderedTabbedLayout } from "../../../../../layouts/HeaderedTabbedLayout";
import tabOptions from "./tabOptions";
import { CippCopyToClipBoard } from "../../../../../components/CippComponents/CippCopyToClipboard";
import { CippTimeAgo } from "../../../../../components/CippComponents/CippTimeAgo";
import { Box, Stack, Typography, Button, Divider } from "@mui/material";
import { Grid } from "@mui/system";
import CippFormComponent from "../../../../../components/CippComponents/CippFormComponent";
import countryList from "../../../../../data/countryList";
import { CippDataTable } from "../../../../../components/CippTable/CippDataTable";
import { useForm } from "react-hook-form";
import CippButtonCard from "../../../../../components/CippCards/CippButtonCard";
import { ApiGetCall, ApiPostCall } from "../../../../../api/ApiCall";
import { CippApiResults } from "../../../../../components/CippComponents/CippApiResults";
import { useCippUserActions } from "../../../../../components/CippComponents/CippUserActions";

const Page = () => {
  const userSettingsDefaults = useSettings();
  const router = useRouter();
  const { userId } = router.query;

  const tenant = userSettingsDefaults.currentTenant;
  const [formParams, setFormParams] = useState(false);
  const userActions = useCippUserActions();

  const userRequest = ApiGetCall({
    url: `/api/ListUsers?UserId=${userId}&tenantFilter=${tenant}`,
    queryKey: `ListUsers-${userId}`,
  });

  // Set the title and subtitle for the layout
  const title = userRequest.isSuccess ? userRequest.data?.[0]?.displayName : "Loading...";

  const subtitle = userRequest.isSuccess
    ? [
        {
          icon: <Mail />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.userPrincipalName} />,
        },
        {
          icon: <Fingerprint />,
          text: <CippCopyToClipBoard type="chip" text={userRequest.data?.[0]?.id} />,
        },
        {
          icon: <CalendarIcon />,
          text: (
            <>
              Created: <CippTimeAgo data={userRequest.data?.[0]?.createdDateTime} />
            </>
          ),
        },
        {
          icon: <Launch style={{ color: "#757575" }} />,
          text: (
            <Button
              color="muted"
              style={{ paddingLeft: 0 }}
              size="small"
              href={`https://entra.microsoft.com/${userSettingsDefaults.currentTenant}/#view/Microsoft_AAD_UsersAndTenants/UserProfileMenuBlade/~/overview/userId/${userId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Entra
            </Button>
          ),
        },
      ]
    : [];

  // Initialize React Hook Form
  const formControl = useForm();

  const postRequest = ApiPostCall({
    url: "/api/ExecCACheck",
    relatedQueryKeys: `ExecCACheck-${tenant}-${userId}-${JSON.stringify(formParams)}`,
  });
  const onSubmit = (data) => {
    //add userId and tenantFilter to the object
    data.userId = {};
    data.userId["value"] = userId;
    data.tenantFilter = tenant;
    setFormParams(data);
    postRequest.mutate({
      url: "/api/ExecCACheck",
      data: data,
      queryKey: `ExecCACheck-${tenant}-${userId}-${JSON.stringify(formParams)}`,
    });
  };

  return (
    <HeaderedTabbedLayout
      tabOptions={tabOptions}
      title={title}
      subtitle={subtitle}
      actions={userActions}
      actionsData={userRequest.data?.[0]}
      isFetching={userRequest.isLoading}
    >
      {userRequest.isLoading && <CippFormSkeleton layout={[2, 1, 2, 2]} />}
      {userRequest.isSuccess && (
        <Box
          sx={{
            flexGrow: 1,
            py: 1,
          }}
        >
          <Grid container spacing={2}>
            {/* Form Section */}
            <Grid size={{ md: 4, xs: 12 }}>
              <CippButtonCard
                title={"Test Conditional Access Policy"}
                CardButton={
                  <Button type="submit" variant="contained" form="ca-test-form">
                    Test Policies
                  </Button>
                }
              >
                {/* Form Starts Here */}
                <form id="ca-test-form" onSubmit={formControl.handleSubmit(onSubmit)}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Simulate a sign-in to see which policies would apply and their results.
                  </Typography>

                  <Stack spacing={2.5}>
                    {/* Application Selection */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Apps fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Application
                        </Typography>
                      </Stack>
                      <CippFormComponent
                        type="autoComplete"
                        label="Target Application"
                        name="includeApplications"
                        multiple={false}
                        api={{
                          tenantFilter: tenant,
                          url: "/api/ListGraphRequest",
                          dataKey: "Results",
                          labelField: (option) => `${option.displayName}`,
                          valueField: "id",
                          queryKey: `ServicePrincipals-${tenant}`,
                          data: {
                            Endpoint: "ServicePrincipals",
                            manualPagination: true,
                            $select: "id,displayName",
                            $count: true,
                            $orderby: "displayName",
                            $top: 999,
                          },
                        }}
                        formControl={formControl}
                      />
                    </Box>

                    <Divider />

                    {/* Location Context */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <LocationOn fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Location Context
                        </Typography>
                      </Stack>
                      <Stack spacing={2}>
                        <CippFormComponent
                          type="autoComplete"
                          label="Country"
                          name="country"
                          options={countryList.map(({ Code, Name }) => ({
                            value: Code,
                            label: Name,
                          }))}
                          formControl={formControl}
                        />
                        <CippFormComponent
                          type="textField"
                          label="IP Address"
                          name="IpAddress"
                          placeholder="e.g., 8.8.8.8"
                          formControl={formControl}
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Device Context */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Devices fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Device Context
                        </Typography>
                      </Stack>
                      <Stack spacing={2}>
                        <CippFormComponent
                          type="autoComplete"
                          label="Platform"
                          name="devicePlatform"
                          options={[
                            { value: "Windows", label: "Windows" },
                            { value: "iOS", label: "iOS" },
                            { value: "Android", label: "Android" },
                            { value: "MacOS", label: "macOS" },
                            { value: "Linux", label: "Linux" },
                          ]}
                          formControl={formControl}
                        />
                        <CippFormComponent
                          type="autoComplete"
                          label="Client App Type"
                          name="clientAppType"
                          options={[
                            { value: "all", label: "All" },
                            { value: "Browser", label: "Browser" },
                            { value: "mobileAppsAndDesktopClients", label: "Mobile/Desktop Apps" },
                            { value: "exchangeActiveSync", label: "Exchange ActiveSync" },
                            { value: "easSupported", label: "EAS Supported" },
                            { value: "other", label: "Other Clients" },
                          ]}
                          formControl={formControl}
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Risk Levels */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Warning fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Risk Levels
                        </Typography>
                      </Stack>
                      <Stack spacing={2}>
                        <CippFormComponent
                          type="autoComplete"
                          label="Sign-in Risk"
                          name="SignInRiskLevel"
                          options={[
                            { value: "none", label: "None" },
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                          ]}
                          formControl={formControl}
                        />
                        <CippFormComponent
                          type="autoComplete"
                          label="User Risk"
                          name="userRiskLevel"
                          options={[
                            { value: "none", label: "None" },
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                          ]}
                          formControl={formControl}
                        />
                      </Stack>
                    </Box>

                    <CippApiResults apiObject={postRequest} errorsOnly={true} />
                  </Stack>
                </form>
              </CippButtonCard>
            </Grid>
            <Grid size={{ md: 8, xs: 12 }}>
              <CippDataTable
                queryKey={`ExecCACheck-${tenant}-${userId}-${JSON.stringify(formParams)}`}
                title={"CA Test Results"}
                simple={true}
                simpleColumns={["displayName", "state", "policyApplies", "reasons"]}
                data={postRequest.data?.data?.Results?.value || []}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </HeaderedTabbedLayout>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
