import { Layout as DashboardLayout } from "../../../layouts/index.js";
import "@mui/material";
import { Alert, Collapse, Divider, Typography } from "@mui/material";
import { Grid } from "@mui/system";
import { useForm, useWatch } from "react-hook-form";
import CippFormComponent from "../../../components/CippComponents/CippFormComponent";
import CippFormPage from "../../../components/CippFormPages/CippFormPage";
import { useSettings } from "../../../hooks/use-settings";

// Common SharePoint languages
const languageOptions = [
  { label: "English (United States)", value: 1033 },
  { label: "English (United Kingdom)", value: 2057 },
  { label: "French (France)", value: 1036 },
  { label: "German (Germany)", value: 1031 },
  { label: "Spanish (Spain)", value: 3082 },
  { label: "Italian (Italy)", value: 1040 },
  { label: "Portuguese (Brazil)", value: 1046 },
  { label: "Dutch (Netherlands)", value: 1043 },
  { label: "Japanese", value: 1041 },
  { label: "Chinese (Simplified)", value: 2052 },
  { label: "Korean", value: 1042 },
  { label: "Swedish", value: 1053 },
  { label: "Norwegian (Bokmål)", value: 1044 },
  { label: "Danish", value: 1030 },
  { label: "Finnish", value: 1035 },
  { label: "Polish", value: 1045 },
  { label: "Russian", value: 1049 },
  { label: "Arabic", value: 1025 },
  { label: "Hebrew", value: 1037 },
];

// Common time zones
const timeZoneOptions = [
  { label: "(UTC-12:00) International Date Line West", value: 0 },
  { label: "(UTC-08:00) Pacific Time (US & Canada)", value: 13 },
  { label: "(UTC-07:00) Mountain Time (US & Canada)", value: 12 },
  { label: "(UTC-06:00) Central Time (US & Canada)", value: 11 },
  { label: "(UTC-05:00) Eastern Time (US & Canada)", value: 10 },
  { label: "(UTC-04:00) Atlantic Time (Canada)", value: 9 },
  { label: "(UTC) Coordinated Universal Time", value: 39 },
  { label: "(UTC+00:00) London, Dublin, Edinburgh", value: 2 },
  { label: "(UTC+01:00) Amsterdam, Berlin, Rome, Paris", value: 4 },
  { label: "(UTC+02:00) Helsinki, Kyiv, Sofia", value: 6 },
  { label: "(UTC+03:00) Moscow, St. Petersburg", value: 51 },
  { label: "(UTC+05:30) Chennai, Kolkata, Mumbai", value: 23 },
  { label: "(UTC+08:00) Beijing, Singapore, Perth", value: 45 },
  { label: "(UTC+09:00) Tokyo, Seoul", value: 46 },
  { label: "(UTC+10:00) Sydney, Melbourne", value: 19 },
  { label: "(UTC+12:00) Auckland, Wellington", value: 17 },
];

