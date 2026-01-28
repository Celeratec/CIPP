import { Alert, Stack, Typography, Card, CardContent, CardHeader, Divider, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CippWizardStepButtons from "./CippWizardStepButtons";
import CippFormComponent from "../CippComponents/CippFormComponent";
import { CippFormCondition } from "../CippComponents/CippFormCondition";
import { useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { Grid } from "@mui/system";
import { useSettings } from "../../hooks/use-settings";

export const CippWizardOffboarding = (props) => {
  const { postUrl, formControl, onPreviousStep, onNextStep, currentStep } = props;
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const currentTenant = formControl.watch("tenantFilter");
  const selectedUsers = useWatch({ control: formControl.control, name: "user" }) || [];
  const [showAlert, setShowAlert] = useState(false);
  const userSettingsDefaults = useSettings().userSettingsDefaults;
  const disableForwarding = useWatch({ control: formControl.control, name: "disableForwarding" });

  useEffect(() => {
    if (selectedUsers.length >= 3) {
      setShowAlert(true);
      formControl.setValue("Scheduled.enabled", true);
    }
  }, [selectedUsers]);

  // Set initial defaults source on component mount if not already set
  useEffect(() => {
    const currentDefaultsSource = formControl.getValues("HIDDEN_defaultsSource");
    if (!currentDefaultsSource) {
      // Default to user defaults since form starts with user defaults from initialState within the wizard component
      formControl.setValue("HIDDEN_defaultsSource", "user");
    }
  }, [formControl]);

  // Apply defaults only once per tenant or when tenant changes
  useEffect(() => {
    const currentTenantId = currentTenant?.value;
    const appliedDefaultsForTenant = formControl.getValues("HIDDEN_appliedDefaultsForTenant");
    
    // Only apply defaults if we haven't applied them for this tenant yet
    if (currentTenantId && appliedDefaultsForTenant !== currentTenantId) {
      const tenantDefaults = currentTenant?.addedFields?.offboardingDefaults;
      
      if (tenantDefaults) {
        // Apply tenant defaults
        Object.entries(tenantDefaults).forEach(([key, value]) => {
          formControl.setValue(key, value);
        });
        // Set the source indicator
        formControl.setValue("HIDDEN_defaultsSource", "tenant");
      } else if (userSettingsDefaults?.offboardingDefaults) {
        // Apply user defaults if no tenant defaults
        userSettingsDefaults.offboardingDefaults.forEach((setting) => {
          formControl.setValue(setting.name, setting.value);
        });
        // Set the source indicator
        formControl.setValue("HIDDEN_defaultsSource", "user");
      }
      
      // Mark that we've applied defaults for this tenant
      formControl.setValue("HIDDEN_appliedDefaultsForTenant", currentTenantId);
    }
  }, [currentTenant?.value, userSettingsDefaults, formControl]);

  useEffect(() => {
    if (disableForwarding) {
      formControl.setValue("forward", null);
      formControl.setValue("KeepCopy", false);
    }
  }, [disableForwarding, formControl]);

  const getDefaultsSource = () => {
    return formControl.getValues("HIDDEN_defaultsSource") || "user";
  };

  return (
    <Stack spacing={{ xs: 2, md: 4 }}>
      <Grid container spacing={{ xs: 2, md: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card variant="outlined">
            <CardHeader 
              title="Offboarding Settings" 
              titleTypographyProps={{ variant: smDown ? "subtitle1" : "h6" }}
              sx={{ py: smDown ? 1.5 : 2, px: smDown ? 2 : 3 }}
            />
            <Divider />
            <CardContent sx={{ px: smDown ? 2 : 3, py: smDown ? 1.5 : 2 }}>
              <Stack spacing={smDown ? 1 : 1.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: getDefaultsSource() === "tenant" ? "primary.main" : "warning.main",
                    fontStyle: "italic",
                  }}
                >
                  {getDefaultsSource() === "tenant" ? "Using Tenant Defaults" : "Using User Defaults"}
                </Typography>
                <Stack spacing={smDown ? 0.5 : 1}>
                  <CippFormComponent
                    name="ConvertToShared"
                    label="Convert to Shared Mailbox"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="HideFromGAL"
                    label="Hide from Global Address List"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="removeCalendarInvites"
                    label="Cancel all calendar invites"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="removePermissions"
                    label="Remove user's mailbox permissions"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveRules"
                    label="Remove all Rules"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveMobile"
                    label="Remove all Mobile Devices"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveGroups"
                    label="Remove from all groups"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveLicenses"
                    label="Remove Licenses"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RevokeSessions"
                    label="Revoke all sessions"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="DisableSignIn"
                    label="Disable Sign in"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="ClearImmutableId"
                    label="Clear Immutable ID"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="ResetPass"
                    label="Reset Password"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveMFADevices"
                    label="Remove all MFA Devices"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="RemoveTeamsPhoneDID"
                    label="Remove Teams Phone DID"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="DeleteUser"
                    label="Delete user"
                    type="switch"
                    formControl={formControl}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card variant="outlined">
            <CardHeader 
              title="Permissions and forwarding" 
              titleTypographyProps={{ variant: smDown ? "subtitle1" : "h6" }}
              sx={{ py: smDown ? 1.5 : 2, px: smDown ? 2 : 3 }}
            />
            <Divider />
            <CardContent sx={{ px: smDown ? 2 : 3, py: smDown ? 1.5 : 2 }}>
              <Stack spacing={smDown ? 2 : 2.5}>
                <Stack spacing={smDown ? 1 : 1.5}>
                  <Typography variant={smDown ? "body2" : "subtitle2"} fontWeight={600}>Mailbox Access</Typography>
                  <CippFormComponent
                    name="AccessNoAutomap"
                    label="Grant Full Access (no automap)"
                    type="autoComplete"
                    placeholder="Leave blank if not needed"
                    formControl={formControl}
                    multi
                    api={{
                      tenantFilter: currentTenant ? currentTenant.value : undefined,
                      url: "/api/ListGraphRequest",
                      dataKey: "Results",
                      labelField: (option) => `${option.displayName} (${option.userPrincipalName})`,
                      valueField: "userPrincipalName",
                      queryKey: "Offboarding-Users",
                      data: {
                        Endpoint: "users",
                        manualPagination: true,
                        $select: "id,userPrincipalName,displayName",
                        $count: true,
                        $orderby: "displayName",
                        $top: 999,
                      },
                    }}
                  />
                  <CippFormComponent
                    name="AccessAutomap"
                    label="Grant Full Access (automap)"
                    type="autoComplete"
                    placeholder="Leave blank if not needed"
                    formControl={formControl}
                    multi
                    api={{
                      labelField: (option) => `${option.displayName} (${option.userPrincipalName})`,
                      valueField: "userPrincipalName",
                      url: "/api/ListGraphRequest",
                      dataKey: "Results",
                      tenantFilter: currentTenant ? currentTenant.value : undefined,
                      queryKey: "Offboarding-Users",
                      data: {
                        Endpoint: "users",
                        manualPagination: true,
                        $select: "id,userPrincipalName,displayName",
                        $count: true,
                        $orderby: "displayName",
                        $top: 999,
                      },
                    }}
                  />
                  <CippFormComponent
                    name="OnedriveAccess"
                    label="Grant Onedrive Full Access"
                    type="autoComplete"
                    placeholder="Leave blank if not needed"
                    formControl={formControl}
                    multi
                    api={{
                      tenantFilter: currentTenant ? currentTenant.value : undefined,
                      labelField: (option) => `${option.displayName} (${option.userPrincipalName})`,
                      valueField: "userPrincipalName",
                      url: "/api/ListGraphRequest",
                      dataKey: "Results",
                      queryKey: "Offboarding-Users",
                      data: {
                        Endpoint: "users",
                        manualPagination: true,
                        $select: "id,userPrincipalName,displayName",
                        $count: true,
                        $orderby: "displayName",
                        $top: 999,
                      },
                    }}
                  />
                </Stack>

                <Stack spacing={smDown ? 1 : 1.5}>
                  <Typography variant={smDown ? "body2" : "subtitle2"} fontWeight={600}>Email Forwarding</Typography>
                  <CippFormComponent
                    name="disableForwarding"
                    label="Disable Email Forwarding"
                    type="switch"
                    formControl={formControl}
                  />

                  <CippFormCondition
                    formControl={formControl}
                    field={"disableForwarding"}
                    compareType="isNot"
                    compareValue={true}
                  >
                    <Stack spacing={smDown ? 1 : 1.5}>
                      <CippFormComponent
                        name="forward"
                        label="Forward Email To"
                        type="autoComplete"
                        placeholder="Leave blank if not needed"
                        formControl={formControl}
                        multiple={false}
                        api={{
                          tenantFilter: currentTenant ? currentTenant.value : undefined,
                          labelField: (option) => `${option.displayName} (${option.userPrincipalName})`,
                          valueField: "userPrincipalName",
                          url: "/api/ListGraphRequest",
                          dataKey: "Results",
                          queryKey: "Offboarding-Users",
                          data: {
                            Endpoint: "users",
                            manualPagination: true,
                            $select: "id,userPrincipalName,displayName",
                            $count: true,
                            $orderby: "displayName",
                            $top: 999,
                          },
                        }}
                      />
                      <CippFormComponent
                        name="KeepCopy"
                        label="Keep a copy of forwarded mail"
                        type="switch"
                        formControl={formControl}
                      />
                    </Stack>
                  </CippFormCondition>
                </Stack>

                <Stack spacing={smDown ? 1 : 1.5}>
                  <Typography variant={smDown ? "body2" : "subtitle2"} fontWeight={600}>Out of Office</Typography>
                  <CippFormComponent
                    name="OOO"
                    label="Out of Office Message"
                    type="richText"
                    placeholder="Leave blank to not set"
                    fullWidth
                    formControl={formControl}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {showAlert && (
        <Alert severity="warning" sx={{ py: smDown ? 1 : 1.5 }}>
          {smDown 
            ? "3+ users selected. Scheduling required." 
            : "You have selected more than 2 users. This offboarding must be scheduled."
          }
        </Alert>
      )}

      <Card variant="outlined">
        <CardHeader 
          title="Scheduling & Notifications" 
          titleTypographyProps={{ variant: smDown ? "subtitle1" : "h6" }}
          sx={{ py: smDown ? 1.5 : 2, px: smDown ? 2 : 3 }}
        />
        <Divider />
        <CardContent sx={{ px: smDown ? 2 : 3, py: smDown ? 1.5 : 2 }}>
          <Grid container spacing={{ xs: 1.5, md: 3 }}>
            <Grid size={{ xs: 12 }}>
              <CippFormComponent
                name="Scheduled.enabled"
                label="Schedule this offboarding"
                type="switch"
                formControl={formControl}
              />
            </Grid>

            <CippFormCondition
              formControl={formControl}
              field={"Scheduled.enabled"}
              compareType="is"
              compareValue={true}
            >
              <Grid size={{ sm: 6, xs: 12 }}>
                <Typography variant={smDown ? "body2" : "subtitle2"} fontWeight={600} sx={{ mb: 0.5 }}>
                  Scheduled Offboarding Date
                </Typography>
                <CippFormComponent
                  name="Scheduled.date"
                  type="datePicker"
                  formControl={formControl}
                  fullWidth
                />
              </Grid>

              <Grid size={{ sm: 6, xs: 12 }}>
                <Typography variant={smDown ? "body2" : "subtitle2"} fontWeight={600} sx={{ mb: 0.5 }}>
                  Send results to:
                </Typography>
                <Stack spacing={smDown ? 0.5 : 1}>
                  <CippFormComponent
                    name="postExecution.webhook"
                    label="Webhook"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="postExecution.email"
                    label="E-mail"
                    type="switch"
                    formControl={formControl}
                  />
                  <CippFormComponent
                    name="postExecution.psa"
                    label="PSA"
                    type="switch"
                    formControl={formControl}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <CippFormComponent
                  type="textField"
                  fullWidth
                  label="Reference"
                  name="reference"
                  placeholder={smDown ? "Add a reference" : "Enter a reference that will be added to the notification title and scheduled task"}
                  formControl={formControl}
                />
              </Grid>
            </CippFormCondition>
          </Grid>
        </CardContent>
      </Card>

      <CippWizardStepButtons
        postUrl={postUrl}
        currentStep={currentStep}
        onPreviousStep={onPreviousStep}
        onNextStep={onNextStep}
        formControl={formControl}
        replacementBehaviour="removeNulls"
        sticky={true}
      />
    </Stack>
  );
};
