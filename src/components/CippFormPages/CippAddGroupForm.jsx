import { Alert, Box, Divider, InputAdornment, Typography, Link } from "@mui/material";
import { Grid } from "@mui/system";
import CippFormComponent from "/src/components/CippComponents/CippFormComponent";
import { CippFormCondition } from "/src/components/CippComponents/CippFormCondition";
import { CippFormDomainSelector } from "../CippComponents/CippFormDomainSelector";
import { CippFormUserSelector } from "../CippComponents/CippFormUserSelector";
import { useWatch } from "react-hook-form";

// Group type definitions with descriptions
const groupTypeOptions = [
  {
    label: "Security Group",
    value: "generic",
    description: "Control access to resources like SharePoint sites, applications, and Azure resources. No email capabilities.",
  },
  {
    label: "Microsoft 365 Group",
    value: "m365",
    description: "Collaborative group with shared mailbox, calendar, files, and Teams integration.",
  },
  {
    label: "Distribution List",
    value: "distribution",
    description: "Email distribution group for sending messages to multiple recipients.",
  },
  {
    label: "Mail Enabled Security Group",
    value: "security",
    description: "Security group that can also receive email. Combines access control with email distribution.",
  },
  {
    label: "Dynamic Group",
    value: "dynamic",
    description: "Security group with automatic membership based on user attributes (e.g., department, job title).",
  },
  {
    label: "Dynamic Distribution Group",
    value: "dynamicdistribution",
    description: "Email distribution group with automatic membership based on recipient attributes.",
  },
  {
    label: "Azure Role Group",
    value: "azurerole",
    description: "Privileged group that can be assigned to Azure AD roles. Use for administrative access.",
  },
];

// Helper function to get description for selected group type
const getGroupTypeDescription = (groupType) => {
  const option = groupTypeOptions.find((opt) => opt.value === groupType);
  return option?.description || "";
};

const CippAddGroupForm = (props) => {
  const { formControl } = props;
  const selectedGroupType = useWatch({ control: formControl.control, name: "groupType" });

  return (
    <Grid container spacing={2}>
      {/* Section 1: Group Type Selection */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Group Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the type of group you want to create. This determines the available features and settings.
        </Typography>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <CippFormComponent
          type="radio"
          name="groupType"
          formControl={formControl}
          options={groupTypeOptions.map(({ label, value }) => ({ label, value }))}
          required={true}
        />
      </Grid>

      {/* Show description for selected group type */}
      {selectedGroupType && (
        <Grid size={{ xs: 12 }}>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>{groupTypeOptions.find((opt) => opt.value === selectedGroupType)?.label}:</strong>{" "}
              {getGroupTypeDescription(selectedGroupType)}
            </Typography>
          </Alert>
        </Grid>
      )}

      {/* Only show rest of form after group type is selected */}
      {selectedGroupType && (
        <>
          {/* Section 2: Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CippFormComponent
              type="textField"
              label="Display Name"
              name="displayName"
              formControl={formControl}
              fullWidth
              required={true}
              placeholder="Enter a name for the group"
              helperText="The name that will be displayed in the address book and group lists"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CippFormComponent
              type="textField"
              label="Description"
              name="description"
              formControl={formControl}
              fullWidth
              placeholder="Enter a description for the group (optional)"
              helperText="Help others understand the purpose of this group"
            />
          </Grid>

          {/* Section 3: Email Settings - Only for email-enabled groups */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="isOneOf"
            compareValue={["m365", "distribution", "dynamicdistribution", "security"]}
          >
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Email Settings
              </Typography>
            </Grid>

            <Grid size={{ md: 6, xs: 12 }}>
              <CippFormComponent
                type="textField"
                label="Email Prefix"
                name="username"
                formControl={formControl}
                fullWidth
                required={true}
                placeholder="e.g., sales-team"
                InputProps={{
                  endAdornment: <InputAdornment position="end">@</InputAdornment>,
                }}
                helperText="The part before @ in the group's email address"
              />
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <CippFormDomainSelector
                formControl={formControl}
                name="primDomain"
                label="Domain"
                required={true}
              />
            </Grid>
          </CippFormCondition>

          {/* Section 4: Dynamic Membership Rules - Only for dynamic groups */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="isOneOf"
            compareValue={["dynamic", "dynamicdistribution"]}
          >
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dynamic Membership Rules
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define rules to automatically add or remove members based on user attributes.{" "}
                <Link
                  href="https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about dynamic membership rules
                </Link>
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CippFormComponent
                type="textField"
                label="Membership Rule"
                name="membershipRules"
                formControl={formControl}
                placeholder='Example: (user.department -eq "Sales") -or (user.department -eq "Marketing")'
                multiline
                rows={4}
                fullWidth
                required={true}
                helperText="Enter a dynamic membership rule using OData filter syntax"
              />
            </Grid>
          </CippFormCondition>

          {/* Section 5: Members & Owners - Only for non-dynamic groups */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="isNotOneOf"
            compareValue={["dynamic", "dynamicdistribution"]}
          >
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Members & Owners
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add owners to manage the group and members who will be part of it. You can also add members later.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CippFormUserSelector
                formControl={formControl}
                name="owners"
                label="Owners (Optional)"
                multiple={true}
                select={"id,userPrincipalName,displayName"}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Owners can manage group membership and settings
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CippFormUserSelector
                formControl={formControl}
                name="members"
                label="Members (Optional)"
                multiple={true}
                select={"id,userPrincipalName,displayName"}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Members will have access to group resources
              </Typography>
            </Grid>
          </CippFormCondition>

          {/* Section 6: Additional Settings */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="isOneOf"
            compareValue={["distribution", "dynamicdistribution", "m365"]}
          >
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Additional Settings
              </Typography>
            </Grid>
          </CippFormCondition>

          {/* External senders option for distribution groups */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="isOneOf"
            compareValue={["distribution", "dynamicdistribution"]}
          >
            <Grid size={{ xs: 12 }}>
              <CippFormComponent
                type="switch"
                label="Allow external senders"
                name="allowExternal"
                formControl={formControl}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 6 }}>
                When enabled, people outside your organization can send email to this group
              </Typography>
            </Grid>
          </CippFormCondition>

          {/* Subscribe members option for M365 groups */}
          <CippFormCondition
            formControl={formControl}
            field="groupType"
            compareType="is"
            compareValue="m365"
          >
            <Grid size={{ xs: 12 }}>
              <CippFormComponent
                type="switch"
                label="Auto-subscribe members to group emails"
                name="subscribeMembers"
                formControl={formControl}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 6 }}>
                Members will automatically receive copies of group conversations in their inbox
              </Typography>
            </Grid>
          </CippFormCondition>
        </>
      )}

      {/* Initial prompt when no group type selected */}
      {!selectedGroupType && (
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              backgroundColor: "action.hover",
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a group type above to continue
            </Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default CippAddGroupForm;
