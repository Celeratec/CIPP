import { useEffect, useState } from "react";
import { Layout as DashboardLayout } from "../../../layouts/index.js";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Save, Refresh } from "@mui/icons-material";
import { useSettings } from "../../../hooks/use-settings.js";
import { ApiGetCall, ApiPostCall } from "../../../api/ApiCall.jsx";
import { CippApiResults } from "../../../components/CippComponents/CippApiResults.jsx";
import CippRelatedSettings from "../../../components/CippComponents/CippRelatedSettings.jsx";

const DomainListEditor = ({ title, description, domains, onChange }) => {
  const [newDomain, setNewDomain] = useState("");

  const handleAdd = () => {
    const trimmed = newDomain.toLowerCase().trim();
    if (trimmed && !domains.includes(trimmed)) {
      onChange([...domains, trimmed]);
      setNewDomain("");
    }
  };

  const handleRemove = (domain) => {
    onChange(domains.filter((d) => d !== domain));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="example.com"
          fullWidth
        />
        <Button variant="outlined" onClick={handleAdd} startIcon={<Add />}>
          Add
        </Button>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {domains.map((domain) => (
          <Chip
            key={domain}
            label={domain}
            onDelete={() => handleRemove(domain)}
            size="small"
            variant="outlined"
          />
        ))}
        {domains.length === 0 && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No domains configured
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

const Page = () => {
  const settings = useSettings();
  const currentTenant = settings.currentTenant;
  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const spSettings = ApiGetCall({
    url: "/api/ListSharepointSettings",
    data: { tenantFilter: currentTenant },
    queryKey: `SharepointSettings-${currentTenant}`,
    waiting: true,
  });

  const updateSettings = ApiPostCall({
    relatedQueryKeys: [`SharepointSettings-${currentTenant}`],
  });

  useEffect(() => {
    if (currentTenant) {
      spSettings.refetch();
    }
  }, [currentTenant]);

  useEffect(() => {
    if (spSettings.data && !formData) {
      // The ListSharepointSettings endpoint returns an array, take the first item
      const data = Array.isArray(spSettings.data) ? spSettings.data[0] : spSettings.data;
      if (data) {
        setFormData({
          sharingCapability: data.sharingCapability ?? "disabled",
          sharingDomainRestrictionMode: data.sharingDomainRestrictionMode ?? "none",
          sharingAllowedDomainList: data.sharingAllowedDomainList ?? [],
          sharingBlockedDomainList: data.sharingBlockedDomainList ?? [],
          isResharingByExternalUsersEnabled: data.isResharingByExternalUsersEnabled ?? false,
          defaultSharingLinkType: data.defaultSharingLinkType ?? "specificPeople",
          defaultLinkPermission: data.defaultLinkPermission ?? "view",
          fileAnonymousLinkType: data.fileAnonymousLinkType ?? "view",
          folderAnonymousLinkType: data.folderAnonymousLinkType ?? "view",
          requireAnonymousLinksExpireInDays: data.requireAnonymousLinksExpireInDays ?? 0,
        });
      }
    }
  }, [spSettings.data]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleRefresh = () => {
    setFormData(null);
    setHasChanges(false);
    spSettings.refetch();
  };

  const handleSave = () => {
    const payload = {
      tenantFilter: currentTenant,
      sharingCapability: formData.sharingCapability,
      sharingDomainRestrictionMode: formData.sharingDomainRestrictionMode,
      isResharingByExternalUsersEnabled: formData.isResharingByExternalUsersEnabled,
      defaultSharingLinkType: formData.defaultSharingLinkType,
      defaultLinkPermission: formData.defaultLinkPermission,
      fileAnonymousLinkType: formData.fileAnonymousLinkType,
      folderAnonymousLinkType: formData.folderAnonymousLinkType,
      requireAnonymousLinksExpireInDays: formData.requireAnonymousLinksExpireInDays,
    };

    if (formData.sharingDomainRestrictionMode === "allowList") {
      payload.sharingAllowedDomainList = formData.sharingAllowedDomainList;
    } else if (formData.sharingDomainRestrictionMode === "blockList") {
      payload.sharingBlockedDomainList = formData.sharingBlockedDomainList;
    }

    updateSettings.mutate({
      url: "/api/EditSharepointSettings",
      data: payload,
    });
    setHasChanges(false);
  };

  if (!currentTenant || currentTenant === "AllTenants") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please select a specific tenant to manage SharePoint sharing settings.
        </Alert>
      </Box>
    );
  }

  const getSharingCapabilityLabel = (value) => {
    const labels = {
      disabled: "Internal only (no external sharing)",
      existingExternalUserSharingOnly: "Existing guests only",
      externalUserSharingOnly: "New and existing guests (must sign in)",
      externalUserAndGuestSharing: "Anyone (including anonymous links)",
    };
    return labels[value] ?? value;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            SharePoint Sharing Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage tenant-wide SharePoint and OneDrive external sharing, domain restrictions, and
            link defaults.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={spSettings.isFetching}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>

      <CippApiResults apiObject={updateSettings} />

      {spSettings.isFetching ? (
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={250} />
          <Skeleton variant="rectangular" height={200} />
        </Stack>
      ) : formData ? (
        <Stack spacing={3}>
          {/* Sharing Capability */}
          <Card>
            <CardHeader
              title="External Sharing Level"
              subheader="Controls the top-level sharing capability for SharePoint and OneDrive across the entire tenant. Site-level sharing cannot exceed this setting."
            />
            <CardContent>
              <CippRelatedSettings
                title="Other settings also gate external access"
                description="Even if SharePoint allows external sharing, access may still be blocked by Entra External Collaboration domain restrictions or Cross-Tenant Access Policy B2B settings. All layers must be permissive enough for external sharing to work."
                links={[
                  {
                    label: "External Collaboration (Entra)",
                    href: "/tenant/administration/cross-tenant-access/external-collaboration",
                  },
                  {
                    label: "Cross-Tenant Access Policy",
                    href: "/tenant/administration/cross-tenant-access/policy",
                  },
                ]}
              />
              <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <RadioGroup
                  value={formData.sharingCapability}
                  onChange={(e) => handleFieldChange("sharingCapability", e.target.value)}
                >
                  <FormControlLabel
                    value="disabled"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">
                          Only people in your organization (no external sharing)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No files or folders can be shared with anyone outside the organization.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="existingExternalUserSharingOnly"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">Existing guests only</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Allow sharing only with guests who are already in the directory. No new
                          guest invitations.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="externalUserSharingOnly"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">New and existing guests</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Guests must sign in or provide a verification code. New guests are added to
                          the directory.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="externalUserAndGuestSharing"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">
                          Anyone (including anonymous links)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Users can share with anyone using links that do not require sign-in. This
                          is the least restrictive setting.
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Domain Restrictions */}
          <Card>
            <CardHeader
              title="Sharing Domain Restrictions"
              subheader="Control which external domains users can share SharePoint and OneDrive content with. This is separate from Entra's B2B collaboration domain restrictions."
            />
            <CardContent>
              <Stack spacing={3}>
                <CippRelatedSettings
                  severity="warning"
                  title="This is a separate domain list from Entra"
                  description="This domain allow/deny list is specific to SharePoint and OneDrive sharing. Entra External Collaboration has its own separate domain list that controls B2B guest invitations across all Microsoft 365 services. Both lists must allow a domain for full external access to work."
                  links={[
                    {
                      label: "Entra External Collaboration",
                      href: "/tenant/administration/cross-tenant-access/external-collaboration",
                    },
                  ]}
                />
                <FormControl component="fieldset">
                  <RadioGroup
                    value={formData.sharingDomainRestrictionMode}
                    onChange={(e) =>
                      handleFieldChange("sharingDomainRestrictionMode", e.target.value)
                    }
                  >
                    <FormControlLabel
                      value="none"
                      control={<Radio />}
                      label="No domain restrictions (allow sharing with any domain)"
                    />
                    <FormControlLabel
                      value="allowList"
                      control={<Radio />}
                      label="Allow sharing only with specified domains (most restrictive)"
                    />
                    <FormControlLabel
                      value="blockList"
                      control={<Radio />}
                      label="Block sharing with specified domains"
                    />
                  </RadioGroup>
                </FormControl>

                {formData.sharingDomainRestrictionMode === "allowList" && (
                  <>
                    <Divider />
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Only users from the domains listed below will be able to receive sharing
                      invitations. All other domains are blocked.
                    </Alert>
                    <DomainListEditor
                      title="Allowed Domains"
                      description="Add domains that are permitted to receive shared content."
                      domains={formData.sharingAllowedDomainList}
                      onChange={(val) => handleFieldChange("sharingAllowedDomainList", val)}
                    />
                  </>
                )}

                {formData.sharingDomainRestrictionMode === "blockList" && (
                  <>
                    <Divider />
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Users from the domains listed below will be blocked from receiving sharing
                      invitations. All other domains are allowed.
                    </Alert>
                    <DomainListEditor
                      title="Blocked Domains"
                      description="Add domains that should be blocked from receiving shared content."
                      domains={formData.sharingBlockedDomainList}
                      onChange={(val) => handleFieldChange("sharingBlockedDomainList", val)}
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* External User Behavior */}
          <Card>
            <CardHeader
              title="External User Behavior"
              subheader="Configure how external users interact with shared content"
            />
            <CardContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isResharingByExternalUsersEnabled}
                      onChange={(e) =>
                        handleFieldChange("isResharingByExternalUsersEnabled", e.target.checked)
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Allow external users to reshare</Typography>
                      <Typography variant="body2" color="text.secondary">
                        When enabled, guests can share files and folders with other external users.
                        Disable to prevent guests from re-sharing content they received.
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Default Link Settings */}
          <Card>
            <CardHeader
              title="Default Sharing Link Settings"
              subheader="Configure the default link type and permissions when users share files and folders"
            />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Default sharing link type</InputLabel>
                  <Select
                    value={formData.defaultSharingLinkType}
                    onChange={(e) => handleFieldChange("defaultSharingLinkType", e.target.value)}
                    label="Default sharing link type"
                  >
                    <MenuItem value="specificPeople">
                      Specific people (only the people the user specifies)
                    </MenuItem>
                    <MenuItem value="organizationMembers">
                      Only people in your organization
                    </MenuItem>
                    <MenuItem value="anyone">Anyone with the link</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Default link permission</InputLabel>
                  <Select
                    value={formData.defaultLinkPermission}
                    onChange={(e) => handleFieldChange("defaultLinkPermission", e.target.value)}
                    label="Default link permission"
                  >
                    <MenuItem value="view">View only</MenuItem>
                    <MenuItem value="edit">Edit</MenuItem>
                  </Select>
                </FormControl>

                <Divider />

                {formData.sharingCapability === "externalUserAndGuestSharing" && (
                  <>
                    <Typography variant="subtitle2">Anonymous Link Settings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
                      These settings apply when &quot;Anyone&quot; links are used.
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>File anonymous link permission</InputLabel>
                        <Select
                          value={formData.fileAnonymousLinkType}
                          onChange={(e) =>
                            handleFieldChange("fileAnonymousLinkType", e.target.value)
                          }
                          label="File anonymous link permission"
                        >
                          <MenuItem value="view">View only</MenuItem>
                          <MenuItem value="edit">View and edit</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Folder anonymous link permission</InputLabel>
                        <Select
                          value={formData.folderAnonymousLinkType}
                          onChange={(e) =>
                            handleFieldChange("folderAnonymousLinkType", e.target.value)
                          }
                          label="Folder anonymous link permission"
                        >
                          <MenuItem value="view">View only</MenuItem>
                          <MenuItem value="edit">View and edit</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>

                    <TextField
                      type="number"
                      label="Anonymous link expiration (days)"
                      helperText="Set to 0 for no expiration. Recommended: 30 days or less."
                      value={formData.requireAnonymousLinksExpireInDays}
                      onChange={(e) =>
                        handleFieldChange(
                          "requireAnonymousLinksExpireInDays",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      inputProps={{ min: 0 }}
                      fullWidth
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : (
        <Alert severity="error">
          Failed to load SharePoint settings. Please try refreshing the page.
        </Alert>
      )}
    </Box>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
