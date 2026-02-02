import { TabbedLayout } from "../../../../layouts/TabbedLayout";
import { Layout as DashboardLayout } from "../../../../layouts/index.js";
import tabOptions from "../tabOptions";
import CippRoles from "../../../../components/CippSettings/CippRoles";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  Box,
  Link,
} from "@mui/material";
import { Grid, Stack } from "@mui/system";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import NextLink from "next/link";

const Page = () => {
  return (
    <Stack spacing={2}>
      {/* Info Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Alert severity="info" sx={{ height: "100%", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                About CIPP Roles
              </Typography>
              <Typography variant="body2">
                Custom roles restrict permissions for users with 'editor' or 'readonly' access in
                CIPP. Roles can limit access to specific tenants and API permissions. Both built-in
                and custom roles can be assigned to Entra security groups for granular access
                control.{" "}
                <Link
                  component={NextLink}
                  href="https://docs.cipp.app"
                  target="_blank"
                  rel="noreferrer"
                >
                  View documentation →
                </Link>
              </Typography>
            </Box>
          </Alert>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ py: 1.5 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        display: "flex",
                      }}
                    >
                      <ShieldCheckIcon style={{ width: 16, height: 16 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Built-in
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        System Roles
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: "success.main",
                        color: "success.contrastText",
                        display: "flex",
                      }}
                    >
                      <KeyIcon style={{ width: 16, height: 16 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Custom
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Your Roles
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Reference Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "action.selected",
                    display: "flex",
                  }}
                >
                  <UserGroupIcon style={{ width: 20, height: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Entra Group Assignment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assign roles to Entra security groups for automatic permission inheritance
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "action.selected",
                    display: "flex",
                  }}
                >
                  <BuildingOfficeIcon style={{ width: 20, height: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tenant Restrictions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allow or block access to specific tenants per role
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "action.selected",
                    display: "flex",
                  }}
                >
                  <KeyIcon style={{ width: 20, height: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    API Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Control which CIPP API endpoints each role can access
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Roles Table */}
      <CippRoles />
    </Stack>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