const AddSiteForm = () => {
  const userSettingsDefaults = useSettings();
  const formControl = useForm({
    mode: "onChange",
    defaultValues: {
      tenantFilter: userSettingsDefaults.currentTenant,
      templateName: { label: "Communication", value: "Communication" },
      siteDesign: { label: "Blank", value: "Blank" },
      lcid: { label: "English (United States)", value: 1033 },
      shareByEmailEnabled: false,
    },
  });

  // Watch template to show/hide site design options
  const templateName = useWatch({ control: formControl.control, name: "templateName" });
  const siteDesign = useWatch({ control: formControl.control, name: "siteDesign" });

  const isCommunicationSite = templateName?.value === "Communication";
  const isCustomDesign = siteDesign?.value === "Custom";

  return (
    <CippFormPage
      title="Add SharePoint Site"
      postUrl="/api/AddSite"
      formControl={formControl}
      backButtonTitle="Back to Sites"
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Basic Information Section */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Basic Information
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="siteName"
            label="Site Name"
            formControl={formControl}
            required
            placeholder="Enter site name"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="siteOwner"
            label="Site Owner"
            formControl={formControl}
            required
            multiple={false}
            type="autoComplete"
            api={{
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "users",
                $filter: "accountEnabled eq true",
                $top: 999,
                $count: true,
                $orderby: "displayName",
                $select: "id,displayName,userPrincipalName",
              },
              dataKey: "Results",
              labelField: (user) => `${user.displayName} (${user.userPrincipalName})`,
              valueField: "userPrincipalName",
              addedField: {
                id: "id",
              },
            }}
            validators={{
              validate: (value) => {
                if (!value) {
                  return "Site owner is required";
                }
                return true;
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <CippFormComponent
            name="siteDescription"
            label="Site Description"
            formControl={formControl}
            required
            multiline
            rows={2}
            placeholder="Describe the purpose of this site"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
            Site Template & Design
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="templateName"
            label="Site Template"
            formControl={formControl}
            required
            type="autoComplete"
            multiple={false}
            options={[
              { label: "Communication", value: "Communication" },
              { label: "Team Site (No M365 Group)", value: "Team" },
            ]}
            validators={{
              validate: (value) => {
                if (!value) {
                  return "Template is required";
                }
                return true;
              },
            }}
          />
        </Grid>

        <Collapse in={isCommunicationSite} sx={{ width: "100%" }}>
          <Grid container spacing={2} sx={{ pl: 0, pt: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <CippFormComponent
                name="siteDesign"
                label="Site Design"
                formControl={formControl}
                type="autoComplete"
                multiple={false}
                options={[
                  { label: "Blank", value: "Blank" },
                  { label: "Topic - News, events, and content", value: "Topic" },
                  { label: "Showcase - Photos and images", value: "Showcase" },
                  { label: "Custom Site Design", value: "Custom" },
                ]}
              />
            </Grid>

            <Collapse in={isCustomDesign} sx={{ width: "100%" }}>
              <Grid container spacing={2} sx={{ pl: 0, pt: 2 }}>
                <Grid size={{ xs: 12 }}>
                  <CippFormComponent
                    name="customSiteDesignId"
                    label="Custom Site Design"
                    formControl={formControl}
                    type="autoComplete"
                    multiple={false}
                    api={{
                      url: "/api/ListGraphRequest",
                      data: {
                        Endpoint: "sites/root/siteDesigns",
                        $select: "id,title,description",
                      },
                      dataKey: "Results",
                      labelField: (design) =>
                        design.description
                          ? `${design.title} - ${design.description}`
                          : design.title,
                      valueField: "id",
                    }}
                    placeholder="Select a custom site design from your tenant"
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>
        </Collapse>

        <Collapse in={!isCommunicationSite} sx={{ width: "100%" }}>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Team sites without M365 Groups use a standard template. Site designs are only
                available for Communication sites.
              </Alert>
            </Grid>
          </Grid>
        </Collapse>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
            Regional Settings
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="lcid"
            label="Language"
            formControl={formControl}
            type="autoComplete"
            multiple={false}
            options={languageOptions}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="timeZoneId"
            label="Time Zone"
            formControl={formControl}
            type="autoComplete"
            multiple={false}
            options={timeZoneOptions}
            placeholder="Use tenant default"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
            Advanced Options
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="sensitivityLabel"
            label="Sensitivity Label"
            formControl={formControl}
            type="autoComplete"
            multiple={false}
            api={{
              url: "/api/ListGraphRequest",
              data: {
                Endpoint: "security/informationProtection/sensitivityLabels",
                $select: "id,name,description",
                $filter: "isActive eq true",
              },
              dataKey: "Results",
              labelField: (label) =>
                label.description ? `${label.name} - ${label.description}` : label.name,
              valueField: "id",
            }}
            placeholder="None (use tenant default)"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="hubSiteId"
            label="Associate with Hub Site"
            formControl={formControl}
            type="autoComplete"
            multiple={false}
            api={{
              url: "/api/ListSites",
              data: {
                type: "SharePointSiteUsage",
                filter: "IsHubSite eq true",
              },
              dataKey: "Results",
              labelField: (site) => site.SiteUrl || site.displayName || site.Title,
              valueField: "SiteId",
            }}
            placeholder="None"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="storageQuota"
            label="Storage Quota (MB)"
            formControl={formControl}
            type="number"
            placeholder="Use tenant default"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <CippFormComponent
            name="shareByEmailEnabled"
            label="Allow external sharing by email"
            formControl={formControl}
            type="switch"
          />
        </Grid>
      </Grid>
    </CippFormPage>
  );
};

const Page = () => {
  return <AddSiteForm />;
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
